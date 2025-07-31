// Vercel Serverless Function - 数据库Schema更新
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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '只支持POST方法'
    });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 检查crypto_amount字段是否存在
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM orders LIKE 'crypto_amount'"
    );
    
    if (columns.length === 0) {
      // 添加crypto_amount字段
      await connection.execute(
        "ALTER TABLE orders ADD COLUMN crypto_amount DECIMAL(10,2) DEFAULT NULL COMMENT '加密货币金额' AFTER alipay_amount"
      );
      
      console.log('成功添加crypto_amount字段到orders表');
      
      await connection.end();
      
      res.json({
        success: true,
        message: '数据库schema更新成功',
        changes: ['添加了crypto_amount字段到orders表']
      });
    } else {
      await connection.end();
      
      res.json({
        success: true,
        message: '数据库schema已是最新版本',
        changes: []
      });
    }
    
  } catch (error) {
    console.error('数据库schema更新错误:', error);
    res.status(500).json({
      success: false,
      message: '数据库schema更新失败',
      error: error.message
    });
  }
}; 