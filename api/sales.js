// Vercel Serverless Function - 销售相关API
const salesService = require('./services/salesService');

// 简单的ID生成函数
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

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

      // 生成唯一链接代码
      let linkCode;
      let attempts = 0;
      do {
        linkCode = generateUniqueId() + Date.now().toString().slice(-4);
        attempts++;
        if (attempts > 10) {
          throw new Error('生成唯一链接代码失败');
        }
      } while (!(await salesService.isLinkCodeUnique(linkCode)));

      const salesData = {
        wechat_name,
        payment_method,
        payment_address,
        alipay_surname,
        chain_name,
        link_code: linkCode
      };

      // 创建销售记录
      const createdSales = await salesService.createSales(salesData);

      return res.json({
        success: true,
        message: '销售收款信息创建成功',
        data: {
          sales_id: createdSales.id,
          link_code: linkCode,
          full_link: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/purchase/${linkCode}`,
          sales: createdSales
        }
      });

    } else if (path === 'list' && req.method === 'GET') {
      // 获取销售列表
      const { limit = 50, offset = 0 } = req.query;
      const salesList = await salesService.getAllSales(parseInt(limit), parseInt(offset));

      return res.status(200).json({
        success: true,
        data: salesList,
        message: '销售数据获取成功'
      });

    } else if (req.method === 'GET') {
      // 获取销售信息（通过链接码）
      const { link_code } = req.query;
      
      if (link_code) {
        const salesInfo = await salesService.getSalesByLinkCode(link_code);
        
        if (!salesInfo) {
          return res.status(404).json({
            success: false,
            message: '销售信息不存在'
          });
        }

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
      message: error.message || '服务器错误'
    });
  }
}; 