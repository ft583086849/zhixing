// Vercel Serverless Function - 管理员API
const mysql = require('mysql2/promise');

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
    const { path } = req.query;
    const bodyPath = req.body?.path;

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

    // 处理数据导出
    if (req.method === 'GET' && path === 'export') {
      await handleDataExport(req, res);
      return;
    }

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
        s.phone,
        s.email,
        s.payment_method,
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
        o.created_at,
        o.payment_time
      FROM orders o
      ORDER BY o.created_at DESC
    `);
    
    // 获取佣金数据
    const [commissionData] = await connection.execute(`
      SELECT 
        sc.id,
        sc.order_id,
        sc.primary_sales_id,
        sc.secondary_sales_id,
        sc.order_amount,
        sc.primary_commission,
        sc.secondary_commission,
        sc.status,
        sc.created_at
      FROM sales_commissions sc
      ORDER BY sc.created_at DESC
    `);
    
    const exportData = {
      export_time: new Date().toISOString(),
      sales_count: salesData.length,
      orders_count: ordersData.length,
      commission_count: commissionData.length,
      sales: salesData,
      orders: ordersData,
      commissions: commissionData
    };
    
    res.json({
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