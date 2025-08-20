/**
 * 修复primary_commission_amount字段
 * 将commission_amount的值同步到primary_commission_amount
 */

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function fixPrimaryCommission() {
  console.log('修复primary_commission_amount字段');
  console.log('=================================\n');
  
  // 1. 查找需要修复的订单
  const { data: orders, error: fetchError } = await supabase
    .from('orders_optimized')
    .select('id, commission_amount, primary_commission_amount')
    .gt('commission_amount', 0)
    .eq('primary_commission_amount', 0);
  
  if (fetchError) {
    console.error('查询失败:', fetchError);
    return;
  }
  
  console.log(`找到 ${orders?.length || 0} 个需要修复的订单\n`);
  
  if (!orders || orders.length === 0) {
    console.log('没有需要修复的订单');
    return;
  }
  
  // 2. 逐个修复
  let successCount = 0;
  let failCount = 0;
  
  for (const order of orders) {
    const { error: updateError } = await supabase
      .from('orders_optimized')
      .update({ 
        primary_commission_amount: order.commission_amount 
      })
      .eq('id', order.id);
    
    if (updateError) {
      console.log(`❌ 订单 ${order.id} 更新失败:`, updateError.message);
      failCount++;
    } else {
      console.log(`✅ 订单 ${order.id}: 佣金 ${order.commission_amount} 元`);
      successCount++;
    }
  }
  
  // 3. 总结
  console.log('\n=================================');
  console.log('修复完成！');
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${failCount} 个`);
  console.log(`总计: ${orders.length} 个`);
}

// 执行修复
fixPrimaryCommission();