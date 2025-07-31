// Vercel Serverless Function - 测试部署API
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

module.exports = async (req, res) => {
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
    // 测试数据库连接
    const connection = await mysql.createConnection(dbConfig);
    
    if (req.method === 'GET') {
      // 测试数据库查询
      const [rows] = await connection.execute('SELECT 1 as test');
      await connection.end();
      
      res.json({
        success: true,
        message: '测试API部署成功',
        timestamp: new Date().toISOString(),
        method: req.method,
        databaseTest: rows[0].test
      });
    } else {
      await connection.end();
      res.json({
        success: true,
        message: '测试API部署成功',
        timestamp: new Date().toISOString(),
        method: req.method
      });
    }

  } catch (error) {
    console.error('测试API错误:', error);
    res.status(500).json({
      success: false,
      message: '测试失败',
      error: error.message
    });
  }
}; 