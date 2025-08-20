#!/usr/bin/env node

/**
 * 测试客户管理API是否正常工作
 * 这个脚本会直接调用API并显示详细的错误信息
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'client', '.env') });

console.log('环境变量检查:');
console.log('  SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? '已设置' : '❌ 未设置');
console.log('  SUPABASE_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '已设置' : '❌ 未设置');
console.log('');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testGetCustomers() {
  console.log('🔍 开始测试客户管理API...\n');
  
  try {
    // 1. 测试获取订单
    console.log('1️⃣ 获取订单数据...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ 获取订单失败:', ordersError);
      return;
    }
    console.log(`✅ 成功获取 ${orders.length} 个订单`);
    
    // 2. 测试获取销售数据
    console.log('\n2️⃣ 获取销售数据...');
    const { data: primarySales, error: psError } = await supabase
      .from('primary_sales')
      .select('id, sales_code, name, wechat_name')
      .limit(5);
    
    if (psError) {
      console.error('❌ 获取一级销售失败:', psError);
      return;
    }
    console.log(`✅ 成功获取 ${primarySales.length} 个一级销售`);
    
    const { data: secondarySales, error: ssError } = await supabase
      .from('secondary_sales')
      .select('id, sales_code, name, wechat_name, primary_sales_id')
      .limit(5);
    
    if (ssError) {
      console.error('❌ 获取二级销售失败:', ssError);
      return;
    }
    console.log(`✅ 成功获取 ${secondarySales.length} 个二级销售`);
    
    // 3. 处理客户数据
    console.log('\n3️⃣ 处理客户数据...');
    const customerMap = new Map();
    
    orders.forEach(order => {
      // 排除已拒绝的订单
      if (order.status === 'rejected') {
        return;
      }
      
      const customerWechat = order.customer_wechat || '';
      const tradingviewUser = order.tradingview_username || '';
      const key = `${customerWechat}-${tradingviewUser}`;
      
      if (!customerMap.has(key) && (customerWechat || tradingviewUser)) {
        customerMap.set(key, {
          customer_wechat: customerWechat,
          tradingview_username: tradingviewUser,
          total_orders: 1,
          total_amount: parseFloat(order.amount || 0),
          actual_payment_amount: parseFloat(order.actual_payment_amount || 0),
          commission_amount: parseFloat(order.commission_amount || 0),
          status: order.status,
          expiry_time: order.expiry_time,
          created_at: order.created_at,
          is_reminded: order.is_reminded || false
        });
      }
    });
    
    const customers = Array.from(customerMap.values());
    console.log(`✅ 处理完成，共 ${customers.length} 个客户`);
    
    // 4. 显示示例数据
    console.log('\n4️⃣ 客户数据示例:');
    customers.slice(0, 3).forEach((customer, index) => {
      console.log(`\n客户 ${index + 1}:`);
      console.log(`  微信: ${customer.customer_wechat || '无'}`);
      console.log(`  TV用户: ${customer.tradingview_username || '无'}`);
      console.log(`  总金额: $${customer.total_amount}`);
      console.log(`  到期时间: ${customer.expiry_time || '无'}`);
      console.log(`  状态: ${customer.status}`);
    });
    
    console.log('\n✅ 测试完成！API 工作正常。');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
  }
}

// 执行测试
testGetCustomers();