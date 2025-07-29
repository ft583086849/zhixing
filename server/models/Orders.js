const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Orders = sequelize.define('Orders', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  link_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '链接ID'
  },
  tradingview_username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'TradingView用户名称'
  },
  duration: {
    type: DataTypes.ENUM('7days', '1month', '3months', '6months', 'lifetime'),
    allowNull: false,
    comment: '购买时长'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '付款金额'
  },
  payment_method: {
    type: DataTypes.ENUM('alipay', 'crypto'),
    allowNull: false,
    comment: '付款方式'
  },
  payment_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '付款时间'
  },
  purchase_type: {
    type: DataTypes.ENUM('immediate', 'advance'),
    allowNull: false,
    defaultValue: 'immediate',
    comment: '购买方式：即时购买/提前购买'
  },
  effective_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '生效时间（提前购买时使用）'
  },
  expiry_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '到期时间'
  },
  submit_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '提交时间'
  },
  screenshot_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '付款截图路径'
  },
  status: {
    type: DataTypes.ENUM('pending_payment_confirmation', 'confirmed_payment', 'pending_configuration_confirmation', 'confirmed_configuration', 'rejected'),
    allowNull: false,
    defaultValue: 'pending_payment_confirmation',
    comment: '订单状态：待付款确认/已付款确认/待配置确认/已配置确认/已拒绝'
  }
}, {
  tableName: 'orders',
  timestamps: false,
  comment: '订单表'
});

module.exports = Orders; 