const mysql = require('mysql2/promise');

// Vercel环境的数据库配置
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'zhixing',
  ssl: { rejectUnauthorized: false }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '只支持GET请求' });
  }

  let connection;

  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    
    // 查询当前所有的status值
    const [statusValues] = await connection.execute(`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `);
    
    // 查询字段定义
    const [columnInfo] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'status'
    `, [dbConfig.database]);

    res.json({
      success: true,
      current_status_values: statusValues,
      column_definition: columnInfo[0]?.COLUMN_TYPE || '未找到',
      message: '状态调试信息'
    });

  } catch (error) {
    console.error('调试状态失败:', error);
    res.status(500).json({
      success: false,
      message: '调试状态失败',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}