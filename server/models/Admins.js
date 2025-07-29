const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Admins = sequelize.define('Admins', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '管理员用户名'
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码哈希'
  }
}, {
  tableName: 'admins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '管理员表'
});

module.exports = Admins; 