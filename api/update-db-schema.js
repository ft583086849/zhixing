// Vercel Serverless Function - 数据库表结构更新API
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
    const connection = await mysql.createConnection(dbConfig);
    
    if (req.method === 'POST') {
      console.log('开始修改数据库表结构...');
      
      // 检查字段是否已存在
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM orders LIKE 'screenshot_data'"
      );
      
      if (columns.length === 0) {
        // 添加截图存储字段
        await connection.execute(
          'ALTER TABLE orders ADD COLUMN screenshot_data LONGBLOB'
        );
        console.log('✅ 添加 screenshot_data 字段成功');
      } else {
        console.log('✅ screenshot_data 字段已存在');
      }
      
      const [expiresColumns] = await connection.execute(
        "SHOW COLUMNS FROM orders LIKE 'screenshot_expires_at'"
      );
      
      if (expiresColumns.length === 0) {
        // 添加过期时间字段
        await connection.execute(
          'ALTER TABLE orders ADD COLUMN screenshot_expires_at TIMESTAMP DEFAULT (created_at + INTERVAL 7 DAY)'
        );
        console.log('✅ 添加 screenshot_expires_at 字段成功');
      } else {
        console.log('✅ screenshot_expires_at 字段已存在');
      }
      
      // 为现有记录设置过期时间
      await connection.execute(
        'UPDATE orders SET screenshot_expires_at = created_at + INTERVAL 7 DAY WHERE screenshot_expires_at IS NULL'
      );
      console.log('✅ 更新现有记录的过期时间');
      
      await connection.end();
      
      res.json({
        success: true,
        message: '数据库表结构修改完成',
        addedFields: ['screenshot_data', 'screenshot_expires_at']
      });
    } else {
      // GET请求显示表结构
      const [columns] = await connection.execute('DESCRIBE orders');
      await connection.end();
      
      res.json({
        success: true,
        message: '当前表结构',
        columns: columns
      });
    }

  } catch (error) {
    console.error('修改数据库表结构错误:', error);
    res.status(500).json({
      success: false,
      message: '修改失败',
      error: error.message
    });
  }
}; 