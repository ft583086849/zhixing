const express = require('express');
const { PaymentConfig } = require('../models');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// 获取收款配置
router.get('/payment-config', async (req, res) => {
  try {
    let config = await PaymentConfig.findOne({
      order: [['created_at', 'DESC']]
    });

    if (!config) {
      // 如果没有配置，创建默认配置
      config = await PaymentConfig.create({
        alipay_account: '752304285@qq.com',
        alipay_surname: '梁',
        crypto_chain_name: 'TRC10/TRC20',
        crypto_address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo'
      });
    }

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('获取收款配置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取收款配置失败'
    });
  }
});

// 保存收款配置（需要管理员权限）
router.post('/payment-config', authenticateAdmin, async (req, res) => {
  try {
    const {
      alipay_account,
      alipay_surname,
      alipay_qr_code,
      crypto_chain_name,
      crypto_address,
      crypto_qr_code
    } = req.body;

    let config = await PaymentConfig.findOne({
      order: [['created_at', 'DESC']]
    });

    if (config) {
      // 更新现有配置
      await config.update({
        alipay_account,
        alipay_surname,
        alipay_qr_code,
        crypto_chain_name,
        crypto_address,
        crypto_qr_code
      });
    } else {
      // 创建新配置
      config = await PaymentConfig.create({
        alipay_account,
        alipay_surname,
        alipay_qr_code,
        crypto_chain_name,
        crypto_address,
        crypto_qr_code
      });
    }

    res.json({
      success: true,
      message: '配置保存成功',
      data: config
    });

  } catch (error) {
    console.error('保存收款配置错误:', error);
    res.status(500).json({
      success: false,
      message: '保存收款配置失败'
    });
  }
});

module.exports = router; 