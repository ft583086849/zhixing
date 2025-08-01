// Vercel Serverless Function - 数据库初始化
const mysql = require('mysql2/promise');

// 数据库连接配置
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const { path } = req.query;

    if (req.method === 'POST' && path === 'init') {
      await handleInitDatabase(req, res, connection);
    } else if (req.method === 'GET' && path === 'status') {
      await handleCheckDatabaseStatus(req, res, connection);
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`
      });
    }

    await connection.end();

  } catch (error) {
    console.error('数据库初始化API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 初始化数据库
async function handleInitDatabase(req, res, connection) {
  try {
    console.log('开始初始化数据库...');

    // 1. 创建一级销售表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS primary_sales (
        id INT PRIMARY KEY AUTO_INCREMENT,
        wechat_name VARCHAR(100) NOT NULL UNIQUE,
        payment_method ENUM('alipay', 'crypto') NOT NULL,
        payment_address TEXT NOT NULL,
        alipay_surname VARCHAR(50),
        chain_name VARCHAR(50),
        commission_rate DECIMAL(5,2) DEFAULT 40.00 COMMENT '默认佣金比率40%',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_wechat_name (wechat_name),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ 一级销售表创建/检查完成');

    // 2. 创建二级销售表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS secondary_sales (
        id INT PRIMARY KEY AUTO_INCREMENT,
        wechat_name VARCHAR(100) NOT NULL UNIQUE,
        primary_sales_id INT NOT NULL,
        payment_method ENUM('alipay', 'crypto') NOT NULL,
        payment_address TEXT NOT NULL,
        alipay_surname VARCHAR(50),
        chain_name VARCHAR(50),
        commission_rate DECIMAL(5,2) DEFAULT 30.00 COMMENT '佣金比率，由一级销售设定',
        status ENUM('active', 'removed') DEFAULT 'active' COMMENT '状态：活跃/已移除',
        removed_by INT NULL COMMENT '被哪个一级销售移除',
        removed_at TIMESTAMP NULL COMMENT '移除时间',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_wechat_name (wechat_name),
        INDEX idx_primary_sales_id (primary_sales_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ 二级销售表创建/检查完成');

    // 3. 创建销售层级关系表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales_hierarchy (
        id INT PRIMARY KEY AUTO_INCREMENT,
        primary_sales_id INT NOT NULL,
        secondary_sales_id INT NOT NULL,
        commission_rate DECIMAL(5,2) NOT NULL COMMENT '二级销售佣金比率',
        status ENUM('active', 'removed') DEFAULT 'active' COMMENT '关系状态',
        removed_at TIMESTAMP NULL COMMENT '移除时间',
        removed_reason VARCHAR(500) COMMENT '移除原因',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_relationship (primary_sales_id, secondary_sales_id),
        INDEX idx_primary_sales_id (primary_sales_id),
        INDEX idx_secondary_sales_id (secondary_sales_id),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ 销售层级关系表创建/检查完成');

    // 4. 确保links表存在并添加link_type字段
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS links (
        id INT PRIMARY KEY AUTO_INCREMENT,
        link_code VARCHAR(50) NOT NULL UNIQUE,
        sales_id INT NOT NULL,
        link_type ENUM('secondary_registration', 'user_sales') DEFAULT 'user_sales' COMMENT '链接类型：二级注册/用户销售',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_link_code (link_code),
        INDEX idx_sales_id (sales_id),
        INDEX idx_link_type (link_type)
      )
    `);
    console.log('✅ 链接表创建/检查完成');

    // 5. 确保其他基础表存在
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT PRIMARY KEY AUTO_INCREMENT,
        wechat_name VARCHAR(100) NOT NULL,
        payment_method ENUM('alipay', 'crypto') NOT NULL,
        payment_address TEXT NOT NULL,
        alipay_surname VARCHAR(50),
        chain_name VARCHAR(50),
        link_code VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_wechat_name (wechat_name),
        INDEX idx_link_code (link_code)
      )
    `);
    console.log('✅ 销售表创建/检查完成');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        sales_link_code VARCHAR(50) NOT NULL,
        payment_screenshot TEXT,
        status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending',
        payment_time TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sales_link_code (sales_link_code),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ 订单表创建/检查完成');

    res.status(200).json({
      success: true,
      message: '数据库初始化完成',
      data: {
        tables_created: [
          'primary_sales',
          'secondary_sales', 
          'sales_hierarchy',
          'links',
          'sales',
          'orders'
        ]
      }
    });

  } catch (error) {
    console.error('数据库初始化错误:', error);
    res.status(500).json({
      success: false,
      message: '数据库初始化失败',
      error: error.message
    });
  }
}

// 检查数据库状态
async function handleCheckDatabaseStatus(req, res, connection) {
  try {
    const tables = [
      'primary_sales',
      'secondary_sales',
      'sales_hierarchy',
      'links',
      'sales',
      'orders'
    ];

    const status = {};

    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        status[table] = {
          exists: true,
          record_count: rows[0].count
        };
      } catch (error) {
        status[table] = {
          exists: false,
          error: error.message
        };
      }
    }

    res.status(200).json({
      success: true,
      message: '数据库状态检查完成',
      data: status
    });

  } catch (error) {
    console.error('数据库状态检查错误:', error);
    res.status(500).json({
      success: false,
      message: '数据库状态检查失败',
      error: error.message
    });
  }
} 