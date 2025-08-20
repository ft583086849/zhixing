const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkWMLData() {
  console.log('🔍 查询WML792355703的数据...\n');
  
  // 1. 查询一级销售数据
  const { data: primarySale, error: primaryError } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', 'WML792355703')
    .single();
    
  if (primaryError) {
    console.log('❌ 查询一级销售失败:', primaryError);
  } else {
    console.log('✅ 一级销售数据:');
    console.log('  销售代码:', primarySale.sales_code);
    console.log('  微信名:', primarySale.wechat_name);
    console.log('  销售类型:', primarySale.sales_type);
    console.log('  佣金率:', primarySale.commission_rate);
    console.log('  总订单数:', primarySale.total_orders);
    console.log('  总金额:', primarySale.total_amount);
    console.log('  总佣金:', primarySale.total_commission);
    console.log('  本月订单:', primarySale.month_orders);
    console.log('  本月金额:', primarySale.month_amount);
    console.log('  本月佣金:', primarySale.month_commission);
    console.log('  今日订单:', primarySale.today_orders);
    console.log('  今日金额:', primarySale.today_amount);
    console.log('  今日佣金:', primarySale.today_commission);
    console.log('  直销订单数:', primarySale.total_direct_orders);
    console.log('  直销金额:', primarySale.total_direct_amount);
    console.log('  团队订单数:', primarySale.total_team_orders);
    console.log('  团队金额:', primarySale.total_team_amount);
  }
  
  // 2. 查询二级销售
  console.log('\n📊 查询二级销售...');
  const { data: secondarySales, error: secError } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('parent_sales_code', 'WML792355703')
    .eq('sales_type', 'secondary');
    
  if (secError) {
    console.log('❌ 查询二级销售失败:', secError);
  } else if (secondarySales && secondarySales.length > 0) {
    console.log(`✅ 找到 ${secondarySales.length} 个二级销售:`);
    secondarySales.forEach(s => {
      console.log(`\n  销售代码: ${s.sales_code}`);
      console.log(`  微信名: ${s.wechat_name}`);
      console.log(`  佣金率: ${s.commission_rate}`);
      console.log(`  总订单: ${s.total_orders}`);
      console.log(`  总金额: ${s.total_amount}`);
      console.log(`  总佣金: ${s.total_commission}`);
    });
  } else {
    console.log('❌ 没有找到二级销售');
  }
  
  // 3. 查询今日订单
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  console.log('\n📊 查询今日订单...');
  const { data: todayOrders, error: todayError } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', 'WML792355703')
    .gte('payment_time', today.toISOString())
    .in('status', ['confirmed_config', 'active']);
    
  if (todayError) {
    console.log('❌ 查询今日订单失败:', todayError);
  } else if (todayOrders && todayOrders.length > 0) {
    console.log(`✅ 找到 ${todayOrders.length} 个今日订单`);
    let totalAmount = 0;
    let totalCommission = 0;
    todayOrders.forEach(o => {
      const amount = o.actual_payment_amount || o.amount || 0;
      const commission = o.commission_amount || 0;
      totalAmount += amount;
      totalCommission += commission;
      console.log(`  订单${o.id}: 金额$${amount}, 佣金$${commission}`);
    });
    console.log(`  今日总金额: $${totalAmount}`);
    console.log(`  今日总佣金: $${totalCommission}`);
  } else {
    console.log('❌ 没有今日订单');
  }
}

checkWMLData();
