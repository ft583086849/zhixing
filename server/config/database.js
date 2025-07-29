const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// 调试：打印环境变量状态
console.log('🔍 数据库配置调试信息:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST ? '✅ 已设置' : '❌ 未设置');
console.log('DB_USER:', process.env.DB_USER ? '✅ 已设置' : '❌ 未设置');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ 已设置' : '❌ 未设置');
console.log('DB_NAME:', process.env.DB_NAME ? '✅ 已设置' : '❌ 未设置');
console.log('DB_PORT:', process.env.DB_PORT || 'default:3306');

// 强制使用PlanetScale配置（生产环境）
if (process.env.NODE_ENV === 'production') {
  console.log('🔄 检测到生产环境，尝试连接PlanetScale...');
  
  // 检查必需的环境变量
  const missingVars = [];
  if (!process.env.DB_HOST) missingVars.push('DB_HOST');
  if (!process.env.DB_USER) missingVars.push('DB_USER'); 
  if (!process.env.DB_PASSWORD) missingVars.push('DB_PASSWORD');
  if (!process.env.DB_NAME) missingVars.push('DB_NAME');
  
  if (missingVars.length > 0) {
    const error = `缺失环境变量: ${missingVars.join(', ')}。请在Vercel控制台Environment Variables中配置这些变量。`;
    console.error('❌', error);
    throw new Error(error);
  }
  
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  };
  
  console.log('📊 最终数据库配置:');
  console.log('Host:', dbConfig.host);
  console.log('Database:', dbConfig.database);
  console.log('Username:', dbConfig.username);
  console.log('Password length:', dbConfig.password.length);
  
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: {
          rejectUnauthorized: false
        }
      },
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
  
  console.log('🗄️ 使用PlanetScale MySQL数据库 (强制配置)');
  
} else {
  // 开发环境：使用SQLite
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
}

// 测试数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('错误详情:', error);
  }
}

module.exports = { sequelize, testConnection }; 