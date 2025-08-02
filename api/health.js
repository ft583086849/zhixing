// Vercel Serverless Function - 健康检查API
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

  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '方法不允许'
    });
  }

  try {
    // 测试数据库连接
    let dbStatus = { connected: false, error: null, message: '数据库连接失败' };
    
    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.execute('SELECT 1');
      await connection.end();
      
      dbStatus = { 
        connected: true, 
        error: null, 
        message: '数据库连接正常' 
      };
    } catch (dbError) {
      dbStatus = { 
        connected: false, 
        error: dbError.message, 
        message: '数据库连接失败' 
      };
    }

    // 返回健康检查结果
    res.status(200).json({
      success: true,
      message: '健康检查完成',
      data: {
        status: 'OK',
        message: '知行财库服务运行正常',
        timestamp: new Date().toISOString(),
        platform: 'Vercel Serverless',
        version: '2.1.0',
        database: dbStatus
      }
    });

  } catch (error) {
    console.error('健康检查错误:', error);
    res.status(500).json({
      success: false,
      message: '健康检查失败',
      error: error.message
    });
  }
} 