// Vercel Serverless Function - 截图清理API
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

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const { path } = req.query;
    
    if (req.method === 'POST' && (path === 'cleanup' || !path)) {
      console.log('开始清理过期截图...');
      
      // 清理一周前的截图数据
      const [result] = await connection.execute(
        `UPDATE orders 
         SET screenshot_data = NULL 
         WHERE screenshot_data IS NOT NULL 
         AND screenshot_expires_at < NOW()`
      );
      
      await connection.end();
      
      console.log(`清理完成，清理了 ${result.affectedRows} 条记录的截图数据`);
      
      res.json({
        success: true,
        message: '截图清理完成',
        cleanedCount: result.affectedRows
      });
    } else if (req.method === 'GET' && (path === 'stats' || !path)) {
      // GET请求显示清理统计
      const [expiredCount] = await connection.execute(
        `SELECT COUNT(*) as count 
         FROM orders 
         WHERE screenshot_data IS NOT NULL 
         AND screenshot_expires_at < NOW()`
      );
      
      const [totalCount] = await connection.execute(
        `SELECT COUNT(*) as count 
         FROM orders 
         WHERE screenshot_data IS NOT NULL`
      );
      
      await connection.end();
      
      res.json({
        success: true,
        message: '截图清理统计',
        totalScreenshots: totalCount[0].count,
        expiredScreenshots: expiredCount[0].count
      });
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`
      });
    }

  } catch (error) {
    console.error('清理截图错误:', error);
    res.status(500).json({
      success: false,
      message: '清理失败',
      error: error.message
    });
  }
}; 