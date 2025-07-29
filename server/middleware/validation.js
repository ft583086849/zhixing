
const { body, validationResult } = require('express-validator');

// 通用验证中间件
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array()
    });
  }
  next();
};

// 登录验证规则
const loginValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符'),
  validateRequest
];

// 订单创建验证规则
const orderValidation = [
  body('tradingview_username')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('TradingView用户名不能为空且长度不能超过100个字符'),
  body('customer_wechat')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('用户微信名不能为空且长度不能超过100个字符'),
  body('duration')
    .isIn(['7days', '1month', '3months', '6months', '1year', 'lifetime'])
    .withMessage('无效的购买时长'),
  body('payment_method')
    .isIn(['alipay', 'wechat'])
    .withMessage('无效的支付方式'),
  validateRequest
];

// 支付配置验证规则
const paymentConfigValidation = [
  body('alipay_account')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('支付宝账户不能为空且长度不能超过100个字符'),
  body('wechat_account')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('微信账户不能为空且长度不能超过100个字符'),
  validateRequest
];
