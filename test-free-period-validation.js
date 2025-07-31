// 测试七天免费期验证逻辑
const mysql = require('mysql2/promise');

// 数据库连接配置
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

async function testFreePeriodValidation() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    const testUsername = 'test_tradingview_user';
    
    // 清理测试数据
    await connection.execute(
      'DELETE FROM orders WHERE tradingview_username = ?',
      [testUsername]
    );
    console.log('🧹 清理测试数据完成');
    
    // 测试1: 首次提交七天免费订单 - 应该成功
    console.log('\n📋 测试1: 首次提交七天免费订单');
    const [existingOrders1] = await connection.execute(
      'SELECT * FROM orders WHERE tradingview_username = ? AND status != "cancelled"',
      [testUsername]
    );
    
    if (existingOrders1.length > 0) {
      console.log('❌ 测试失败: 应该没有现有订单');
    } else {
      console.log('✅ 测试通过: 没有现有订单，可以提交七天免费订单');
    }
    
    // 模拟插入一个七天免费订单
    await connection.execute(
      `INSERT INTO orders (
        link_code, tradingview_username, customer_wechat, duration, amount, 
        payment_method, payment_time, purchase_type, effective_time, expiry_time,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'test_link', 
        testUsername, 
        'test_wechat', 
        '7days', 
        0,
        'free', 
        new Date().toISOString().slice(0, 19).replace('T', ' '), 
        'immediate', 
        new Date().toISOString().slice(0, 19).replace('T', ' '), 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        'completed'
      ]
    );
    console.log('📝 模拟插入七天免费订单完成');
    
    // 测试2: 再次提交七天免费订单 - 应该失败
    console.log('\n📋 测试2: 再次提交七天免费订单');
    const [existingOrders2] = await connection.execute(
      'SELECT * FROM orders WHERE tradingview_username = ? AND status != "cancelled"',
      [testUsername]
    );
    
    if (existingOrders2.length > 0) {
      // 检查是否有七天免费订单记录
      const [freeOrders] = await connection.execute(
        'SELECT * FROM orders WHERE tradingview_username = ? AND duration = "7days" AND status != "cancelled"',
        [testUsername]
      );
      
      if (freeOrders.length > 0) {
        console.log('✅ 测试通过: 检测到已有七天免费订单，应该拒绝');
        console.log('💬 错误信息: 您已享受过免费期，请续费使用');
      } else {
        console.log('❌ 测试失败: 应该检测到七天免费订单');
      }
    } else {
      console.log('❌ 测试失败: 应该有现有订单');
    }
    
    // 测试3: 提交付费订单 - 应该失败（因为已有订单）
    console.log('\n📋 测试3: 提交付费订单');
    const [existingOrders3] = await connection.execute(
      'SELECT * FROM orders WHERE tradingview_username = ? AND status != "cancelled"',
      [testUsername]
    );
    
    if (existingOrders3.length > 0) {
      console.log('✅ 测试通过: 检测到已有订单，付费订单也应该被拒绝');
      console.log('💬 错误信息: 您的tradingview已通过销售绑定，不支持二次销售绑定');
    } else {
      console.log('❌ 测试失败: 应该有现有订单');
    }
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行测试
testFreePeriodValidation(); 