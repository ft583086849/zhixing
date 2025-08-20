const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkTodayOrders() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  console.log('📅 今日时间范围:');
  console.log('  开始:', todayStart.toISOString());
  console.log('  结束:', todayEnd.toISOString());
  
  // 1. 查询PRI17547241780648255的今日订单
  console.log('\n🔍 查询 PRI17547241780648255 的今日订单...\n');
  const { data: primaryTodayOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', 'PRI17547241780648255')
    .gte('payment_time', todayStart.toISOString())
    .lte('payment_time', todayEnd.toISOString())
    .in('status', ['confirmed_config', 'active']);
    
  if (primaryTodayOrders && primaryTodayOrders.length > 0) {
    console.log('✅ 找到今日直销订单:', primaryTodayOrders.length, '个');
    let totalDirectCommission = 0;
    primaryTodayOrders.forEach(o => {
      const commission = o.commission_amount || 0;
      totalDirectCommission += commission;
      console.log('  订单', o.order_number, '- 佣金: $', commission);
    });
    console.log('  今日直销佣金总计: $', totalDirectCommission);
  } else {
    console.log('❌ 今日没有直销订单');
  }
  
  // 2. 查询二级销售的今日订单
  console.log('\n🔍 查询二级销售的今日订单...\n');
  
  // 先获取二级销售列表
  const { data: secondarySales } = await supabase
    .from('sales_optimized')
    .select('sales_code, wechat_name')
    .eq('parent_sales_code', 'PRI17547241780648255')
    .eq('sales_type', 'secondary');
    
  if (secondarySales && secondarySales.length > 0) {
    const secondaryCodes = secondarySales.map(s => s.sales_code);
    
    const { data: secondaryTodayOrders } = await supabase
      .from('orders_optimized')
      .select('*')
      .in('sales_code', secondaryCodes)
      .gte('payment_time', todayStart.toISOString())
      .lte('payment_time', todayEnd.toISOString())
      .in('status', ['confirmed_config', 'active']);
      
    if (secondaryTodayOrders && secondaryTodayOrders.length > 0) {
      console.log('✅ 找到今日二级销售订单:', secondaryTodayOrders.length, '个');
      let totalShareCommission = 0;
      secondaryTodayOrders.forEach(o => {
        const primaryShare = o.primary_commission_amount || 0;
        totalShareCommission += primaryShare;
        console.log('  订单', o.order_number, '- 一级分成: $', primaryShare);
      });
      console.log('  今日从二级获得分成总计: $', totalShareCommission);
    } else {
      console.log('❌ 今日没有二级销售订单');
    }
  }
}

checkTodayOrders();
