// Vercel Serverless Function - 支付配置API
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
    if (req.method === 'GET') {
      // 模拟支付配置数据
      const paymentConfig = {
        durations: {
          '7days': { label: '7天', price: 99 },
          '1month': { label: '1个月', price: 299 },
          '3months': { label: '3个月', price: 799 },
          '6months': { label: '6个月', price: 1399 },
          '1year': { label: '1年', price: 2499 },
          'lifetime': { label: '永久', price: 4999 }
        },
        payment_methods: {
          alipay: {
            enabled: true,
            label: '支付宝',
            description: '支持支付宝扫码支付'
          },
          crypto: {
            enabled: true,
            label: '线上地址码',
            description: '支持加密货币支付'
          }
        },
        commission_rates: {
          '7days': 0.1,
          '1month': 0.15,
          '3months': 0.2,
          '6months': 0.25,
          '1year': 0.3,
          'lifetime': 0.35
        },
        updated_at: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: paymentConfig,
        message: '支付配置获取成功'
      });

    } else if (req.method === 'POST') {
      const { durations, payment_methods, commission_rates } = req.body;

      // 简单验证
      if (!durations || !payment_methods || !commission_rates) {
        return res.status(400).json({
          success: false,
          message: '缺少必要的配置参数'
        });
      }

      // 模拟更新操作
      const updatedConfig = {
        durations,
        payment_methods,
        commission_rates,
        updated_at: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: updatedConfig,
        message: '支付配置更新成功'
      });
    }

    return res.status(405).json({
      success: false,
      message: '方法不允许'
    });

  } catch (error) {
    console.error('支付配置API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}; 