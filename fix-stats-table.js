// 修复统计表数据
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateStatsTable() {
  console.log('🔧 更新overview_stats表数据...\n');
  
  // 1. 获取订单数据
  const { data: orders, error: ordersError } = await supabase
    .from('orders_optimized')
    .select('*');
  
  if (ordersError) {
    console.error('获取订单失败:', ordersError);
    return;
  }
  
  const validOrders = orders.filter(o => o.status !== 'rejected');
  const totalOrders = validOrders.length;
  
  // 2. 统计订单分类
  const stats = {
    free_trial_orders: 0,
    one_month_orders: 0,
    three_month_orders: 0,
    six_month_orders: 0,
    yearly_orders: 0
  };
  
  validOrders.forEach(order => {
    const duration = order.duration;
    if (duration === '7天' || duration === '7days') {
      stats.free_trial_orders++;
    } else if (duration === '1个月' || duration === '1month') {
      stats.one_month_orders++;
    } else if (duration === '3个月' || duration === '3months') {
      stats.three_month_orders++;
    } else if (duration === '6个月' || duration === '6months') {
      stats.six_month_orders++;
    } else if (duration === '1年' || duration === '1year') {
      stats.yearly_orders++;
    }
  });
  
  // 3. 计算百分比
  const percentages = {
    free_trial_percentage: totalOrders > 0 ? (stats.free_trial_orders / totalOrders * 100) : 0,
    one_month_percentage: totalOrders > 0 ? (stats.one_month_orders / totalOrders * 100) : 0,
    three_month_percentage: totalOrders > 0 ? (stats.three_month_orders / totalOrders * 100) : 0,
    six_month_percentage: totalOrders > 0 ? (stats.six_month_orders / totalOrders * 100) : 0,
    yearly_percentage: totalOrders > 0 ? (stats.yearly_orders / totalOrders * 100) : 0
  };
  
  console.log('订单分类统计:');
  console.log('─'.repeat(50));
  console.log(`7天免费: ${stats.free_trial_orders} 个 (${percentages.free_trial_percentage.toFixed(2)}%)`);
  console.log(`1个月: ${stats.one_month_orders} 个 (${percentages.one_month_percentage.toFixed(2)}%)`);
  console.log(`3个月: ${stats.three_month_orders} 个 (${percentages.three_month_percentage.toFixed(2)}%)`);
  console.log(`6个月: ${stats.six_month_orders} 个 (${percentages.six_month_percentage.toFixed(2)}%)`);
  console.log(`年费: ${stats.yearly_orders} 个 (${percentages.yearly_percentage.toFixed(2)}%)`);
  
  // 4. 更新或插入overview_stats表
  const updateData = {
    stat_type: 'realtime',
    stat_period: 'all',
    total_orders: orders.length,
    valid_orders: validOrders.length,
    ...stats,
    ...percentages,
    last_calculated_at: new Date().toISOString(),
    calculation_duration_ms: 100
  };
  
  // 先尝试更新
  const { data: updateResult, error: updateError } = await supabase
    .from('overview_stats')
    .update(updateData)
    .eq('stat_type', 'realtime')
    .eq('stat_period', 'all')
    .select();
  
  if (updateError || !updateResult || updateResult.length === 0) {
    // 如果更新失败，尝试插入
    console.log('\n尝试插入新记录...');
    const { data: insertResult, error: insertError } = await supabase
      .from('overview_stats')
      .insert({
        ...updateData,
        id: 1 // 假设使用固定ID
      })
      .select();
    
    if (insertError) {
      console.error('插入失败:', insertError);
      console.log('\n表可能不存在，需要创建overview_stats表');
    } else {
      console.log('✅ 成功插入统计数据');
    }
  } else {
    console.log('\n✅ 成功更新overview_stats表');
  }
  
  console.log('\n请刷新浏览器页面查看更新后的数据');
}

updateStatsTable();