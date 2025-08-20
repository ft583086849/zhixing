/**
 * 修复所有统计数据 - 更新所有时间段
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function fixAllStats() {
  console.log('🔧 开始修复所有统计数据...\n');
  
  try {
    // 1. 获取实际数据
    console.log('1️⃣ 获取实际数据...');
    const { data: orders } = await supabase.from('orders').select('*');
    const { data: primarySales } = await supabase.from('primary_sales').select('*');
    const { data: secondarySales } = await supabase.from('secondary_sales').select('*');
    
    // 2. 计算统计
    const validStatuses = ['confirmed_config', 'config_confirmed', 'confirmed', 'active'];
    const activeOrders = orders.filter(o => validStatuses.includes(o.status)).length;
    const rejectedOrders = orders.filter(o => o.status === 'rejected').length;
    
    const totalAmount = orders
      .filter(o => o.status !== 'rejected')
      .reduce((sum, o) => sum + parseFloat(o.price || o.amount || 0), 0);
    
    const totalCommission = orders
      .filter(o => validStatuses.includes(o.status))
      .reduce((sum, o) => {
        const price = parseFloat(o.price || o.amount || 0);
        const rate = parseFloat(o.commission_rate) || 0.25;
        return sum + (price * rate);
      }, 0);
    
    const statsData = {
      total_orders: orders.length,
      today_orders: 0,
      pending_payment_orders: 0,
      confirmed_payment_orders: 0,
      pending_config_orders: 0,
      confirmed_config_orders: activeOrders,
      rejected_orders: rejectedOrders,
      active_orders: activeOrders,
      total_amount: totalAmount.toFixed(2),
      today_amount: 0,
      confirmed_amount: totalAmount.toFixed(2),
      total_commission: totalCommission.toFixed(2),
      paid_commission: 0,
      pending_commission: totalCommission.toFixed(2),
      primary_sales_count: primarySales?.length || 0,
      secondary_sales_count: secondarySales?.length || 0,
      independent_sales_count: secondarySales?.filter(s => !s.primary_sales_id).length || 0,
      active_sales_count: (primarySales?.length || 0) + (secondarySales?.length || 0),
      free_trial_orders: orders.filter(o => ['free_trial', '7days'].includes(o.duration)).length,
      one_month_orders: orders.filter(o => o.duration === '1month').length,
      three_month_orders: orders.filter(o => o.duration === '3months').length,
      six_month_orders: orders.filter(o => o.duration === '6months').length,
      yearly_orders: orders.filter(o => ['yearly', '1year'].includes(o.duration)).length,
      free_trial_percentage: 0,
      one_month_percentage: 0,
      three_month_percentage: 0,
      six_month_percentage: 0,
      yearly_percentage: 0,
      last_calculated_at: new Date().toISOString(),
      calculation_duration_ms: 0,
      data_version: 1
    };
    
    console.log('\n📊 计算结果:');
    console.log(`   总订单: ${orders.length}`);
    console.log(`   活跃订单: ${activeOrders}`);
    console.log(`   总金额: $${totalAmount.toFixed(2)}`);
    console.log(`   总佣金: $${totalCommission.toFixed(2)}`);
    
    // 3. 更新所有时间段
    console.log('\n2️⃣ 更新所有时间段的数据...');
    const periods = ['all', 'today', 'week', 'month', 'year'];
    
    for (const period of periods) {
      const { error } = await supabase
        .from('overview_stats')
        .update(statsData)
        .eq('stat_type', 'realtime')
        .eq('stat_period', period);
      
      if (error) {
        console.error(`❌ 更新 ${period} 失败:`, error.message);
      } else {
        console.log(`✅ ${period} 更新成功`);
      }
    }
    
    // 4. 验证
    console.log('\n3️⃣ 验证数据...');
    const { data: verifyData } = await supabase
      .from('overview_stats')
      .select('stat_period, total_orders, total_amount')
      .eq('stat_type', 'realtime');
    
    console.log('\n📋 当前数据:');
    verifyData?.forEach(d => {
      console.log(`   ${d.stat_period}: ${d.total_orders} 订单, $${d.total_amount}`);
    });
    
    console.log('\n✨ 修复完成！');
    console.log('\n下一步:');
    console.log('1. 刷新页面: http://localhost:3000/admin/dashboard');
    console.log('2. 如果还是显示0，清除浏览器缓存');
    console.log('3. 在控制台执行: localStorage.clear()');
    console.log('4. 重新登录查看');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

fixAllStats();