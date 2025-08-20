require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function fixCommissionAmounts() {
  console.log('修复orders_optimized表的commission_amount字段');
  console.log('='.repeat(50));
  
  // 1. 获取所有订单
  const { data: allOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .neq('status', 'rejected');
    
  console.log(`找到${allOrders?.length || 0}个有效订单`);
  
  // 2. 获取一级和二级销售的映射
  const { data: primarySales } = await supabase
    .from('primary_sales')
    .select('sales_code');
    
  const { data: secondarySales } = await supabase
    .from('secondary_sales')
    .select('sales_code');
    
  const primaryCodes = new Set(primarySales?.map(s => s.sales_code) || []);
  const secondaryCodes = new Set(secondarySales?.map(s => s.sales_code) || []);
  
  // 3. 逐个更新订单
  let primaryCount = 0;
  let secondaryCount = 0;
  
  for (const order of allOrders || []) {
    let commissionRate = 0;
    
    if (primaryCodes.has(order.sales_code)) {
      commissionRate = 0.4; // 一级销售40%
      primaryCount++;
    } else if (secondaryCodes.has(order.sales_code)) {
      commissionRate = 0.25; // 二级销售25%
      secondaryCount++;
    } else {
      console.log(`警告：订单${order.id}的sales_code ${order.sales_code} 未找到对应销售`);
      continue;
    }
    
    const correctCommission = order.amount * commissionRate;
    
    if (Math.abs((order.commission_amount || 0) - correctCommission) > 0.01) {
      // 需要更新
      const { error } = await supabase
        .from('orders_optimized')
        .update({ commission_amount: correctCommission })
        .eq('id', order.id);
        
      if (error) {
        console.error(`更新订单${order.id}失败:`, error);
      }
    }
  }
  
  console.log(`\n✓ 处理完成`);
  console.log(`  一级销售订单: ${primaryCount}个`);
  console.log(`  二级销售订单: ${secondaryCount}个`);
  
  // 4. 验证WML的订单
  console.log('\n验证WML792355703的订单:');
  const { data: wmlOrders } = await supabase
    .from('orders_optimized')
    .select('id, amount, commission_amount')
    .eq('sales_code', 'PRI17547241780648255')
    .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'])
    .gt('amount', 0);
    
  let total = 0;
  wmlOrders?.forEach(order => {
    console.log(`  订单${order.id}: $${order.amount} → 佣金$${order.commission_amount}`);
    total += order.commission_amount || 0;
  });
  console.log(`  总佣金: $${total} (应该是$1616)`);
}

fixCommissionAmounts();