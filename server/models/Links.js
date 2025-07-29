const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Links = sequelize.define('Links', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sales_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '销售ID'
  },
  link_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '唯一链接代码'
  }
}, {
  tableName: 'links',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '链接表'
});

module.exports = Links; 