// Vercel Serverless Function - 管理员API
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

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

    // 处理数据导出
    if (req.method === 'GET' && path === 'export') {
      await handleDataExport(req, res);
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
    
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      sales_wechat,
      tradingview_username,
      link_code,
      purchase_type,
      payment_method,
      start_date,
      end_date,
      payment_start_date,
      payment_end_date,
      config_start_date,
      config_end_date,
      expiry_start_date,
      expiry_end_date
    } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params = [];
    
    // 构建WHERE子句
    const conditions = [];
    
    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }
    
    if (sales_wechat) {
      conditions.push('s.wechat_name LIKE ?');
      params.push(`%${sales_wechat}%`);
    }
    
    if (tradingview_username) {
      conditions.push('o.tradingview_username LIKE ?');
      params.push(`%${tradingview_username}%`);
    }
    
    if (link_code) {
      conditions.push('l.link_code LIKE ?');
      params.push(`%${link_code}%`);
    }
    
    if (purchase_type) {
      conditions.push('o.purchase_type = ?');
      params.push(purchase_type);
    }
    
    if (payment_method) {
      conditions.push('o.payment_method = ?');
      params.push(payment_method);
    }
    
    if (start_date && end_date) {
      conditions.push('DATE(o.created_at) BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }
    
    if (payment_start_date && payment_end_date) {
      conditions.push('DATE(o.payment_time) BETWEEN ? AND ?');
      params.push(payment_start_date, payment_end_date);
    }
    
    if (config_start_date && config_end_date) {
      conditions.push('DATE(o.effective_time) BETWEEN ? AND ?');
      params.push(config_start_date, config_end_date);
    }
    
    if (expiry_start_date && expiry_end_date) {
      conditions.push('DATE(o.expiry_date) BETWEEN ? AND ?');
      params.push(expiry_start_date, expiry_end_date);
    }
    
    if (search) {
      conditions.push('(o.tradingview_username LIKE ? OR o.customer_wechat LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
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
        o.purchase_type,
        o.payment_method,
        o.effective_time,
        o.expiry_date,
        o.duration,
        o.alipay_amount,
        o.crypto_amount,
        o.screenshot_path,
        s.wechat_name as sales_name,
        l.link_code
      FROM orders o
      LEFT JOIN sales s ON o.sales_id = s.id
      LEFT JOIN sales_links l ON o.link_id = l.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // 获取总数
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM orders o
      LEFT JOIN sales s ON o.sales_id = s.id
      LEFT JOIN sales_links l ON o.link_id = l.id
      ${whereClause}
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
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取基础统计
    const [basicStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(amount) as total_amount,
        COUNT(DISTINCT customer_wechat) as total_customers
      FROM orders
    `);
    
    // 获取订单状态统计
    const [statusStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'pending_payment_confirmation' THEN 1 END) as pending_payment_orders,
        COUNT(CASE WHEN status = 'pending_configuration_confirmation' THEN 1 END) as pending_config_orders,
        COUNT(CASE WHEN status = 'confirmed_payment' THEN 1 END) as confirmed_payment_orders,
        COUNT(CASE WHEN status = 'confirmed_configuration' THEN 1 END) as confirmed_config_orders
      FROM orders
    `);
    
    // 获取销售返佣金额统计
    const [commissionStats] = await connection.execute(`
      SELECT SUM(commission_amount) as total_commission
      FROM orders 
      WHERE commission_amount > 0
    `);
    
    // 获取按金额分布的订单统计
    const [amountStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN amount = 188 THEN 1 END) as amount_188_orders,
        COUNT(CASE WHEN amount = 488 THEN 1 END) as amount_488_orders,
        COUNT(CASE WHEN amount = 688 THEN 1 END) as amount_688_orders,
        COUNT(CASE WHEN amount = 1588 THEN 1 END) as amount_1588_orders
      FROM orders
    `);
    
    // 获取销售层级统计
    const [salesStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN sales_type = 'primary' THEN 1 END) as primary_sales_count,
        COUNT(CASE WHEN sales_type = 'secondary' THEN 1 END) as secondary_sales_count
      FROM sales
    `);
    
    // 计算百分比
    const totalOrders = basicStats[0]?.total_orders || 0;
    const amount188Orders = amountStats[0]?.amount_188_orders || 0;
    const amount488Orders = amountStats[0]?.amount_488_orders || 0;
    const amount688Orders = amountStats[0]?.amount_688_orders || 0;
    const amount1588Orders = amountStats[0]?.amount_1588_orders || 0;
    
    const amount188Percentage = totalOrders > 0 ? Math.round((amount188Orders / totalOrders) * 100) : 0;
    const amount488Percentage = totalOrders > 0 ? Math.round((amount488Orders / totalOrders) * 100) : 0;
    const amount688Percentage = totalOrders > 0 ? Math.round((amount688Orders / totalOrders) * 100) : 0;
    const amount1588Percentage = totalOrders > 0 ? Math.round((amount1588Orders / totalOrders) * 100) : 0;
    
    const stats = {
      // 基础统计
      total_orders: basicStats[0]?.total_orders || 0,
      total_amount: basicStats[0]?.total_amount || 0,
      total_customers: basicStats[0]?.total_customers || 0,
      
      // 订单状态统计
      pending_payment_orders: statusStats[0]?.pending_payment_orders || 0,
      pending_config_orders: statusStats[0]?.pending_config_orders || 0,
      confirmed_payment_orders: statusStats[0]?.confirmed_payment_orders || 0,
      confirmed_config_orders: statusStats[0]?.confirmed_config_orders || 0,
      
      // 销售返佣统计
      total_commission: commissionStats[0]?.total_commission || 0,
      
      // 按金额分布的订单统计
      amount_188_orders: amount188Orders,
      amount_188_percentage: amount188Percentage,
      amount_488_orders: amount488Orders,
      amount_488_percentage: amount488Percentage,
      amount_688_orders: amount688Orders,
      amount_688_percentage: amount688Percentage,
      amount_1588_orders: amount1588Orders,
      amount_1588_percentage: amount1588Percentage,
      
      // 销售层级统计
      primary_sales_count: salesStats[0]?.primary_sales_count || 0,
      secondary_sales_count: salesStats[0]?.secondary_sales_count || 0,
      primary_sales_amount: 0, // 需要根据实际业务逻辑计算
      secondary_sales_amount: 0, // 需要根据实际业务逻辑计算
      avg_secondary_per_primary: 0, // 需要根据实际业务逻辑计算
      max_secondary_per_primary: 0, // 需要根据实际业务逻辑计算
      active_hierarchies: 0 // 需要根据实际业务逻辑计算
    };

    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('统计信息获取错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取统计信息失败'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}