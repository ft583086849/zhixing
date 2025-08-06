// 紧急清理数据的简单API
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '只支持POST' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 直接清空所有表
    await connection.execute('DELETE FROM orders');
    await connection.execute('DELETE FROM secondary_sales');
    await connection.execute('DELETE FROM primary_sales');
    await connection.execute('ALTER TABLE orders AUTO_INCREMENT = 1');
    
    await connection.end();
    
    res.json({
      success: true,
      message: '紧急清理完成，所有测试数据已删除'
    });
    
  } catch (error) {
    if (connection) await connection.end();
    res.status(500).json({
      success: false,
      message: '清理失败',
      error: error.message
    });
  }
}