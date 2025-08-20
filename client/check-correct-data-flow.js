// 检查正确的数据流：orders_optimized → sales_optimized → 前端显示
console.log('🔍 检查正确的数据流程...\n');

const supabase = window.supabaseClient;

async function checkCorrectDataFlow() {
  // 1. 检查 orders_optimized 表中的 sales_code
  console.log('📊 步骤1: 检查 orders_optimized 表的 sales_code');
  console.log('=' .repeat(60));
  
  // 获取所有订单的统计
  const { data: allOrders, error: allOrdersError } = await supabase
    .from('orders_optimized')
    .select('id, sales_code, amount, status');
  
  if (allOrdersError) {
    console.error('❌ orders_optimized 查询失败:', allOrdersError);
    return;
  }
  
  let ordersWithSalesCode = 0;
  let ordersWithoutSalesCode = 0;
  let totalAmount = 0;
  let amountWithSalesCode = 0;
  
  console.log(`✅ orders_optimized 表总订单数: ${allOrders.length}`);
  
  allOrders.forEach(order => {
    const amount = parseFloat(order.amount || 0);
    totalAmount += amount;
    
    if (order.sales_code && order.sales_code.trim() !== '') {
      ordersWithSalesCode++;
      amountWithSalesCode += amount;
    } else {
      ordersWithoutSalesCode++;
    }
  });
  
  console.log('orders_optimized 统计:');
  console.log(`  有 sales_code 的订单: ${ordersWithSalesCode}`);
  console.log(`  无 sales_code 的订单: ${ordersWithoutSalesCode}`);
  console.log(`  总金额: ¥${totalAmount.toFixed(2)}`);
  console.log(`  有销售代码的金额: ¥${amountWithSalesCode.toFixed(2)}`);
  
  // 2. 检查 sales_optimized 表的佣金计算
  console.log('\n📊 步骤2: 检查 sales_optimized 表的佣金数据');
  console.log('=' .repeat(60));
  
  const { data: salesOptimized, error: salesError } = await supabase
    .from('sales_optimized')
    .select('*');
  
  if (salesError) {
    console.error('❌ sales_optimized 查询失败:', salesError);
    return;
  }
  
  console.log(`✅ sales_optimized 表总记录数: ${salesOptimized.length}`);
  
  let totalCommissionInDB = 0;
  let salesWithCommission = 0;
  
  console.log('\nsales_optimized 中的佣金情况:');
  salesOptimized.forEach(sale => {
    const commission = sale.total_commission || 0;
    totalCommissionInDB += commission;
    
    if (commission > 0) {
      salesWithCommission++;
      console.log(`  ${sale.wechat_name || sale.sales_code}: 佣金=$${commission}`);
    } else {
      console.log(`  ${sale.wechat_name || sale.sales_code}: 佣金=$0 ⚠️`);
    }
  });
  
  console.log(`\nsales_optimized 汇总:`);
  console.log(`  有佣金的销售: ${salesWithCommission}/${salesOptimized.length}`);
  console.log(`  数据库中总佣金: $${totalCommissionInDB.toFixed(2)}`);
  
  // 3. 检查订单和销售的匹配关系
  console.log('\n📊 步骤3: 检查 orders_optimized ↔ sales_optimized 匹配');
  console.log('=' .repeat(60));
  
  const salesCodeMap = new Map();
  salesOptimized.forEach(sale => {
    salesCodeMap.set(sale.sales_code, {
      ...sale,
      matchedOrders: [],
      matchedAmount: 0
    });
  });
  
  // 检查每个订单是否能匹配到销售
  let matchedOrders = 0;
  let unmatchedOrdersWithCode = 0;
  
  allOrders.forEach(order => {
    if (order.sales_code) {
      if (salesCodeMap.has(order.sales_code)) {
        matchedOrders++;
        const saleData = salesCodeMap.get(order.sales_code);
        saleData.matchedOrders.push(order);
        saleData.matchedAmount += parseFloat(order.amount || 0);
      } else {
        unmatchedOrdersWithCode++;
        console.log(`⚠️ 订单 ${order.id} 的 sales_code "${order.sales_code}" 在 sales_optimized 中不存在`);
      }
    }
  });
  
  console.log('匹配统计:');
  console.log(`  成功匹配的订单: ${matchedOrders}`);
  console.log(`  有sales_code但无法匹配: ${unmatchedOrdersWithCode}`);
  console.log(`  完全没有sales_code: ${ordersWithoutSalesCode}`);
  
  // 4. 验证佣金计算逻辑
  console.log('\n📊 步骤4: 验证佣金计算是否正确');
  console.log('=' .repeat(60));
  
  let shouldHaveCommission = 0;
  
  salesCodeMap.forEach((saleData, salesCode) => {
    const confirmedOrders = saleData.matchedOrders.filter(order => 
      ['confirmed_payment', 'confirmed_config', 'active'].includes(order.status)
    );
    
    if (confirmedOrders.length > 0) {
      const confirmedAmount = confirmedOrders.reduce((sum, order) => 
        sum + parseFloat(order.amount || 0), 0
      );
      
      // 假设40%佣金率，人民币转美元 (÷7.15)
      const expectedCommission = (confirmedAmount * 0.4) / 7.15;
      shouldHaveCommission += expectedCommission;
      
      console.log(`${saleData.wechat_name || salesCode}:`);
      console.log(`  匹配订单: ${saleData.matchedOrders.length} (确认: ${confirmedOrders.length})`);
      console.log(`  确认金额: ¥${confirmedAmount.toFixed(2)}`);
      console.log(`  理论佣金: $${expectedCommission.toFixed(2)}`);
      console.log(`  数据库佣金: $${saleData.total_commission || 0}`);
      console.log('');
    }
  });
  
  // 5. 最终诊断
  console.log('\n🔍 数据流诊断结果:');
  console.log('=' .repeat(60));
  
  console.log('数据流检查:');
  console.log(`✅ orders_optimized 表: ${allOrders.length} 条记录`);
  console.log(`✅ sales_optimized 表: ${salesOptimized.length} 条记录`);
  
  if (ordersWithoutSalesCode > ordersWithSalesCode) {
    console.log(`❌ 问题1: ${ordersWithoutSalesCode} 个订单没有 sales_code`);
  }
  
  if (unmatchedOrdersWithCode > 0) {
    console.log(`❌ 问题2: ${unmatchedOrdersWithCode} 个订单的 sales_code 无法匹配`);
  }
  
  if (totalCommissionInDB === 0 && shouldHaveCommission > 0) {
    console.log(`❌ 问题3: 理论佣金 $${shouldHaveCommission.toFixed(2)}，但数据库佣金为 $0`);
    console.log('   → sales_optimized 表的佣金字段没有正确计算');
  }
  
  if (totalCommissionInDB > 0) {
    console.log(`✅ sales_optimized 表有佣金数据: $${totalCommissionInDB.toFixed(2)}`);
    console.log('   → 问题可能在 AdminAPI.getStats() 或前端显示');
  }
  
  console.log('\n💡 建议解决方案:');
  if (totalCommissionInDB === 0) {
    console.log('1. 运行佣金计算脚本更新 sales_optimized 表');
  } else {
    console.log('1. 检查 AdminAPI.getStats() 方法');
    console.log('2. 检查 Redux 数据流');
  }
}

checkCorrectDataFlow();