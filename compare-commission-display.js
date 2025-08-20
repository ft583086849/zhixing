/**
 * 对比正常显示佣金的订单和不显示佣金的订单
 */

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function compare() {
  // 1. 找一个有佣金显示的订单（比如图片中的weinihao，显示了355.20的佣金）
  const { data: goodOrder } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('tradingview_username', 'weinihao')
    .single();
  
  // 2. 找问题订单
  const { data: problemOrder } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('tradingview_username', 'niyuan124')
    .single();
  
  console.log('===== 对比分析 =====\n');
  
  if (goodOrder) {
    console.log('✅ 正常订单 (weinihao - 显示佣金$355.20):');
    console.log('  ID:', goodOrder.id);
    console.log('  销售代码:', goodOrder.sales_code);
    console.log('  金额:', goodOrder.amount);
    
    // 列出所有佣金相关字段
    const commissionFields = Object.keys(goodOrder).filter(k => k.includes('commission'));
    console.log('  佣金字段:');
    commissionFields.forEach(field => {
      console.log('    ', field, '=', goodOrder[field]);
    });
  } else {
    console.log('未找到weinihao的订单');
  }
  
  console.log('\n');
  
  if (problemOrder) {
    console.log('❌ 问题订单 (niyuan124 - 不显示佣金):');
    console.log('  ID:', problemOrder.id);
    console.log('  销售代码:', problemOrder.sales_code);
    console.log('  金额:', problemOrder.amount);
    
    const commissionFields = Object.keys(problemOrder).filter(k => k.includes('commission'));
    console.log('  佣金字段:');
    commissionFields.forEach(field => {
      console.log('    ', field, '=', problemOrder[field]);
    });
  } else {
    console.log('未找到niyuan124的订单');
  }
  
  // 3. 查找其他正常显示佣金的订单作为参考
  console.log('\n===== 查找更多参考订单 =====\n');
  
  const { data: referenceOrders } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, amount, sales_code, primary_commission_amount, secondary_commission_amount, commission_amount_primary, commission_amount_secondary')
    .not('primary_commission_amount', 'is', null)
    .gt('primary_commission_amount', 0)
    .limit(3);
  
  if (referenceOrders && referenceOrders.length > 0) {
    console.log('找到有佣金的订单作为参考:');
    referenceOrders.forEach(order => {
      console.log(`\n订单 ${order.id} (${order.tradingview_username}):`);
      console.log('  primary_commission_amount:', order.primary_commission_amount);
      console.log('  commission_amount_primary:', order.commission_amount_primary);
      console.log('  secondary_commission_amount:', order.secondary_commission_amount);
      console.log('  commission_amount_secondary:', order.commission_amount_secondary);
    });
  }
}

compare();