const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sales = sequelize.define('Sales', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  wechat_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '微信名称'
  },
  payment_method: {
    type: DataTypes.ENUM('alipay', 'crypto'),
    allowNull: false,
    comment: '收款方式：支付宝/线上地址码'
  },
  payment_address: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '收款地址'
  },
  alipay_surname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '支付宝收款人姓氏'
  },
  chain_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '链名（线上地址码时使用）'
  },
  commission_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 30.00,
    comment: '佣金比率（百分比）'
  }
}, {
  tableName: 'sales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '销售表'
});

module.exports = Sales; 