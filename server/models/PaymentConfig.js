const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentConfig = sequelize.define('PaymentConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  alipay_account: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '支付宝账号'
  },
  alipay_surname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '支付宝收款人姓氏'
  },
  alipay_qr_code: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '支付宝收款码图片（base64）'
  },
  crypto_chain_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '链名'
  },
  crypto_address: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '链上收款地址'
  },
  crypto_qr_code: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '链上收款码图片（base64）'
  }
}, {
  tableName: 'payment_config',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '收款配置表'
});

module.exports = PaymentConfig; 