/**
 * 诊断为什么"89一级下的直接购买"在客户管理页面看不到
 * 
 * 用户说明：
 * - "89一级下的直接购买"是用户故意创建的标记
 * - 用于查询89这个一级销售下面的直接购买订单
 * - 现在在客户管理页面找不到这个订单
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tdejahgriplkzagcejbi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZWphaGdyaXBsa3phZ2NlamJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MzU1MzIsImV4cCI6MjA0ODIxMTUzMn0.QqKZ1dF8dW5BlbjPaXzLiJF0wd-Ft8O-TtQCO7W_-HE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseCustomerFiltering() {
  console.log('=== 诊断客户管理页面订单过滤问题 ===\n');
  
  try {
    // 1. 查询订单ID 72
    console.log('1. 查询订单ID 72...');
    const { data: order72, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', 72)
      .single();
    
    if (orderError) {
      console.error('查询订单失败:', orderError);
      return;
    }
    
    if (!order72) {
      console.log('❌ 订单ID 72不存在');
      return;
    }
    
    console.log('✅ 找到订单ID 72:');
    console.log('  - customer_wechat:', order72.customer_wechat);
    console.log('  - tradingview_username:', order72.tradingview_username);
    console.log('  - sales_code:', order72.sales_code);
    console.log('  - amount:', order72.amount);
    console.log('  - status:', order72.status);
    
    // 2. 查询所有包含"直接购买"的订单
    console.log('\n2. 查询所有包含"直接购买"的订单...');
    const { data: directPurchaseOrders, error: dpError } = await supabase
      .from('orders')
      .select('id, customer_wechat, tradingview_username, sales_code, amount')
      .ilike('customer_wechat', '%直接购买%');
    
    if (dpError) {
      console.error('查询失败:', dpError);
    } else {
      console.log(`找到 ${directPurchaseOrders?.length || 0} 个包含"直接购买"的订单:`);
      directPurchaseOrders?.forEach(order => {
        console.log(`  - ID ${order.id}: ${order.customer_wechat} (销售代码: ${order.sales_code})`);
      });
    }
    
    // 3. 模拟getCustomers函数的查询
    console.log('\n3. 模拟getCustomers函数的查询...');
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('*');
    
    if (allError) {
      console.error('查询所有订单失败:', allError);
      return;
    }
    
    console.log(`总共查询到 ${allOrders?.length || 0} 个订单`);
    
    // 4. 模拟客户去重逻辑
    console.log('\n4. 模拟客户去重逻辑...');
    const customerMap = new Map();
    let processedCount = 0;
    let skippedCount = 0;
    
    allOrders?.forEach(order => {
      const customerWechat = order.customer_wechat || '';
      const tradingviewUser = order.tradingview_username || '';
      const key = `${customerWechat}-${tradingviewUser}`;
      
      // 这是现有的过滤条件
      if (!customerMap.has(key) && (customerWechat || tradingviewUser)) {
        customerMap.set(key, {
          customer_wechat: customerWechat,
          tradingview_username: tradingviewUser,
          sales_code: order.sales_code,
          order_id: order.id
        });
        processedCount++;
        
        // 特别检查我们关注的订单
        if (order.id === 72 || customerWechat.includes('直接购买')) {
          console.log(`  ✅ 处理订单ID ${order.id}: ${customerWechat}`);
        }
      } else {
        skippedCount++;
        if (order.id === 72 || (customerWechat && customerWechat.includes('直接购买'))) {
          console.log(`  ⚠️ 跳过订单ID ${order.id}: ${customerWechat} (key已存在或无效)`);
        }
      }
    });
    
    console.log(`\n处理结果:`);
    console.log(`  - 处理了 ${processedCount} 个唯一客户`);
    console.log(`  - 跳过了 ${skippedCount} 个重复/无效记录`);
    
    // 5. 检查"89一级下的直接购买"是否在客户列表中
    console.log('\n5. 检查特定客户是否在列表中...');
    const targetCustomers = Array.from(customerMap.values()).filter(c => 
      c.customer_wechat.includes('89一级') || 
      c.customer_wechat.includes('直接购买')
    );
    
    if (targetCustomers.length > 0) {
      console.log(`✅ 找到 ${targetCustomers.length} 个相关客户:`);
      targetCustomers.forEach(c => {
        console.log(`  - ${c.customer_wechat} (订单ID: ${c.order_id})`);
      });
    } else {
      console.log('❌ 没有找到包含"89一级"或"直接购买"的客户');
    }
    
    // 6. 分析可能的问题
    console.log('\n=== 分析结果 ===');
    if (order72 && order72.customer_wechat === '89一级下的直接购买') {
      const key = `${order72.customer_wechat}-${order72.tradingview_username || ''}`;
      if (customerMap.has(key)) {
        console.log('✅ 订单ID 72应该会显示在客户管理页面');
        console.log('   如果看不到，可能是前端显示或缓存问题');
      } else {
        console.log('❌ 订单ID 72被过滤了');
        console.log('   可能原因:');
        console.log('   1. customerWechat为空或无效');
        console.log('   2. 被其他条件过滤');
      }
    }
    
  } catch (error) {
    console.error('诊断过程出错:', error);
  }
}

// 执行诊断
diagnoseCustomerFiltering();

