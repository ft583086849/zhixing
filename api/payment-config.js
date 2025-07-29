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
      // 真实的支付配置数据
      const paymentConfig = {
        // 支付宝配置
        alipay_account: '752304285@qq.com',
        alipay_surname: '梁',
        alipay_qr_code: null, // 暂无二维码，可以后续添加
        
        // 加密货币配置
        crypto_chain_name: 'TRC10/TRC20',
        crypto_address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
        crypto_qr_code: null, // 暂无二维码，可以后续添加
        
        // 其他配置（保留原有结构以兼容其他功能）
        durations: {
          '7days': { label: '7天', price: 0 },
          '1month': { label: '1个月', price: 188 },
          '3months': { label: '3个月', price: 488 },
          '6months': { label: '6个月', price: 688 },
          '1year': { label: '1年', price: 1588 },
          'lifetime': { label: '永久', price: 1888 }
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