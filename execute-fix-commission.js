const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function fixCommissions() {
  console.log('🔧 开始修复非confirmed_config订单的佣金问题');
  console.log('=============================================\n');
  
  // 1. 先查看要修复的订单
  console.log('1️⃣ 查找问题订单...');
  const { data: problemOrders } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, status, commission_rate, commission_amount, primary_commission_amount, secondary_commission_amount')
    .neq('status', 'confirmed_config')
    .or('commission_rate.gt.0,commission_amount.gt.0,primary_commission_amount.gt.0,secondary_commission_amount.gt.0');
  
  const needFix = problemOrders?.filter(order => 
    order.commission_rate > 0 ||
    order.commission_amount > 0 ||
    order.primary_commission_amount > 0 ||
    order.secondary_commission_amount > 0
  );
  
  if (needFix && needFix.length > 0) {
    console.log(`找到 ${needFix.length} 个需要修复的订单:\n`);
    needFix.forEach(order => {
      console.log(`订单 ${order.id} (${order.tradingview_username}) - ${order.status}`);
      if (order.commission_rate > 0) console.log(`  commission_rate: ${order.commission_rate} → 0`);
      if (order.commission_amount > 0) console.log(`  commission_amount: ${order.commission_amount} → 0`);
      if (order.primary_commission_amount > 0) console.log(`  primary_commission_amount: ${order.primary_commission_amount} → 0`);
      if (order.secondary_commission_amount > 0) console.log(`  secondary_commission_amount: ${order.secondary_commission_amount} → 0`);
    });
    
    // 2. 执行修复
    console.log('\n2️⃣ 执行修复...');
    const orderIds = needFix.map(o => o.id);
    
    const { error } = await supabase
      .from('orders_optimized')
      .update({
        commission_rate: 0,
        commission_amount: 0,
        primary_commission_amount: 0,
        secondary_commission_amount: 0
      })
      .in('id', orderIds)
      .neq('status', 'confirmed_config');
    
    if (error) {
      console.log('❌ 修复失败:', error.message);
      return;
    }
    
    console.log(`✅ 成功修复 ${needFix.length} 个订单`);
    
    // 3. 验证修复结果
    console.log('\n3️⃣ 验证修复结果...');
    const { data: verifyOrders } = await supabase
      .from('orders_optimized')
      .select('id, commission_rate, commission_amount, primary_commission_amount, secondary_commission_amount')
      .in('id', orderIds);
    
    const stillHasCommission = verifyOrders?.filter(order => 
      order.commission_rate > 0 ||
      order.commission_amount > 0 ||
      order.primary_commission_amount > 0 ||
      order.secondary_commission_amount > 0
    );
    
    if (stillHasCommission && stillHasCommission.length > 0) {
      console.log(`⚠️ 仍有 ${stillHasCommission.length} 个订单有佣金，需要进一步检查`);
    } else {
      console.log('✅ 所有问题订单已成功修复！');
    }
  } else {
    console.log('✅ 没有发现需要修复的订单');
  }
  
  // 4. 最终统计
  console.log('\n4️⃣ 最终统计');
  console.log('================');
  const { data: stats } = await supabase
    .from('orders_optimized')
    .select('status');
  
  const statusCount = {};
  stats?.forEach(order => {
    statusCount[order.status] = (statusCount[order.status] || 0) + 1;
  });
  
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`${status}: ${count} 个订单`);
  });
}

fixCommissions();