/**
 * 分析截图中的佣金比率显示是否符合新的计算逻辑
 */

console.log('🔍 分析佣金比率显示逻辑验证');
console.log('=' .repeat(50));

// 从最新截图中提取的数据
const screenshotData = {
  totalCommission: 1835.20,      // 总佣金收入
  monthlyCommission: 756.80,     // 本月佣金
  commissionRate: '70%',         // 显示的佣金比率（用户确认是70%）
  secondarySalesCount: 3,        // 二级销售数量
  primaryDirectOrders: 2,        // 一级销售直接订单数（用户确认）
  secondarySales: [
    { name: '二级销售1', rate: 30.0, commission: 56.40, orders: 1 },
    { name: '二级销售2', rate: 32.0, commission: 0.00, orders: 0 },
    { name: '二级销售3', rate: 28.0, commission: 52.64, orders: 1 }
  ]
};

console.log('📊 截图数据分析:');
console.log(`总佣金收入: $${screenshotData.totalCommission}`);
console.log(`本月佣金: $${screenshotData.monthlyCommission}`);
console.log(`显示佣金比率: ${screenshotData.commissionRate}`);
console.log(`二级销售数量: ${screenshotData.secondarySalesCount}人`);
console.log(`一级销售直接订单: ${screenshotData.primaryDirectOrders}单`);

console.log('\n📋 二级销售详情:');
screenshotData.secondarySales.forEach((sales, index) => {
  console.log(`${sales.name}: ${sales.rate}%佣金率, $${sales.commission}累计佣金, ${sales.orders}个订单`);
});

// 分析逻辑
console.log('\n🧮 逻辑分析:');

// 1. 计算二级销售平均佣金率
const secondaryRates = screenshotData.secondarySales.map(s => s.rate);
const averageSecondaryRate = secondaryRates.reduce((sum, rate) => sum + rate, 0) / secondaryRates.length;
console.log(`二级销售佣金率: ${secondaryRates.join('%, ')}%`);
console.log(`二级销售平均佣金率: ${averageSecondaryRate.toFixed(1)}%`);

// 2. 分析订单分布
const secondaryTotalOrders = screenshotData.secondarySales.reduce((sum, s) => sum + s.orders, 0);
const primaryDirectOrders = screenshotData.primaryDirectOrders;
const totalOrders = primaryDirectOrders + secondaryTotalOrders;
console.log(`二级销售总订单数: ${secondaryTotalOrders}单`);
console.log(`一级销售直接订单数: ${primaryDirectOrders}单`);
console.log(`总订单数: ${totalOrders}单`);

// 3. 分析佣金分布
const secondaryTotalCommission = screenshotData.secondarySales.reduce((sum, s) => sum + s.commission, 0);
console.log(`二级销售总佣金: $${secondaryTotalCommission}`);
console.log(`一级销售获得佣金: $${screenshotData.totalCommission}`);

// 4. 验证计算逻辑
console.log('\n🎯 新计算逻辑验证:');

if (secondaryTotalOrders === 0) {
  console.log('✅ 情况判断: 所有订单都是一级销售直接订单');
  console.log('🧮 计算结果: 40%');
} else {
  console.log('📊 混合订单情况 - 详细计算分析:');
  
  // 从佣金反推订单金额
  const secondaryOrderDetails = [];
  let secondaryTotalAmount = 0;
  
  screenshotData.secondarySales.forEach(sales => {
    if (sales.orders > 0 && sales.commission > 0) {
      const orderAmount = sales.commission / (sales.rate / 100);
      secondaryOrderDetails.push({
        name: sales.name,
        rate: sales.rate,
        commission: sales.commission,
        orderAmount: orderAmount
      });
      secondaryTotalAmount += orderAmount;
      console.log(`${sales.name}: $${sales.commission}佣金 ÷ ${sales.rate}% = $${orderAmount.toFixed(2)}订单金额`);
    }
  });
  
  console.log(`二级销售订单总金额: $${secondaryTotalAmount.toFixed(2)}`);
  
  // 一级销售从二级销售获得的佣金 = 二级销售订单金额 × (40% - 二级销售平均佣金率)
  const primaryFromSecondaryCommission = secondaryTotalAmount * ((40 - averageSecondaryRate) / 100);
  console.log(`一级销售从二级销售获得佣金: $${secondaryTotalAmount.toFixed(2)} × (40%-${averageSecondaryRate}%) = $${primaryFromSecondaryCommission.toFixed(2)}`);
  
  // 一级销售直接订单佣金
  const primaryDirectCommission = screenshotData.totalCommission - primaryFromSecondaryCommission;
  console.log(`一级销售直接订单佣金: $${screenshotData.totalCommission} - $${primaryFromSecondaryCommission.toFixed(2)} = $${primaryDirectCommission.toFixed(2)}`);
  
  // 一级销售直接订单金额
  const primaryDirectAmount = primaryDirectCommission / 0.40;
  console.log(`一级销售直接订单金额: $${primaryDirectCommission.toFixed(2)} ÷ 40% = $${primaryDirectAmount.toFixed(2)}`);
  
  // 总订单金额
  const totalOrderAmount = primaryDirectAmount + secondaryTotalAmount;
  console.log(`总订单金额: $${primaryDirectAmount.toFixed(2)} + $${secondaryTotalAmount.toFixed(2)} = $${totalOrderAmount.toFixed(2)}`);
  
  // 计算佣金比率
  const calculatedRate = (screenshotData.totalCommission / totalOrderAmount) * 100;
  console.log(`\n🧮 按新公式计算的佣金比率:`);
  console.log(`($${screenshotData.totalCommission} ÷ $${totalOrderAmount.toFixed(2)}) × 100% = ${calculatedRate.toFixed(1)}%`);
  
  const actualRate = parseFloat(screenshotData.commissionRate);
  console.log(`📱 页面显示的佣金比率: ${actualRate}%`);
  
  if (Math.abs(calculatedRate - actualRate) < 1) {
    console.log('✅ 逻辑验证: 计算结果与显示一致');
  } else {
    console.log(`⚠️ 逻辑验证: 计算${calculatedRate.toFixed(1)}%，显示${actualRate}%，存在差异`);
    console.log('💭 可能原因：');
    console.log('1. 页面使用的是旧的计算逻辑（40% - 平均佣金率）');
    console.log('2. 数据更新存在延迟');
    console.log('3. 新的计算逻辑尚未完全生效');
    
    // 检查旧逻辑
    const oldLogicRate = 40 + averageSecondaryRate;
    console.log(`🔍 如果用旧逻辑: 40% + ${averageSecondaryRate}% = ${oldLogicRate}%`);
    if (Math.abs(oldLogicRate - actualRate) < 1) {
      console.log('❌ 确认：页面仍在使用旧的计算逻辑！');
    }
  }
}

console.log('\n📋 关键发现:');
console.log('1. 二级销售1有1个订单，获得$56.40佣金');
console.log('2. 二级销售3有1个订单，获得$52.64佣金');
console.log('3. 二级销售2无订单');
console.log('4. 一级销售有2个直接订单');
console.log('5. 页面显示佣金比率为70%');

console.log('\n🎉 验证结论:');
if (secondaryTotalOrders > 0) {
  console.log('📊 这是一个混合订单情况（一级销售直接订单 + 二级销售订单）');
  console.log('🧮 需要按照新的复杂计算公式来验证70%是否正确');
} else {
  console.log('✅ 显示的佣金比率符合新的计算逻辑');
}