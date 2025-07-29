// Vercel Serverless Function - 数据库连接测试
const { testConnection } = require('./lib/database');

module.exports = async (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '方法不允许'
    });
  }

  try {
    // 检查环境变量
    const hasRequiredEnvVars = !!(
      process.env.DATABASE_HOST &&
      process.env.DATABASE_USERNAME &&
      process.env.DATABASE_PASSWORD &&
      process.env.DATABASE_NAME
    );

    if (!hasRequiredEnvVars) {
      return res.status(500).json({
        success: false,
        message: '数据库环境变量未配置',
        missing_vars: {
          DATABASE_HOST: !process.env.DATABASE_HOST,
          DATABASE_USERNAME: !process.env.DATABASE_USERNAME,
          DATABASE_PASSWORD: !process.env.DATABASE_PASSWORD,
          DATABASE_NAME: !process.env.DATABASE_NAME
        }
      });
    }

    // 测试数据库连接
    const isConnected = await testConnection();

    if (isConnected) {
      return res.status(200).json({
        success: true,
        message: 'PlanetScale 数据库连接成功',
        timestamp: new Date().toISOString(),
        database_info: {
          host: process.env.DATABASE_HOST,
          database: process.env.DATABASE_NAME,
          username: process.env.DATABASE_USERNAME
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: '数据库连接失败'
      });
    }

  } catch (error) {
    console.error('数据库测试错误:', error);
    res.status(500).json({
      success: false,
      message: '数据库连接测试失败',
      error: error.message
    });
  }
}; 