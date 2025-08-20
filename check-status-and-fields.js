/**
 * 检查订单状态实际使用情况和字段映射
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatusAndFields() {
  try {
    console.log('📊 检查订单状态和字段映射...\n');

    // 1. 检查实际使用的订单状态
    console.log('1️⃣ 实际订单状态分布:');
    const { data: orders, error } = await supabase
      .from('orders_optimized')
      .select('status, amount, payment_status, sales_type')
      .limit(1000);
    
    if (error) {
      console.error('查询失败:', error.message);
      return;
    }

    // 统计状态分布
    const statusCount = {};
    const amountCount = {};
    const paymentStatusCount = {};
    const salesTypeCount = {};

    orders.forEach(order => {
      const status = order.status || 'null';
      const amount = order.amount || 'null';
      const paymentStatus = order.payment_status || 'null';
      const salesType = order.sales_type || 'null';
      
      statusCount[status] = (statusCount[status] || 0) + 1;
      amountCount[amount] = (amountCount[amount] || 0) + 1;
      paymentStatusCount[paymentStatus] = (paymentStatusCount[paymentStatus] || 0) + 1;
      salesTypeCount[salesType] = (salesTypeCount[salesType] || 0) + 1;
    });

    console.log('状态分布:');
    Object.entries(statusCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count} 订单`);
      });

    console.log('\n金额分布:');
    Object.entries(amountCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([amount, count]) => {
        console.log(`   $${amount}: ${count} 订单`);
      });

    console.log('\n支付状态分布:');
    Object.entries(paymentStatusCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count} 订单`);
      });

    console.log('\n销售类型分布:');
    Object.entries(salesTypeCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count} 订单`);
      });

    // 2. 检查表结构，看有哪些字段
    console.log('\n2️⃣ 检查表结构字段:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(1);
    
    if (!tableError && tableInfo && tableInfo.length > 0) {
      const fields = Object.keys(tableInfo[0]);
      console.log('表中实际存在的字段:');
      fields.forEach(field => {
        console.log(`   ${field}`);
      });
      
      // 检查搜索表单中用到的字段是否存在
      const searchFields = [
        'sales_type', 'sales_wechat', 'customer_wechat', 'tradingview_username',
        'purchase_type', 'payment_method', 'status', 'amount',
        'created_at', 'payment_time', 'effective_time', 'expiry_time'
      ];
      
      console.log('\n搜索表单字段映射检查:');
      searchFields.forEach(field => {
        const exists = fields.includes(field);
        console.log(`   ${field}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
      });
    }

    console.log('\n✅ 检查完成');

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 运行检查
checkStatusAndFields();