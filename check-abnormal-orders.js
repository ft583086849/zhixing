require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkAbnormalOrders() {
  console.log('=' .repeat(80));
  console.log('分析异常金额订单原因');
  console.log('=' .repeat(80));
  
  // 查询$900订单
  console.log('\n1. 分析$900订单:');
  console.log('-'.repeat(40));
  
  const { data: orders900 } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('amount', 900)
    .not('status', 'eq', 'rejected');
  
  if (orders900) {
    for (const order of orders900) {
      console.log(`\n订单号: ${order.order_number || order.id}`);
      console.log(`  用户: ${order.tradingview_username} (${order.customer_wechat})`);
      console.log(`  创建时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
      console.log(`  状态: ${order.status}`);
      console.log(`  购买类型: ${order.purchase_type || 'N/A'}`);
      console.log(`  时长: ${order.duration || 'N/A'}`);
      console.log(`  实际支付: $${order.actual_payment_amount || order.amount}`);
      console.log(`  支付方式: ${order.payment_method || 'N/A'}`);
      console.log(`  销售代码: ${order.sales_code || 'N/A'}`);
      console.log(`  备注/标签: ${order.tags || 'N/A'}`);
      
      // 可能是3个月套餐（$300 x 3）
      if (order.duration && order.duration.includes('3')) {
        console.log(`  💡 可能原因: 3个月套餐（$300 x 3个月）`);
      }
    }
  }
  
  // 查询$500订单
  console.log('\n2. 分析$500订单:');
  console.log('-'.repeat(40));
  
  const { data: orders500 } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('amount', 500)
    .not('status', 'eq', 'rejected');
  
  if (orders500) {
    for (const order of orders500) {
      console.log(`\n订单号: ${order.order_number || order.id}`);
      console.log(`  用户: ${order.tradingview_username} (${order.customer_wechat})`);
      console.log(`  创建时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
      console.log(`  状态: ${order.status}`);
      console.log(`  购买类型: ${order.purchase_type || 'N/A'}`);
      console.log(`  时长: ${order.duration || 'N/A'}`);
      console.log(`  实际支付: $${order.actual_payment_amount || order.amount}`);
      console.log(`  支付方式: ${order.payment_method || 'N/A'}`);
      console.log(`  销售代码: ${order.sales_code || 'N/A'}`);
      console.log(`  备注/标签: ${order.tags || 'N/A'}`);
      
      // 可能是优惠价或特殊套餐
      if (order.actual_payment_amount && order.actual_payment_amount !== order.amount) {
        console.log(`  💡 可能原因: 优惠价格（原价可能不同）`);
      }
    }
  }
  
  // 查询$300订单
  console.log('\n3. 分析$300订单:');
  console.log('-'.repeat(40));
  
  const { data: orders300 } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('amount', 300)
    .not('status', 'eq', 'rejected');
  
  if (orders300) {
    for (const order of orders300) {
      console.log(`\n订单号: ${order.order_number || order.id}`);
      console.log(`  用户: ${order.tradingview_username} (${order.customer_wechat})`);
      console.log(`  创建时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
      console.log(`  状态: ${order.status}`);
      console.log(`  购买类型: ${order.purchase_type || 'N/A'}`);
      console.log(`  时长: ${order.duration || 'N/A'}`);
      console.log(`  实际支付: $${order.actual_payment_amount || order.amount}`);
      console.log(`  支付方式: ${order.payment_method || 'N/A'}`);
      console.log(`  销售代码: ${order.sales_code || 'N/A'}`);
      console.log(`  备注/标签: ${order.tags || 'N/A'}`);
      
      // 可能是月度套餐或优惠价
      if (order.duration && order.duration.includes('月')) {
        console.log(`  💡 可能原因: 月度套餐价格`);
      }
    }
  }
  
  // 查询$100订单（可能是测试订单）
  console.log('\n4. 分析$100订单（前5个）:');
  console.log('-'.repeat(40));
  
  const { data: orders100 } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('amount', 100)
    .not('status', 'eq', 'rejected')
    .limit(5);
  
  if (orders100) {
    for (const order of orders100) {
      console.log(`\n订单号: ${order.order_number || order.id}`);
      console.log(`  用户: ${order.tradingview_username} (${order.customer_wechat})`);
      console.log(`  创建时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
      console.log(`  状态: ${order.status}`);
      console.log(`  购买类型: ${order.purchase_type || 'N/A'}`);
      console.log(`  时长: ${order.duration || 'N/A'}`);
      console.log(`  销售代码: ${order.sales_code || 'N/A'}`);
      
      // 可能是测试订单
      if (order.amount === 100) {
        console.log(`  💡 可能原因: 测试订单或体验价格`);
      }
    }
  }
  
  // 统计时间分布
  console.log('\n5. 异常金额订单时间分布:');
  console.log('-'.repeat(40));
  
  const { data: allAbnormal } = await supabase
    .from('orders_optimized')
    .select('created_at, amount')
    .in('amount', [100, 300, 500, 900])
    .not('status', 'eq', 'rejected')
    .order('created_at', { ascending: true });
  
  if (allAbnormal) {
    // 按月统计
    const monthStats = {};
    allAbnormal.forEach(order => {
      const month = new Date(order.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' });
      if (!monthStats[month]) {
        monthStats[month] = { 100: 0, 300: 0, 500: 0, 900: 0 };
      }
      monthStats[month][order.amount]++;
    });
    
    console.log('月份 | $100 | $300 | $500 | $900');
    console.log('-'.repeat(40));
    Object.entries(monthStats).forEach(([month, stats]) => {
      console.log(`${month} | ${stats[100]} | ${stats[300]} | ${stats[500]} | ${stats[900]}`);
    });
    
    console.log('\n💡 分析结论:');
    console.log('  - 大部分异常金额订单集中在某个时间段可能是系统测试期');
    console.log('  - $100订单可能是体验价或测试订单');
    console.log('  - $300/$500/$900可能是不同时长的套餐价格');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('分析完成');
}

checkAbnormalOrders();