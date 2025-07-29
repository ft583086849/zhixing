const { sequelize } = require('../config/database');
const Sales = require('./Sales');
const Links = require('./Links');
const Orders = require('./Orders');
const Admins = require('./Admins');
const LifetimeLimit = require('./LifetimeLimit');
const PaymentConfig = require('./PaymentConfig');

// 定义模型关联关系
Sales.hasMany(Links, {
  foreignKey: 'sales_id',
  as: 'links'
});

Links.belongsTo(Sales, {
  foreignKey: 'sales_id',
  as: 'sales'
});

Links.hasMany(Orders, {
  foreignKey: 'link_id',
  as: 'orders'
});

Orders.belongsTo(Links, {
  foreignKey: 'link_id',
  as: 'links'
});

// 同步数据库表结构
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false }); // force: false 表示不删除现有表
    console.log('数据库表同步成功！');
    
    // 初始化永久授权限量配置
    await initLifetimeLimit();
  } catch (error) {
    console.error('数据库表同步失败:', error);
  }
};

// 初始化永久授权限量配置
const initLifetimeLimit = async () => {
  try {
    const limitCount = await LifetimeLimit.count();
    
    if (limitCount === 0) {
      await LifetimeLimit.create({
        total_limit: 100,
        sold_count: 0,
        is_active: true
      });
      console.log('永久授权限量配置初始化成功！');
    }
  } catch (error) {
    console.error('初始化永久授权限量配置失败:', error);
  }
};

// 初始化默认管理员账户
const initDefaultAdmin = async () => {
  try {
    const bcrypt = require('bcryptjs');
    const adminCount = await Admins.count();
    
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('Zhixing Universal Trading Signal', 10);
      await Admins.create({
        username: '知行',
        password_hash: hashedPassword
      });
      console.log('默认管理员账户创建成功！');
    }
  } catch (error) {
    console.error('创建默认管理员账户失败:', error);
  }
};

module.exports = {
  sequelize,
  Sales,
  Links,
  Orders,
  Admins,
  LifetimeLimit,
  PaymentConfig,
  syncDatabase,
  initDefaultAdmin
}; 