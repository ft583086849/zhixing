// Vercel Serverless Function - 销售相关API
const { v4: uuidv4 } = require('crypto').randomUUID ? 
  { v4: () => require('crypto').randomUUID() } : 
  { v4: () => Date.now().toString(36) + Math.random().toString(36).substr(2) };

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
        wechat_name, 
        payment_method, 
        payment_address, 
        alipay_surname, 
        chain_name 
      } = req.body;

      // 验证必填字段
      if (!wechat_name || !payment_method || !payment_address) {
        return res.status(400).json({
          success: false,
          message: '微信名称、收款方式和收款地址为必填项'
        });
      }

      // 验证收款方式
      if (!['alipay', 'crypto'].includes(payment_method)) {
        return res.status(400).json({
          success: false,
          message: '收款方式只能是支付宝或线上地址码'
        });
      }

      // 支付宝收款验证
      if (payment_method === 'alipay' && !alipay_surname) {
        return res.status(400).json({
          success: false,
          message: '支付宝收款需要填写收款人姓氏'
        });
      }

      // 线上地址码验证
      if (payment_method === 'crypto' && !chain_name) {
        return res.status(400).json({
          success: false,
          message: '线上地址码需要填写链名'
        });
      }

      // 创建销售记录（模拟）
      const salesId = Date.now();
      
      // 生成唯一链接代码
      const linkCode = v4().replace(/-/g, '').substring(0, 12) + salesId.toString().padStart(4, '0');

      const salesData = {
        id: salesId,
        wechat_name,
        payment_method,
        payment_address,
        alipay_surname,
        chain_name,
        created_at: new Date().toISOString()
      };

      return res.json({
        success: true,
        message: '销售收款信息创建成功',
        data: {
          sales_id: salesId,
          link_code: linkCode,
          full_link: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/purchase/${linkCode}`,
          sales: salesData
        }
      });

    } else if (path === 'list' && req.method === 'GET') {
      // 获取销售列表
      const mockSalesData = [
        {
          id: 1,
          wechat_name: "张三",
          payment_method: "alipay",
          payment_address: "zhang***@alipay.com",
          alipay_surname: "张",
          total_orders: 15,
          total_revenue: 4485,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          wechat_name: "李四",
          payment_method: "crypto",
          payment_address: "bc1q...xyz",
          chain_name: "Bitcoin",
          total_orders: 8,
          total_revenue: 2392,
          created_at: new Date().toISOString()
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockSalesData,
        message: '销售数据获取成功'
      });

    } else if (req.method === 'GET') {
      // 获取销售信息（通过链接码）
      const { link_code } = req.query;
      
      if (link_code) {
        // 模拟根据链接码查找销售信息
        const salesInfo = {
          id: 1,
          wechat_name: "张三",
          payment_method: "alipay",
          payment_address: "zhang***@alipay.com",
          alipay_surname: "张",
          chain_name: null,
          created_at: new Date().toISOString()
        };

        return res.json({
          success: true,
          data: salesInfo,
          message: '销售信息获取成功'
        });
      }

      return res.status(400).json({
        success: false,
        message: '缺少链接码参数'
      });
    }

    return res.status(404).json({
      success: false,
      message: '接口不存在'
    });

  } catch (error) {
    console.error('销售API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}; 