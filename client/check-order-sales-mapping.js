// 检查订单和销售的关联关系
console.log('🔍 检查订单与销售的关联关系...\n');

const supabase = window.supabaseClient;

async function checkOrderSalesMapping() {
  // 1. 检查orders表中的sales_code字段
  console.log('📊 步骤1: 检查订单表中的sales_code字段');
  console.log('=' .repeat(50));
  
  const { data: orders, error: orderError } = await supabase
    .from('orders_optimized')
    .select('id, sales_code, amount, status')
    .limit(20);
  
  if (orderError) {
    console.error('❌ 订单查询失败:', orderError);
    return;
  }
  
  let ordersWithSalesCode = 0;
  let ordersWithoutSalesCode = 0;
  
  console.log('前20个订单的sales_code情况:');
  orders.forEach(order => {
    if (order.sales_code) {
      ordersWithSalesCode++;
      console.log(`✅ 订单${order.id}: sales_code=${order.sales_code}, 金额=$${order.amount}`);
    } else {
      ordersWithoutSalesCode++;
      console.log(`❌ 订单${order.id}: 无sales_code, 金额=$${order.amount}`);
    }
  });
  
  console.log(`\n统计结果:`);
  console.log(`  有sales_code的订单: ${ordersWithSalesCode}`);
  console.log(`  无sales_code的订单: ${ordersWithoutSalesCode}`);
  
  // 2. 检查sales表中的sales_code
  console.log('\n📊 步骤2: 检查销售表中的sales_code');
  console.log('=' .repeat(50));
  
  const { data: sales, error: salesError } = await supabase
    .from('sales_optimized')
    .select('id, sales_code, wechat_name, total_commission');
  
  if (salesError) {
    console.error('❌ 销售查询失败:', salesError);
    return;
  }
  
  console.log('销售表中的sales_code:');
  sales.forEach(sale => {
    console.log(`  ${sale.wechat_name}: ${sale.sales_code} (佣金: $${sale.total_commission || 0})`);
  });
  
  // 3. 检查关联匹配情况
  console.log('\n📊 步骤3: 检查订单与销售的匹配情况');
  console.log('=' .repeat(50));
  
  // 获取所有订单
  const { data: allOrders } = await supabase
    .from('orders_optimized')
    .select('sales_code, amount, status');
  
  const salesCodeMap = new Map();
  sales.forEach(sale => {
    salesCodeMap.set(sale.sales_code, sale);
  });
  
  let matchedOrders = 0;
  let unmatchedOrders = 0;
  let matchedAmount = 0;
  let unmatchedAmount = 0;
  
  allOrders.forEach(order => {
    if (order.sales_code && salesCodeMap.has(order.sales_code)) {
      matchedOrders++;
      matchedAmount += parseFloat(order.amount || 0);
    } else {
      unmatchedOrders++;
      unmatchedAmount += parseFloat(order.amount || 0);
      if (order.sales_code) {
        console.log(`⚠️ 订单sales_code ${order.sales_code} 在销售表中不存在`);
      }
    }
  });
  
  console.log('订单匹配统计:');
  console.log(`  匹配的订单数: ${matchedOrders}`);
  console.log(`  不匹配的订单数: ${unmatchedOrders}`);
  console.log(`  匹配订单总金额: ¥${matchedAmount.toFixed(2)}`);
  console.log(`  不匹配订单总金额: ¥${unmatchedAmount.toFixed(2)}`);
  
  // 4. 模拟佣金计算
  console.log('\n📊 步骤4: 模拟正确的佣金计算');
  console.log('=' .repeat(50));
  
  let totalCalculatedCommission = 0;
  
  // 为每个销售计算佣金
  sales.forEach(sale => {
    const relatedOrders = allOrders.filter(order => 
      order.sales_code === sale.sales_code && 
      ['confirmed_payment', 'confirmed_config', 'active'].includes(order.status)
    );
    
    let salesAmount = 0;
    relatedOrders.forEach(order => {
      salesAmount += parseFloat(order.amount || 0);
    });
    
    // 简单的佣金计算 (假设40%佣金率)
    const calculatedCommission = salesAmount * 0.4 / 7.15; // 人民币转美元
    
    if (relatedOrders.length > 0) {
      console.log(`${sale.wechat_name}:`);
      console.log(`  相关订单: ${relatedOrders.length} 个`);
      console.log(`  销售金额: ¥${salesAmount.toFixed(2)}`);
      console.log(`  计算佣金: $${calculatedCommission.toFixed(2)}`);
      console.log(`  数据库佣金: $${sale.total_commission || 0}`);
      
      totalCalculatedCommission += calculatedCommission;
    }
  });
  
  console.log(`\n💰 佣金计算结果:`);
  console.log(`  理论总佣金: $${totalCalculatedCommission.toFixed(2)}`);
  console.log(`  数据库总佣金: $${sales.reduce((sum, s) => sum + (s.total_commission || 0), 0)}`);
  
  // 5. 诊断问题
  console.log('\n🔍 问题诊断:');
  console.log('=' .repeat(50));
  
  if (unmatchedOrders > matchedOrders) {
    console.log('❌ 主要问题: 大量订单没有正确的sales_code关联');
    console.log('   需要修复订单的sales_code字段');
  } else if (totalCalculatedCommission > 0 && sales.every(s => !s.total_commission)) {
    console.log('❌ 主要问题: 销售表中的佣金字段没有计算更新');
    console.log('   需要运行佣金计算更新脚本');
  } else {
    console.log('✅ 订单关联正常，问题可能在其他地方');
  }
}

checkOrderSalesMapping();