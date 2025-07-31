// 清理过期截图的API
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
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    if (req.method === 'POST') {
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
    } else {
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