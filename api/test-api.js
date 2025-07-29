// Vercel Serverless Function - API 测试接口
module.exports = async (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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

  // 返回所有可用的 API 端点
  const availableEndpoints = {
    health: '/api/health',
    auth: {
      login: 'POST /api/auth?path=login',
      verify: 'GET /api/auth?path=verify'
    },
    orders: {
      create: 'POST /api/orders?path=create',
      list: 'GET /api/orders'
    },
    sales: {
      create: 'POST /api/sales?path=create',
      list: 'GET /api/sales?path=list',
      getByLink: 'GET /api/sales?link_code=LINK_CODE'
    },
    admin: {
      stats: 'GET /api/admin?path=stats',
      orders: 'GET /api/admin?path=orders',
      customers: 'GET /api/admin?path=customers'
    },
    lifetimeLimit: 'GET /api/lifetime-limit',
    paymentConfig: 'GET /api/payment-config'
  };

  res.status(200).json({
    status: 'OK',
    message: '知行财库 Vercel 全栈 API 运行正常',
    timestamp: new Date().toISOString(),
    platform: 'Vercel Serverless Functions',
    version: '2.0.0-fullstack',
    endpoints: availableEndpoints,
    features: [
      '✅ Serverless Functions',
      '✅ JWT 认证',
      '✅ CORS 配置',
      '✅ 完整的 API 路由',
      '✅ 前端构建集成',
      '⏳ 数据库连接 (待配置)'
    ]
  });
}; 