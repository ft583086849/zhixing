// Vercel Serverless Function - 检查数据库表结构
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 检查orders表结构
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    // 尝试简单查询
    let simpleQueryResult = null;
    try {
      const [rows] = await connection.execute(`
        SELECT id, tradingview_username, customer_wechat, amount, created_at
        FROM orders
        LIMIT 5
      `);
      simpleQueryResult = {
        success: true,
        data: rows
      };
    } catch (error) {
      simpleQueryResult = {
        success: false,
        error: error.message
      };
    }
    
    await connection.end();

    res.json({
      success: true,
      data: {
        table_name: 'orders',
        columns: columns,
        simple_query_test: simpleQueryResult
      }
    });

  } catch (error) {
    console.error('检查表结构错误:', error);
    res.status(500).json({
      success: false,
      message: '检查表结构失败',
      error: error.message
    });
  }
} 