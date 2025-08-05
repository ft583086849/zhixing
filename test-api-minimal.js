// 最简化的API测试文件
// 用于确定api/sales.js的问题所在

const mysql = require('mysql2/promise');

// 测试数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

console.log('🔍 测试API组件');
console.log('==================');

async function testComponents() {
  
  // 测试1: 环境变量
  console.log('\n📋 测试1: 环境变量');
  console.log(`DB_HOST: ${process.env.DB_HOST ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`DB_USER: ${process.env.DB_USER ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`DB_NAME: ${process.env.DB_NAME ? '✅ 已设置' : '❌ 未设置'}`);
  
  // 测试2: 依赖模块
  console.log('\n📋 测试2: 依赖模块');
  try {
    const { v4: uuidv4 } = require('uuid');
    console.log('✅ uuid模块正常');
  } catch (error) {
    console.log(`❌ uuid模块错误: ${error.message}`);
  }
  
  try {
    const jwt = require('jsonwebtoken');
    console.log('✅ jsonwebtoken模块正常');
  } catch (error) {
    console.log(`❌ jsonwebtoken模块错误: ${error.message}`);
  }
  
  // 测试3: 数据库连接
  console.log('\n📋 测试3: 数据库连接');
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    await connection.execute('SELECT 1');
    console.log('✅ 数据库查询正常');
    await connection.end();
  } catch (error) {
    console.log(`❌ 数据库连接错误: ${error.message}`);
  }
  
  // 测试4: 检查api/sales.js文件
  console.log('\n📋 测试4: api/sales.js文件分析');
  try {
    const fs = require('fs');
    const content = fs.readFileSync('api/sales.js', 'utf8');
    
    console.log(`📄 文件大小: ${content.length} 字符`);
    console.log(`📄 行数: ${content.split('\n').length}`);
    
    // 检查关键函数
    const hasHandleRemove = content.includes('handleRemoveSecondarySales');
    const hasRemoveRoute = content.includes("path === 'remove-secondary'");
    const hasPutMethod = content.includes('GET,POST,PUT,OPTIONS');
    
    console.log(`📄 包含handleRemoveSecondarySales: ${hasHandleRemove ? '✅' : '❌'}`);
    console.log(`📄 包含remove-secondary路由: ${hasRemoveRoute ? '✅' : '❌'}`);
    console.log(`📄 包含PUT方法CORS: ${hasPutMethod ? '✅' : '❌'}`);
    
  } catch (error) {
    console.log(`❌ 文件读取错误: ${error.message}`);
  }
}

testComponents().then(() => {
  console.log('\n🏁 测试完成');
}).catch(error => {
  console.error('\n💥 测试过程出错:', error);
});