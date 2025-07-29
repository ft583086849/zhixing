const { sequelize } = require('../config/database');
const { Sales, Links, Orders, Admins, LifetimeLimit, PaymentConfig } = require('../models');

async function migrateDatabase() {
  try {
    console.log('🔄 开始数据库迁移...');
    
    // 同步所有模型到数据库
    await sequelize.sync({ force: false });
    console.log('✅ 数据库表同步完成');
    
    // 初始化永久授权限量配置
    const limitCount = await LifetimeLimit.count();
    if (limitCount === 0) {
      await LifetimeLimit.create({
        total_limit: 100,
        sold_count: 0,
        is_active: true
      });
      console.log('✅ 永久授权限量配置初始化完成');
    }
    
    // 初始化默认管理员账户
    const bcrypt = require('bcryptjs');
    const adminCount = await Admins.count();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('Zhixing Universal Trading Signal', 10);
      await Admins.create({
        username: '知行',
        password_hash: hashedPassword
      });
      console.log('✅ 默认管理员账户创建完成');
    }
    
    // 初始化默认收款配置
    const configCount = await PaymentConfig.count();
    if (configCount === 0) {
      await PaymentConfig.create({
        alipay_account: '752304285@qq.com',
        alipay_surname: '梁',
        crypto_chain_name: 'TRC10/TRC20',
        crypto_address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo'
      });
      console.log('✅ 默认收款配置创建完成');
    }
    
    console.log('🎉 数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  }
}

migrateDatabase(); 