const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'zhixing',
  ssl: { rejectUnauthorized: false }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 简单直接的修复：将pending_review状态改为pending_payment
    const [result] = await connection.execute(`
      UPDATE orders 
      SET status = 'pending_payment' 
      WHERE status = 'pending_review'
    `);
    
    res.json({
      success: true,
      message: `修复完成，更新了 ${result.affectedRows} 条记录`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '修复失败',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}