const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LifetimeLimit = sequelize.define('LifetimeLimit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  total_limit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
    comment: '永久授权总限量'
  },
  sold_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '已售永久授权数量'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否启用限量'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  tableName: 'lifetime_limit',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '永久授权限量配置表'
});

module.exports = LifetimeLimit; 