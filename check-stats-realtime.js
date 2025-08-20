// 实时检查统计数据
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStats() {
  console.log('🔍 检查订单数据的duration字段值...\n');
  
  // 1. 获取所有订单的duration值
  const { data: orders, error } = await supabase
    .from('orders_optimized')
    .select('duration, status');
  
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  // 2. 统计duration分布
  const durationMap = {};
  orders.forEach(order => {
    const duration = order.duration || 'null';
    durationMap[duration] = (durationMap[duration] || 0) + 1;
  });
  
  console.log('Duration字段的实际值分布:');
  console.log('─'.repeat(50));
  Object.entries(durationMap).forEach(([key, count]) => {
    console.log(`"${key}": ${count} 个订单`);
  });
  
  // 3. 模拟api.js的统计逻辑
  const validOrders = orders.filter(o => o.status !== 'rejected');
  const stats = {
    free_trial_orders: 0,
    one_month_orders: 0,
    three_month_orders: 0,
    six_month_orders: 0,
    yearly_orders: 0
  };
  
  validOrders.forEach(order => {
    const duration = order.duration;
    // 使用修复后的匹配逻辑
    if (duration === 'free' || duration === '7days' || duration === 'trial' || 
        duration === '7天' || duration === '7日' || duration === '七天') {
      stats.free_trial_orders++;
    } else if (duration === '1month' || duration === 'month' || 
               duration === '1个月' || duration === '一个月') {
      stats.one_month_orders++;
    } else if (duration === '3months' || 
               duration === '3个月' || duration === '三个月') {
      stats.three_month_orders++;
    } else if (duration === '6months' || 
               duration === '6个月' || duration === '六个月' || duration === '半年') {
      stats.six_month_orders++;
    } else if (duration === '1year' || duration === 'yearly' || duration === 'annual' || 
               duration === '1年' || duration === '一年' || duration === '年费') {
      stats.yearly_orders++;
    }
  });
  
  const total = validOrders.length || 1;
  
  console.log('\n统计结果:');
  console.log('─'.repeat(50));
  console.log(`7天免费: ${stats.free_trial_orders} 个 (${(stats.free_trial_orders/total*100).toFixed(2)}%)`);
  console.log(`1个月: ${stats.one_month_orders} 个 (${(stats.one_month_orders/total*100).toFixed(2)}%)`);
  console.log(`3个月: ${stats.three_month_orders} 个 (${(stats.three_month_orders/total*100).toFixed(2)}%)`);
  console.log(`6个月: ${stats.six_month_orders} 个 (${(stats.six_month_orders/total*100).toFixed(2)}%)`);
  console.log(`年费: ${stats.yearly_orders} 个 (${(stats.yearly_orders/total*100).toFixed(2)}%)`);
  
  console.log('\n诊断:');
  const hasData = Object.values(stats).some(v => v > 0);
  if (!hasData) {
    console.log('❌ 统计全部为0，可能原因:');
    console.log('  1. duration字段值不匹配任何已知格式');
    console.log('  2. 所有订单都是rejected状态');
    console.log('  3. 数据库中没有订单');
  } else {
    console.log('✅ 统计有数据，应该能在页面上显示');
  }
}

checkStats();