const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Sales, Links } = require('../models');

const router = express.Router();

// 创建销售收款信息并生成链接
router.post('/create', async (req, res) => {
  try {
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

    // 创建销售记录
    const sales = await Sales.create({
      wechat_name,
      payment_method,
      payment_address,
      alipay_surname,
      chain_name
    });

    // 生成唯一链接代码（以销售ID结尾）
    const linkCode = uuidv4().replace(/-/g, '').substring(0, 12) + sales.id.toString().padStart(4, '0');

    // 创建链接记录
    const link = await Links.create({
      sales_id: sales.id,
      link_code: linkCode
    });

    res.json({
      success: true,
      message: '销售收款信息创建成功',
      data: {
        sales_id: sales.id,
        link_code: linkCode,
        full_link: `${req.protocol}://${req.get('host')}/purchase/${linkCode}`
      }
    });

  } catch (error) {
    console.error('创建销售收款信息错误:', error);
    res.status(500).json({
      success: false,
      message: '创建失败'
    });
  }
});

// 根据链接代码获取销售信息
router.get('/link/:linkCode', async (req, res) => {
  try {
    const { linkCode } = req.params;

    const link = await Links.findOne({
      where: { link_code: linkCode },
      include: [{
        model: Sales,
        as: 'sales'
      }]
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: '链接不存在'
      });
    }

    res.json({
      success: true,
      data: {
        sales: link.sales,
        link_code: link.link_code
      }
    });

  } catch (error) {
    console.error('获取销售信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

// 获取所有销售信息（管理员用）
router.get('/all', async (req, res) => {
  try {
    const sales = await Sales.findAll({
      include: [{
        model: Links,
        as: 'links'
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: sales
    });

  } catch (error) {
    console.error('获取所有销售信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

module.exports = router; 