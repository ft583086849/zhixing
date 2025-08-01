// 直接测试数据库表结构
const mysql = require('mysql2/promise');

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

async function testDatabaseSchema() {
  try {
    console.log('🔍 连接数据库...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ 数据库连接成功');
    
    // 检查orders表结构
    console.log('\n📋 检查orders表结构...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    console.log('orders表字段:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 尝试简单查询
    console.log('\n🔍 尝试简单查询...');
    try {
      const [rows] = await connection.execute(`
        SELECT id, tradingview_username, customer_wechat, amount, created_at
        FROM orders
        LIMIT 5
      `);
      console.log('✅ 简单查询成功，结果:', rows);
    } catch (error) {
      console.log('❌ 简单查询失败:', error.message);
    }
    
    await connection.end();
    console.log('\n✅ 测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testDatabaseSchema(); 