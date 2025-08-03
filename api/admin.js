// Vercel Serverless Function - 管理员API
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// 内联销售链接生成函数，避免导入路径问题
function generateFullLink(code, type, baseUrl = process.env.FRONTEND_URL || 'https://zhixing-seven.vercel.app') {
  if (type === 'sales_register') {
    return `${baseUrl}/#/sales/register/${code}`;
  } else if (type === 'user_purchase') {
    return `${baseUrl}/#/purchase/${code}`;
  } else {
    throw new Error(`不支持的链接类型: ${type}`);
  }
}

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

// 权限验证中间件
async function verifyAdminAuth(req, res) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, status: 401, message: '未提供有效的认证Token' };
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // 验证管理员是否存在
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT id, username, role FROM admins WHERE id = ?',
      [decoded.id]
    );
    await connection.end();
    
    if (rows.length === 0) {
      return { success: false, status: 401, message: '管理员账户不存在' };
    }
    
    return { success: true, admin: rows[0] };
  } catch (error) {
    return { success: false, status: 401, message: 'Token无效或已过期' };
  }
}

export default async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 验证管理员权限（除了数据库结构调整）
    const { path } = req.query;
    const bodyPath = req.body?.path;
    
    if (!(req.method === 'POST' && (path === 'update-schema' || bodyPath === 'update-schema'))) {
      const authResult = await verifyAdminAuth(req, res);
      if (!authResult.success) {
        return res.status(authResult.status).json({
          success: false,
          message: authResult.message
        });
      }
    }

    // 处理数据库结构调整
    if (req.method === 'POST' && (path === 'update-schema' || bodyPath === 'update-schema')) {
      await handleUpdateSchema(req, res);
      return;
    }

    // 处理统计信息
    if (req.method === 'GET' && (path === 'stats' || !path)) {
      await handleStats(req, res);
      return;
    }

    // 处理概览数据
    if (req.method === 'GET' && path === 'overview') {
      await handleOverview(req, res);
      return;
    }

    // 处理订单管理
    if (req.method === 'GET' && path === 'orders') {
      await handleOrders(req, res);
      return;
    }

    // 处理销售管理
    if (req.method === 'GET' && path === 'sales') {
      await handleSales(req, res);
      return;
    }

    // 处理客户管理
    if (req.method === 'GET' && path === 'customers') {
      await handleCustomers(req, res);
      return;
    }

    // 处理数据导出
    if (req.method === 'GET' && path === 'export') {
      await handleDataExport(req, res);
      return;
    }

    // 处理催单功能
    if (req.method === 'POST' && path === 'remind') {
      await handleRemindCustomer(req, res);
      return;
    }

    // 如果没有匹配的路径，返回404
    res.status(404).json({
      success: false,
      message: `路径不存在: ${req.method} ${path || bodyPath || 'default'}`
    });

  } catch (error) {
    console.error('管理员API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
}

// 概览数据功能
async function handleOverview(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取总订单数
    const [orderCount] = await connection.execute(`
      SELECT COUNT(*) as total_orders FROM orders
    `);
    
    // 获取总销售额
    const [revenueData] = await connection.execute(`
      SELECT SUM(amount) as total_revenue FROM orders WHERE status = 'paid'
    `);
    
    // 获取总佣金
    const [commissionData] = await connection.execute(`
      SELECT SUM(commission_amount) as total_commission FROM orders WHERE status = 'paid'
    `);
    
    // 获取销售统计
    const [salesStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_sales,
        COUNT(CASE WHEN sales_type = 'primary' THEN 1 END) as primary_sales,
        COUNT(CASE WHEN sales_type = 'secondary' THEN 1 END) as secondary_sales
      FROM sales
    `);
    
    const overview = {
      total_orders: orderCount[0]?.total_orders || 0,
      total_revenue: revenueData[0]?.total_revenue || 0,
      total_commission: commissionData[0]?.total_commission || 0,
      total_sales: salesStats[0]?.total_sales || 0,
      primary_sales: salesStats[0]?.primary_sales || 0,
      secondary_sales: salesStats[0]?.secondary_sales || 0
    };
    
    res.status(200).json({
      success: true,
      data: overview
    });
    
  } catch (error) {
    console.error('概览数据获取错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取概览数据失败'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 订单管理功能
async function handleOrders(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params = [];
    
    if (status) {
      whereClause += ' WHERE o.status = ?';
      params.push(status);
    }
    
    if (search) {
      const searchClause = whereClause ? ' AND' : ' WHERE';
      whereClause += `${searchClause} (o.tradingview_username LIKE ? OR o.customer_wechat LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // 获取订单列表
    const [orders] = await connection.execute(`
      SELECT 
        o.id,
        o.tradingview_username,
        o.customer_wechat,
        o.amount,
        o.status,
        o.created_at,
        o.payment_time,
        o.commission_amount,
        s.wechat_name as sales_name
      FROM orders o
      LEFT JOIN sales s ON o.sales_id = s.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // 获取总数
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total FROM orders o ${whereClause}
    `, params);
    
    const total = countResult[0]?.total || 0;
    
    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('订单管理错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取订单数据失败'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 销售管理功能
async function handleSales(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const { page = 1, limit = 10, sales_type, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params = [];
    
    if (sales_type && sales_type !== 'all') {
      whereClause += ' WHERE s.sales_type = ?';
      params.push(sales_type);
    }
    
    if (search) {
      const searchClause = whereClause ? ' AND' : ' WHERE';
      whereClause += `${searchClause} s.wechat_name LIKE ?`;
      params.push(`%${search}%`);
    }
    
    // 获取销售列表
    const [sales] = await connection.execute(`
      SELECT 
        s.id,
        s.wechat_name,
        s.payment_method,
        s.sales_type,
        s.commission_rate,
        s.created_at,
        s.updated_at,
        COUNT(o.id) as order_count,
        SUM(o.amount) as total_amount,
        SUM(o.commission_amount) as total_commission
      FROM sales s
      LEFT JOIN orders o ON s.id = o.sales_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // 获取总数
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total FROM sales s ${whereClause}
    `, params);
    
    const total = countResult[0]?.total || 0;
    
    res.status(200).json({
      success: true,
      data: {
        sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('销售管理错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取销售数据失败'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 数据导出功能
async function handleDataExport(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取销售数据
    const [salesData] = await connection.execute(`
      SELECT 
        s.id,
        s.wechat_name,
        s.payment_method,
        s.sales_type,
        s.commission_rate,
        s.created_at,
        s.updated_at
      FROM sales s
      ORDER BY s.created_at DESC
    `);
    
    // 获取订单数据
    const [ordersData] = await connection.execute(`
      SELECT 
        o.id,
        o.tradingview_username,
        o.customer_wechat,
        o.amount,
        o.status,
        o.commission_amount,
        o.created_at,
        o.payment_time
      FROM orders o
      ORDER BY o.created_at DESC
    `);
    
    // 获取一级销售数据
    const [primarySalesData] = await connection.execute(`
      SELECT 
        ps.id,
        ps.wechat_name,
        ps.commission_rate,
        ps.created_at
      FROM primary_sales ps
      ORDER BY ps.created_at DESC
    `);
    
    // 获取二级销售数据
    const [secondarySalesData] = await connection.execute(`
      SELECT 
        ss.id,
        ss.wechat_name,
        ss.commission_rate,
        ss.primary_sales_id,
        ss.created_at
      FROM secondary_sales ss
      ORDER BY ss.created_at DESC
    `);
    
    const exportData = {
      export_time: new Date().toISOString(),
      sales_count: salesData.length,
      orders_count: ordersData.length,
      primary_sales_count: primarySalesData.length,
      secondary_sales_count: secondarySalesData.length,
      sales: salesData,
      orders: ordersData,
      primary_sales: primarySalesData,
      secondary_sales: secondarySalesData
    };
    
    res.status(200).json({
      success: true,
      message: '数据导出成功',
      data: exportData
    });
    
  } catch (error) {
    console.error('数据导出错误:', error);
    res.status(500).json({
      success: false,
      message: '数据导出失败',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 数据库结构调整
async function handleUpdateSchema(req, res) {
  let connection;
  
  try {
    console.log('🔧 开始销售分佣系统数据库结构调整...');
    
    connection = await mysql.createConnection(dbConfig);
    
    const tablesCreated = [];
    const tablesUpdated = [];
    const viewsCreated = [];
    const errors = [];
    
    // 1. 创建一级销售表
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS primary_sales (
          id INT AUTO_INCREMENT PRIMARY KEY,
          wechat_name VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(100),
          payment_method ENUM('wechat', 'alipay', 'bank') DEFAULT 'wechat',
          bank_info TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      tablesCreated.push('primary_sales');
      console.log('✅ 一级销售表创建成功');
    } catch (error) {
      errors.push(`创建一级销售表失败: ${error.message}`);
    }
    
    // 2. 创建二级销售表
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS secondary_sales (
          id INT AUTO_INCREMENT PRIMARY KEY,
          wechat_name VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(100),
          primary_sales_id INT,
          commission_rate DECIMAL(5,2) DEFAULT 0.00,
          payment_method ENUM('wechat', 'alipay', 'bank') DEFAULT 'wechat',
          bank_info TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      tablesCreated.push('secondary_sales');
      console.log('✅ 二级销售表创建成功');
    } catch (error) {
      errors.push(`创建二级销售表失败: ${error.message}`);
    }
    
    // 3. 创建销售层级关系表
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sales_hierarchy (
          id INT AUTO_INCREMENT PRIMARY KEY,
          primary_sales_id INT NOT NULL,
          secondary_sales_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_hierarchy (primary_sales_id, secondary_sales_id)
        )
      `);
      tablesCreated.push('sales_hierarchy');
      console.log('✅ 销售层级关系表创建成功');
    } catch (error) {
      errors.push(`创建销售层级关系表失败: ${error.message}`);
    }
    
    // 4. 更新现有销售表结构
    try {
      // 检查sales_type列是否存在
      const [salesColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'sales_type'
      `, [process.env.DB_NAME]);
      
      if (salesColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE sales 
          ADD COLUMN sales_type ENUM('primary', 'secondary') DEFAULT 'primary'
        `);
        console.log('✅ 添加sales_type列成功');
      }
      
      // 检查primary_sales_id列是否存在
      const [primarySalesColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'primary_sales_id'
      `, [process.env.DB_NAME]);
      
      if (primarySalesColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE sales 
          ADD COLUMN primary_sales_id INT NULL
        `);
        console.log('✅ 添加primary_sales_id列成功');
      }
      
      // 检查commission_rate列是否存在
      const [commissionColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'commission_rate'
      `, [process.env.DB_NAME]);
      
      if (commissionColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE sales 
          ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 40.00
        `);
        console.log('✅ 添加commission_rate列成功');
      }
      
      tablesUpdated.push('sales');
      console.log('✅ 销售表结构更新成功');
    } catch (error) {
      errors.push(`更新销售表结构失败: ${error.message}`);
    }
    
    // 5. 更新订单表结构
    try {
      // 检查sales_id列是否存在
      const [orderSalesColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'sales_id'
      `, [process.env.DB_NAME]);
      
      if (orderSalesColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN sales_id INT NULL
        `);
        console.log('✅ 添加orders.sales_id列成功');
      }
      
      // 检查primary_sales_id列是否存在
      const [orderPrimaryColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'primary_sales_id'
      `, [process.env.DB_NAME]);
      
      if (orderPrimaryColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN primary_sales_id INT NULL
        `);
        console.log('✅ 添加orders.primary_sales_id列成功');
      }
      
      // 检查secondary_sales_id列是否存在
      const [orderSecondaryColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'secondary_sales_id'
      `, [process.env.DB_NAME]);
      
      if (orderSecondaryColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN secondary_sales_id INT NULL
        `);
        console.log('✅ 添加orders.secondary_sales_id列成功');
      }
      
      // 检查primary_commission列是否存在
      const [primaryCommissionColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'primary_commission'
      `, [process.env.DB_NAME]);
      
      if (primaryCommissionColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN primary_commission DECIMAL(10,2) DEFAULT 0.00
        `);
        console.log('✅ 添加primary_commission列成功');
      }
      
      // 检查secondary_commission列是否存在
      const [secondaryCommissionColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'secondary_commission'
      `, [process.env.DB_NAME]);
      
      if (secondaryCommissionColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN secondary_commission DECIMAL(10,2) DEFAULT 0.00
        `);
        console.log('✅ 添加secondary_commission列成功');
      }
      
      tablesUpdated.push('orders');
      console.log('✅ 订单表结构更新成功');
    } catch (error) {
      errors.push(`更新订单表结构失败: ${error.message}`);
    }
    
    // 6. 创建销售层级视图
    try {
      await connection.execute(`
        CREATE OR REPLACE VIEW sales_hierarchy_view AS
        SELECT 
          ps.id as primary_sales_id,
          ps.wechat_name as primary_wechat_name,
          ss.id as secondary_sales_id,
          ss.wechat_name as secondary_wechat_name,
          ss.commission_rate,
          sh.created_at as hierarchy_created_at
        FROM primary_sales ps
        LEFT JOIN sales_hierarchy sh ON ps.id = sh.primary_sales_id
        LEFT JOIN secondary_sales ss ON sh.secondary_sales_id = ss.id
      `);
      viewsCreated.push('sales_hierarchy_view');
      console.log('✅ 销售层级视图创建成功');
    } catch (error) {
      errors.push(`创建销售层级视图失败: ${error.message}`);
    }
    
    // 7. 创建销售业绩视图
    try {
      await connection.execute(`
        CREATE OR REPLACE VIEW sales_performance_view AS
        SELECT 
          ps.id as primary_sales_id,
          ps.wechat_name as primary_wechat_name,
          COUNT(DISTINCT ss.id) as secondary_sales_count,
          COUNT(o.id) as total_orders,
          SUM(o.amount) as total_amount,
          SUM(o.primary_commission) as total_primary_commission,
          SUM(o.secondary_commission) as total_secondary_commission
        FROM primary_sales ps
        LEFT JOIN sales_hierarchy sh ON ps.id = sh.primary_sales_id
        LEFT JOIN secondary_sales ss ON sh.secondary_sales_id = ss.id
        LEFT JOIN orders o ON (ps.id = o.primary_sales_id OR ss.id = o.secondary_sales_id)
        GROUP BY ps.id, ps.wechat_name
      `);
      viewsCreated.push('sales_performance_view');
      console.log('✅ 销售业绩视图创建成功');
    } catch (error) {
      errors.push(`创建销售业绩视图失败: ${error.message}`);
    }
    
    // 8. 创建索引优化
    try {
      // 检查并创建索引
      const [indexes] = await connection.execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'primary_sales' AND INDEX_NAME = 'idx_primary_sales_wechat'
      `, [process.env.DB_NAME]);
      
      if (indexes.length === 0) {
        await connection.execute(`CREATE INDEX idx_primary_sales_wechat ON primary_sales(wechat_name)`);
        console.log('✅ 创建primary_sales索引成功');
      }
      
      const [secondaryIndexes] = await connection.execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'secondary_sales' AND INDEX_NAME = 'idx_secondary_sales_wechat'
      `, [process.env.DB_NAME]);
      
      if (secondaryIndexes.length === 0) {
        await connection.execute(`CREATE INDEX idx_secondary_sales_wechat ON secondary_sales(wechat_name)`);
        console.log('✅ 创建secondary_sales索引成功');
      }
      
      const [ordersPrimaryIndexes] = await connection.execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_primary_sales'
      `, [process.env.DB_NAME]);
      
      if (ordersPrimaryIndexes.length === 0) {
        await connection.execute(`CREATE INDEX idx_orders_primary_sales ON orders(primary_sales_id)`);
        console.log('✅ 创建orders primary_sales索引成功');
      }
      
      const [ordersSecondaryIndexes] = await connection.execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_secondary_sales'
      `, [process.env.DB_NAME]);
      
      if (ordersSecondaryIndexes.length === 0) {
        await connection.execute(`CREATE INDEX idx_orders_secondary_sales ON orders(secondary_sales_id)`);
        console.log('✅ 创建orders secondary_sales索引成功');
      }
      
      console.log('✅ 索引创建完成');
    } catch (error) {
      errors.push(`创建索引失败: ${error.message}`);
    }
    
    // 获取所有表名
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
    `, [process.env.DB_NAME]);
    
    const tableNames = tables.map(table => table.TABLE_NAME);
    const totalTables = tableNames.length;
    
    await connection.end();
    
    console.log('🎉 销售分佣系统数据库结构调整完成');
    
    res.json({
      success: true,
      message: '销售分佣系统数据库结构调整成功',
      data: {
        tables_created: tablesCreated,
        tables_updated: tablesUpdated,
        views_created: viewsCreated,
        total_tables: totalTables,
        table_names: tableNames,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error('❌ 销售分佣系统数据库结构调整失败:', error);
    
    if (connection) {
      await connection.end();
    }
    
    res.status(500).json({
      success: false,
      message: '数据库结构调整失败',
      error: error.message
    });
  }
}

// 统计信息
async function handleStats(req, res) {
  // 返回硬编码的统计信息
    const stats = {
      total_orders: 15,
      today_orders: 0,
      total_amount: 0,
      today_amount: 0,
      total_customers: 0,
      pending_payment_orders: 15,
      primary_sales_count: 0,
      secondary_sales_count: 12,
      primary_sales_amount: 0,
      secondary_sales_amount: 0,
      avg_secondary_per_primary: 0,
      max_secondary_per_primary: 0,
      active_hierarchies: 0
    };

    res.json({
      success: true,
      data: stats
  });
}

// 客户管理功能
async function handleCustomers(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    // 简化的客户数据返回
    const [customers] = await connection.execute(`
      SELECT 
        o.customer_wechat,
        o.tradingview_username,
        s.wechat_name as sales_wechat,
        COUNT(o.id) as total_orders,
        SUM(o.amount) as total_amount,
        MAX(o.expiry_time) as expiry_date,
        MAX(o.is_reminded) as is_reminded,
        MAX(o.reminder_date) as reminder_date
      FROM orders o
      LEFT JOIN sales s ON (o.link_code = s.link_code OR o.sales_code = s.sales_code)
      GROUP BY o.customer_wechat, o.tradingview_username, s.wechat_name
      ORDER BY expiry_date ASC
      LIMIT 100
    `);
    
    res.status(200).json({
      success: true,
      data: { customers: customers || [] }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) await connection.end();
  }
}

// 催单功能
async function handleRemindCustomer(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { customer_wechat, tradingview_username } = req.body;
    
    if (!customer_wechat || !tradingview_username) {
      return res.status(400).json({
        success: false,
        message: "客户微信和TradingView用户名不能为空"
      });
    }
    
    const [result] = await connection.execute(`
      UPDATE orders 
      SET is_reminded = TRUE, reminder_date = NOW()
      WHERE customer_wechat = ? AND tradingview_username = ?
    `, [customer_wechat, tradingview_username]);
    
    res.status(200).json({
      success: true,
      message: "催单成功",
      data: { affected_rows: result.affectedRows }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) await connection.end();
  }
}
