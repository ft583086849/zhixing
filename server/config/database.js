const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// 根据环境变量选择数据库类型
if (process.env.DB_TYPE === 'sqlite' || !process.env.DB_HOST) {
  // 使用SQLite
  const path = require('path');
  const dbPath = path.join(__dirname, '../database.sqlite');
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development',
    define: {
      charset: 'utf8',
      collate: 'utf8_general_ci',
      timestamps: true,
      underscored: true
    }
  });
  
  console.log('📦 使用SQLite数据库');
} else {
  // 使用MySQL
  sequelize = new Sequelize(
    process.env.DB_NAME || 'payment_system',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development',
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        timestamps: true,
        underscored: true
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
  
  console.log('🗄️ 使用MySQL数据库');
}

// 测试数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  }
}

module.exports = { sequelize, testConnection }; 