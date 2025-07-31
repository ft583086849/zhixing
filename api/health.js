// Vercel Serverless Function - 健康检查API
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 根据HTTP方法和查询参数处理不同请求
    const { path } = req.query;
    
    if (req.method === 'GET' && (!path || path === 'check')) {
      await handleHealthCheck(req, res);
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`
      });
    }

  } catch (error) {
    console.error('健康检查API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 处理健康检查
async function handleHealthCheck(req, res) {

  // 健康检查信息
  const healthStatus = {
    status: 'OK',
    message: '知行财库服务运行正常',
    timestamp: new Date().toISOString(),
    platform: 'Vercel Serverless',
    version: '2.1.0',
    database: {
      connected: false,
      error: null
    }
  };
  
  // 测试数据库连接（使用 DB_* 环境变量）
  try {
    const hasDbConfig = !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME);
    
    if (hasDbConfig && process.env.NODE_ENV === 'production') {
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
      
      // 测试连接
      const connection = await mysql.createConnection(dbConfig);
      await connection.execute('SELECT 1 as test');
      await connection.end();
      
      healthStatus.database.connected = true;
      healthStatus.database.message = '数据库连接正常';
    } else {
      healthStatus.database.connected = false;
      healthStatus.database.message = hasDbConfig ? '非生产环境' : '数据库配置缺失';
    }
  } catch (error) {
    console.error('健康检查 - 数据库连接失败:', error.message);
    healthStatus.database.connected = false;
    healthStatus.database.error = error.message;
    healthStatus.status = 'WARNING';
    healthStatus.message = '服务运行但数据库连接异常';
  }

  res.json({
    success: true,
    message: '健康检查完成',
    data: healthStatus
  });
}; 