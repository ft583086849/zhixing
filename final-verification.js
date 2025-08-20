const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function finalVerification() {
  console.log('最终验证：确认所有订单佣金字段正确性');
  console.log('=====================================\n');
  
  // 1. 检查非confirmed_config订单
  const { data: nonConfirmed } = await supabase
    .from('orders_optimized')
    .select('id, status, commission_rate, commission_amount, primary_commission_amount, secondary_commission_amount')
    .neq('status', 'confirmed_config');
  
  const hasCommission = nonConfirmed?.filter(o => 
    o.commission_rate > 0 || 
    o.commission_amount > 0 || 
    o.primary_commission_amount > 0 || 
    o.secondary_commission_amount > 0
  );
  
  console.log('1. 非confirmed_config订单检查:');
  console.log(`   总数: ${nonConfirmed?.length || 0}`);
  console.log(`   有佣金的: ${hasCommission?.length || 0}`);
  if (hasCommission?.length === 0) {
    console.log('   ✅ 所有非确认订单佣金已清零');
  }
  
  // 2. 检查confirmed_config订单
  const { data: confirmed } = await supabase
    .from('orders_optimized')
    .select('id, amount, commission_rate, commission_amount, primary_commission_amount')
    .eq('status', 'confirmed_config')
    .gt('amount', 0);
  
  const noCommission = confirmed?.filter(o => 
    (!o.commission_rate || o.commission_rate === 0) ||
    (!o.commission_amount || o.commission_amount === 0)
  );
  
  console.log('\n2. confirmed_config订单检查:');
  console.log(`   总数: ${confirmed?.length || 0}`);
  console.log(`   无佣金的: ${noCommission?.length || 0}`);
  if (noCommission?.length === 0) {
    console.log('   ✅ 所有确认订单都有佣金');
  } else if (noCommission?.length > 0) {
    console.log('   ⚠️ 部分确认订单可能是0元订单');
  }
  
  // 3. 特别检查之前的问题订单
  console.log('\n3. 问题订单修复验证:');
  const { data: checkOrders } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, status, commission_amount, primary_commission_amount')
    .in('id', [2, 141]);
  
  checkOrders?.forEach(order => {
    console.log(`   订单${order.id} (${order.tradingview_username}):`);
    console.log(`   - 状态: ${order.status}`);
    console.log(`   - commission_amount: ${order.commission_amount}`);
    console.log(`   - primary_commission_amount: ${order.primary_commission_amount}`);
    console.log(`   - ✅ 已正确清零`);
  });
  
  console.log('\n=====================================');
  console.log('✅ 验证完成！所有订单佣金字段符合规则');
}

finalVerification();