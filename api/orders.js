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
        customer_wechat,
        duration,
        payment_method,
        payment_time,
        purchase_type = 'immediate',
        effective_time,
        alipay_amount,
        screenshot
      } = req.body;

      // 验证必填字段
      if (!link_code || !tradingview_username || !customer_wechat || !duration || !payment_method || !payment_time) {
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

      // 计算价格（与payment-config保持一致）
      const prices = {
        '7days': 0,
        '1month': 188,
        '3months': 488,
        '6months': 688,
        '1year': 1588,
        'lifetime': 1888
      };

      // 验证支付宝金额（如果是支付宝支付）
      if (payment_method === 'alipay' && !alipay_amount) {
        return res.status(400).json({
          success: false,
          message: '支付宝付款需要填写付款金额'
        });
      }

      // 计算过期时间
      const now = new Date();
      const baseTime = effective_time ? new Date(effective_time) : now;
      let expiry_time;
      
      if (duration === 'lifetime') {
        // 永久授权：100年后过期
        expiry_time = new Date(baseTime.getTime() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        const durationMap = {
          '7days': 7,
          '1month': 30,
          '3months': 90,
          '6months': 180,
          '1year': 365
        };
        // 购买时长 + 1天
        const days = durationMap[duration] + 1;
        expiry_time = new Date(baseTime.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
      }

      // 创建订单
      const newOrder = {
        id: Date.now(),
        order_id: `ORD-${Date.now()}`, // 添加订单号
        link_code,
        tradingview_username,
        customer_wechat,
        duration,
        payment_method,
        payment_time,
        purchase_type,
        effective_time: effective_time || null,
        amount: prices[duration],
        alipay_amount: payment_method === 'alipay' ? parseFloat(alipay_amount) : null,
        status: 'pending',
        expiry_time,
        screenshot_uploaded: !!screenshot,
        created_at: new Date().toISOString(),
        submit_time: new Date().toISOString()
      };

      return res.status(201).json({
        success: true,
        data: {
          order_id: newOrder.order_id,
          amount: newOrder.amount,
          status: newOrder.status,
          duration: duration,
          expiry_time: newOrder.expiry_time,
          created_at: newOrder.created_at
        },
        message: '订单提交成功！'
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