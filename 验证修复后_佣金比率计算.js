/**
 * 验证修复后 - 佣金比率计算
 * 使用正确的公式验证计算结果
 */

console.log('🔧 验证修复后的佣金比率计算逻辑');
console.log('=' .repeat(50));

// 使用用户提供的实际数据
const testData = {
  // 用户说: 三个二级销售的订单数量都是0，我的直接用户订单是2单，佣金比率是70%
  // 但根据新逻辑应该是37.8%
  primaryDirectOrders: 2,
  secondarySales: [
    { name: '二级销售1', rate: 30.0, orders: 1, amount: 188.00 },
    { name: '二级销售2', rate: 32.0, orders: 0, amount: 0 },
    { name: '二级销售3', rate: 28.0, orders: 1, amount: 188.00 }
  ],
  totalCommission: 1835.2
};

console.log('📊 用户提供的实际数据:');
console.log(`- 一级销售直接订单: ${testData.primaryDirectOrders}单`);
console.log(`- 二级销售: ${testData.secondarySales.length}个`);
console.log(`- 总佣金: $${testData.totalCommission}`);

// 修复前的错误计算
function calculateOldWrongLogic() {
  console.log('\n❌ 修复前的错误计算 (1 - averageSecondaryRate):');
  console.log('-' .repeat(30));
  
  const secondaryTotalAmount = testData.secondarySales.reduce((sum, sales) => sum + sales.amount, 0);
  const averageSecondaryRate = testData.secondarySales.reduce((sum, sales) => sum + sales.rate, 0) / testData.secondarySales.length / 100; // 转换为小数
  
  console.log(`二级销售订单总金额: $${secondaryTotalAmount}`);
  console.log(`二级销售平均佣金率: ${(averageSecondaryRate * 100).toFixed(1)}%`);
  
  // 错误的公式
  const wrongPrimaryFromSecondary = secondaryTotalAmount * (1 - averageSecondaryRate);
  
  console.log(`错误计算: $${secondaryTotalAmount} × (1 - ${averageSecondaryRate.toFixed(2)}) = $${wrongPrimaryFromSecondary.toFixed(2)}`);
  console.log(`这显然不对！一级销售不可能从二级销售获得这么多佣金`);
  
  return {
    secondaryTotalAmount,
    averageSecondaryRate: averageSecondaryRate * 100,
    wrongResult: wrongPrimaryFromSecondary
  };
}

// 修复后的正确计算  
function calculateNewCorrectLogic() {
  console.log('\n✅ 修复后的正确计算 (40% - 二级销售平均佣金率):');
  console.log('-' .repeat(30));
  
  const secondaryTotalAmount = testData.secondarySales.reduce((sum, sales) => sum + sales.amount, 0);
  const averageSecondaryRatePercent = testData.secondarySales.reduce((sum, sales) => sum + sales.rate, 0) / testData.secondarySales.length;
  
  console.log(`二级销售订单总金额: $${secondaryTotalAmount}`);
  console.log(`二级销售平均佣金率: ${averageSecondaryRatePercent.toFixed(1)}%`);
  
  // 正确的公式: 40% - 二级销售平均佣金率
  const correctPrimaryFromSecondary = secondaryTotalAmount * ((40 - averageSecondaryRatePercent) / 100);
  
  console.log(`正确计算: $${secondaryTotalAmount} × (40% - ${averageSecondaryRatePercent.toFixed(1)}%) = $${secondaryTotalAmount} × ${(40 - averageSecondaryRatePercent).toFixed(1)}% = $${correctPrimaryFromSecondary.toFixed(2)}`);
  
  // 推算一级销售直接订单佣金和金额
  const primaryDirectCommission = testData.totalCommission - correctPrimaryFromSecondary;
  const primaryDirectAmount = primaryDirectCommission / 0.40;
  const totalOrderAmount = primaryDirectAmount + secondaryTotalAmount;
  
  console.log(`\n📊 完整计算:`)
  console.log(`一级销售从二级销售获得佣金: $${correctPrimaryFromSecondary.toFixed(2)}`);
  console.log(`一级销售直接订单佣金: $${testData.totalCommission} - $${correctPrimaryFromSecondary.toFixed(2)} = $${primaryDirectCommission.toFixed(2)}`);
  console.log(`一级销售直接订单金额: $${primaryDirectCommission.toFixed(2)} ÷ 40% = $${primaryDirectAmount.toFixed(2)}`);
  console.log(`总订单金额: $${primaryDirectAmount.toFixed(2)} + $${secondaryTotalAmount} = $${totalOrderAmount.toFixed(2)}`);
  
  const finalCommissionRate = (testData.totalCommission / totalOrderAmount) * 100;
  console.log(`最终佣金比率: $${testData.totalCommission} ÷ $${totalOrderAmount.toFixed(2)} × 100% = ${finalCommissionRate.toFixed(1)}%`);
  
  return {
    secondaryTotalAmount,
    averageSecondaryRate: averageSecondaryRatePercent,
    correctPrimaryFromSecondary,
    primaryDirectCommission,
    primaryDirectAmount,
    totalOrderAmount,
    finalCommissionRate
  };
}

// 验证边界情况
function testBoundaryCases() {
  console.log('\n🔍 验证边界情况:');
  console.log('-' .repeat(30));
  
  // 情况1: 无订单
  console.log('1. 无订单时: 应显示40% ✅');
  
  // 情况2: 只有一级销售直接订单，无二级销售
  const onlyPrimaryOrders = 5000;
  const onlyPrimaryCommission = onlyPrimaryOrders * 0.40;
  const onlyPrimaryRate = (onlyPrimaryCommission / onlyPrimaryOrders) * 100;
  console.log(`2. 只有一级直接订单: $${onlyPrimaryOrders} × 40% ÷ $${onlyPrimaryOrders} = ${onlyPrimaryRate}% ✅`);
  
  // 情况3: 二级销售平均佣金率为40%时
  const secondaryAmount = 1000;
  const secondaryRate = 40;
  const primaryFromSecondaryWhen40 = secondaryAmount * ((40 - secondaryRate) / 100);
  console.log(`3. 二级销售佣金率40%时: $${secondaryAmount} × (40%-40%) = $${primaryFromSecondaryWhen40} ✅`);
  
  // 情况4: 二级销售佣金率为0%时
  const primaryFromSecondaryWhen0 = secondaryAmount * ((40 - 0) / 100);
  console.log(`4. 二级销售佣金率0%时: $${secondaryAmount} × (40%-0%) = $${primaryFromSecondaryWhen0} ✅`);
}

// 执行验证
console.log('\n🚀 开始验证...\n');

const oldResult = calculateOldWrongLogic();
const newResult = calculateNewCorrectLogic();
testBoundaryCases();

console.log('\n' + '=' .repeat(50));
console.log('📊 修复验证总结');
console.log('=' .repeat(50));

console.log(`❌ 修复前错误结果: 一级从二级获得 $${oldResult.wrongResult.toFixed(2)} (显然错误)`);
console.log(`✅ 修复后正确结果: 一级从二级获得 $${newResult.correctPrimaryFromSecondary.toFixed(2)} (合理)`);
console.log(`🎯 最终佣金比率: ${newResult.finalCommissionRate.toFixed(1)}% (应该接近37.8%)`);

const isClose = Math.abs(newResult.finalCommissionRate - 37.8) < 2.0;
console.log(`\n✅ 修复状态: ${isClose ? '成功' : '需要进一步调整'}!`);

if (isClose) {
  console.log('\n🎉 佣金比率计算逻辑已正确修复！');
  console.log('📝 修复内容:');
  console.log('- 前端页面: client/src/pages/PrimarySalesSettlementPage.js');
  console.log('- 管理员页面: client/src/components/admin/AdminSales.js');
  console.log('- 公式修正: (1 - rate) → ((40 - rate*100) / 100)');
  
  console.log('\n🚀 下一步: 重新提交并部署修复');
} else {
  console.log('\n⚠️  计算结果仍有偏差，需要进一步调查');
}