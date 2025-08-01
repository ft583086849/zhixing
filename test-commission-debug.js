const mysql = require('mysql2/promise');

async function testCommissionRate() {
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }
  };

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 测试不同的commission_rate值
    const testValues = [0.15, 0.40, 0.9999, 1.0, 0.0001];
    
    for (const testValue of testValues) {
      try {
        console.log(`测试 commission_rate = ${testValue}`);
        
        // 尝试插入测试数据
        const [result] = await connection.execute(
          'INSERT INTO orders (link_code, tradingview_username, duration, amount, payment_method, payment_time, commission_rate, commission_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          ['test_link', 'test_user', '7days', 100, 'alipay', new Date(), testValue, 15, 'pending_review']
        );
        
        console.log(`✅ 成功插入 commission_rate = ${testValue}`);
        
        // 删除测试数据
        await connection.execute('DELETE FROM orders WHERE link_code = ?', ['test_link']);
        
      } catch (error) {
        console.log(`❌ 失败 commission_rate = ${testValue}: ${error.message}`);
      }
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('数据库连接失败:', error.message);
  }
}

testCommissionRate(); 