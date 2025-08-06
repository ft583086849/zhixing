// 临时测试脚本 - 诊断管理员API问题
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'aws.connect.psdb.cloud',
  user: process.env.DB_USER || 'placeholder',
  password: process.env.DB_PASSWORD || 'placeholder',
  database: process.env.DB_NAME || 'zhixing',
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

async function testConnection() {
  console.log('🔍 测试数据库连接...');
  console.log('📊 数据库配置:');
  console.log('- DB_HOST:', process.env.DB_HOST || '未设置');
  console.log('- DB_USER:', process.env.DB_USER || '未设置');
  console.log('- DB_NAME:', process.env.DB_NAME || '未设置');
  console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 测试查询admins表
    const [adminRows] = await connection.execute('SELECT COUNT(*) as count FROM admins');
    console.log('👨‍💼 管理员账户数量:', adminRows[0].count);
    
    // 测试查询orders表中一级验证01的订单
    const [orderRows] = await connection.execute(`
      SELECT o.*, ps.wechat_name as primary_sales_name
      FROM orders o
      LEFT JOIN primary_sales ps ON o.sales_code = ps.sales_code
      WHERE ps.wechat_name = '一级验证01'
      ORDER BY o.created_at DESC
      LIMIT 5
    `);
    console.log('📋 一级验证01的订单数量:', orderRows.length);
    if (orderRows.length > 0) {
      console.log('最新订单:', {
        id: orderRows[0].id,
        tradingview_username: orderRows[0].tradingview_username,
        duration: orderRows[0].duration,
        status: orderRows[0].status,
        created_at: orderRows[0].created_at
      });
    }
    
    await connection.end();
    console.log('✅ 测试完成');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('完整错误:', error);
  }
}

testConnection();