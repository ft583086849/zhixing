#!/usr/bin/env node

/**
 * 诊断数据概览统计问题 - 检查为什么所有统计都是0
 */

const mysql = require('mysql2/promise');

async function checkDatabase() {
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

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查orders表是否存在和有数据
    console.log('\n📋 检查orders表...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
    `, [process.env.DB_NAME]);
    
    if (tables.length === 0) {
      console.log('❌ orders表不存在！');
      return;
    }
    
    // 2. 检查orders表数据数量
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM orders');
    const totalOrders = countResult[0].total;
    console.log(`📊 orders表总记录数: ${totalOrders}`);
    
    if (totalOrders === 0) {
      console.log('❌ orders表中没有数据！这就是统计为0的原因');
      await connection.end();
      return;
    }
    
    // 3. 检查订单状态分布
    console.log('\n📊 订单状态分布:');
    const [statusStats] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      GROUP BY status
      ORDER BY count DESC
    `);
    
    statusStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat.count}条`);
    });
    
    // 4. 检查具体的状态统计（模拟数据概览API）
    console.log('\n📊 模拟数据概览API统计:');
    const [overviewStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(commission_amount), 0) as total_commission,
        COUNT(CASE WHEN status = 'pending_payment' THEN 1 END) as pending_payment_orders,
        COUNT(CASE WHEN status = 'confirmed_payment' THEN 1 END) as confirmed_payment_orders,
        COUNT(CASE WHEN status = 'pending_config' THEN 1 END) as pending_config_orders,
        COUNT(CASE WHEN status = 'confirmed_configuration' THEN 1 END) as confirmed_config_orders
      FROM orders
    `);
    
    const stats = overviewStats[0];
    console.log(`   总订单数: ${stats.total_orders}`);
    console.log(`   总金额: $${stats.total_amount}`);
    console.log(`   总佣金: $${stats.total_commission}`);
    console.log(`   待付款确认订单: ${stats.pending_payment_orders}`);
    console.log(`   已付款确认订单: ${stats.confirmed_payment_orders}`);
    console.log(`   待配置确认订单: ${stats.pending_config_orders}`);
    console.log(`   已配置确认订单: ${stats.confirmed_config_orders}`);
    
    // 5. 检查销售数据
    console.log('\n📊 销售数据统计:');
    const [salesCount] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM primary_sales) as primary_count,
        (SELECT COUNT(*) FROM secondary_sales) as secondary_count,
        (SELECT COUNT(*) FROM sales) as legacy_count
    `);
    
    const sales = salesCount[0];
    console.log(`   一级销售: ${sales.primary_count}`);
    console.log(`   二级销售: ${sales.secondary_count}`);
    console.log(`   遗留销售: ${sales.legacy_count}`);
    
    // 6. 检查最近几条订单的详细信息
    console.log('\n📋 最近5条订单详情:');
    const [recentOrders] = await connection.execute(`
      SELECT id, status, amount, commission_amount, created_at, sales_code
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    recentOrders.forEach(order => {
      console.log(`   ID:${order.id} 状态:${order.status} 金额:$${order.amount} 佣金:$${order.commission_amount || 0} 销售代码:${order.sales_code || 'N/A'}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

if (require.main === module) {
  checkDatabase();
}

module.exports = { checkDatabase };