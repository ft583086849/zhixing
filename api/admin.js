// Vercel Serverless Function - 管理员API
const jwt = require('jsonwebtoken');

// 认证中间件
const authenticateAdmin = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('未提供认证令牌');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('无效的认证令牌');
  }
};

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

  try {
    // 验证管理员身份
    const admin = authenticateAdmin(req);
    const { path } = req.query;

    if (path === 'stats' && req.method === 'GET') {
      // 模拟统计数据
      const stats = {
        totalOrders: 156,
        totalRevenue: 89450,
        activeUsers: 89,
        pendingOrders: 12,
        monthlyStats: [
          { month: '2024-01', orders: 23, revenue: 12400 },
          { month: '2024-02', orders: 31, revenue: 16800 },
          { month: '2024-03', orders: 28, revenue: 15100 }
        ]
      };

      return res.json({
        success: true,
        data: stats
      });

    } else if (path === 'orders' && req.method === 'GET') {
      // 模拟订单列表
      const orders = [
        {
          id: 1,
          tradingview_username: "user001",
          duration: "1month",
          payment_method: "alipay",
          status: "active",
          created_at: new Date().toISOString(),
          expiry_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          tradingview_username: "user002", 
          duration: "3months",
          payment_method: "crypto",
          status: "pending",
          created_at: new Date().toISOString(),
          expiry_time: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      return res.json({
        success: true,
        data: orders
      });

    } else if (path === 'customers' && req.method === 'GET') {
      // 模拟客户列表
      const customers = [
        {
          id: 1,
          wechat_name: "张三",
          total_orders: 3,
          total_revenue: 897,
          last_order_date: new Date().toISOString(),
          payment_methods: ["alipay", "crypto"]
        },
        {
          id: 2,
          wechat_name: "李四",
          total_orders: 1,
          total_revenue: 299,
          last_order_date: new Date().toISOString(),
          payment_methods: ["alipay"]
        }
      ];

      return res.json({
        success: true,
        data: customers
      });
    }

    return res.status(404).json({
      success: false,
      message: '接口不存在'
    });

  } catch (error) {
    if (error.message.includes('认证')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    console.error('管理员API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}; 