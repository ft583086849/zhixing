// Vercel Serverless Function - 订单管理API
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

  const { path } = req.query;

  try {
    if (path === 'create' && req.method === 'POST') {
      const {
        link_code,
        tradingview_username,
        duration,
        payment_method,
        payment_time,
        purchase_type = 'immediate',
        effective_time
      } = req.body;

      // 验证必填字段
      if (!link_code || !tradingview_username || !duration || !payment_method || !payment_time) {
        return res.status(400).json({
          success: false,
          message: '所有字段都是必填的'
        });
      }

      // 验证时长选项
      const validDurations = ['7days', '1month', '3months', '6months', '1year', 'lifetime'];
      if (!validDurations.includes(duration)) {
        return res.status(400).json({
          success: false,
          message: '无效的时长选项'
        });
      }

      // 计算价格
      const prices = {
        '7days': 99,
        '1month': 299,
        '3months': 799,
        '6months': 1399,
        '1year': 2499,
        'lifetime': 4999
      };

      // 计算过期时间
      const now = new Date();
      let expiry_time;
      if (duration === 'lifetime') {
        expiry_time = null;
      } else {
        const durationMap = {
          '7days': 7 * 24 * 60 * 60 * 1000,
          '1month': 30 * 24 * 60 * 60 * 1000,
          '3months': 90 * 24 * 60 * 60 * 1000,
          '6months': 180 * 24 * 60 * 60 * 1000,
          '1year': 365 * 24 * 60 * 60 * 1000
        };
        expiry_time = new Date(now.getTime() + durationMap[duration]).toISOString();
      }

      // 创建订单
      const newOrder = {
        id: Date.now(),
        link_code,
        tradingview_username,
        duration,
        payment_method,
        payment_time,
        purchase_type,
        effective_time,
        amount: prices[duration],
        status: 'pending_review',
        expiry_time,
        created_at: new Date().toISOString()
      };

      return res.status(201).json({
        success: true,
        data: newOrder,
        message: '订单创建成功，等待审核'
      });

    } else if (req.method === 'GET') {
      // 获取订单列表
      const mockOrders = [
        {
          id: 1,
          tradingview_username: "user001",
          duration: "1month",
          payment_method: "alipay",
          amount: 299,
          status: "active",
          created_at: new Date().toISOString(),
          expiry_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          tradingview_username: "user002",
          duration: "lifetime",
          payment_method: "crypto",
          amount: 4999,
          status: "pending_review",
          created_at: new Date().toISOString(),
          expiry_time: null
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockOrders,
        message: '订单数据获取成功'
      });
    }

    return res.status(404).json({
      success: false,
      message: '接口不存在'
    });

  } catch (error) {
    console.error('订单API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}; 