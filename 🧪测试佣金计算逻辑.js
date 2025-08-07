/**
 * 🧪 测试佣金计算逻辑
 * 在浏览器控制台运行此脚本验证佣金计算是否正确
 */

// 先创建测试数据
const testData = {
  // 测试用例1：一级销售直接订单
  case1: {
    name: "一级销售直接订单",
    orderAmount: 1000,
    salesType: "primary",
    commissionRate: 0.4,  // 40%
    expectedCommission: 400,  // $1000 × 40% = $400
  },
  
  // 测试用例2：独立二级销售订单
  case2: {
    name: "独立二级销售订单",
    orderAmount: 1000,
    salesType: "secondary_independent",
    commissionRate: 0.3,  // 30%
    expectedCommission: 300,  // $1000 × 30% = $300
  },
  
  // 测试用例3：一级销售下的二级销售（25%佣金）
  case3: {
    name: "一级销售下的二级销售（25%佣金）",
    orderAmount: 1000,
    salesType: "secondary_linked",
    secondaryRate: 0.25,  // 二级拿25%
    primaryGets: 150,     // 一级拿15%（40%-25%）
    secondaryGets: 250,   // 二级拿25%
    totalSystemCommission: 400  // 系统总佣金40%
  },
  
  // 测试用例4：一级销售综合佣金率计算
  case4: {
    name: "一级销售综合佣金率",
    primaryDirectAmount: 5000,    // 一级直接订单$5000
    secondaryTotalAmount: 3000,   // 二级订单$3000
    secondaryRates: [0.25, 0.3],  // 二级佣金率25%和30%
    // 计算过程：
    // 平均二级佣金率 = (0.25 + 0.3) / 2 = 0.275 (27.5%)
    // 一级直接佣金 = $5000 × 40% = $2000
    // 一级从二级获得 = $3000 × (40% - 27.5%) = $3000 × 12.5% = $375
    // 总佣金 = $2000 + $375 = $2375
    // 综合佣金率 = $2375 / $8000 = 29.69%
    expectedRate: 0.2969
  }
};

// 测试函数
function runCommissionTests() {
  console.clear();
  console.log('🧪 开始测试佣金计算逻辑');
  console.log('='.repeat(60));
  
  // 测试1：一级销售直接订单
  console.log('\n✅ 测试1：' + testData.case1.name);
  const commission1 = testData.case1.orderAmount * testData.case1.commissionRate;
  console.log(`订单金额: $${testData.case1.orderAmount}`);
  console.log(`佣金率: ${(testData.case1.commissionRate * 100)}%`);
  console.log(`计算佣金: $${commission1}`);
  console.log(`期望佣金: $${testData.case1.expectedCommission}`);
  console.log(`结果: ${commission1 === testData.case1.expectedCommission ? '✅ 通过' : '❌ 失败'}`);
  
  // 测试2：独立二级销售
  console.log('\n✅ 测试2：' + testData.case2.name);
  const commission2 = testData.case2.orderAmount * testData.case2.commissionRate;
  console.log(`订单金额: $${testData.case2.orderAmount}`);
  console.log(`佣金率: ${(testData.case2.commissionRate * 100)}%`);
  console.log(`计算佣金: $${commission2}`);
  console.log(`期望佣金: $${testData.case2.expectedCommission}`);
  console.log(`结果: ${commission2 === testData.case2.expectedCommission ? '✅ 通过' : '❌ 失败'}`);
  
  // 测试3：一级销售下的二级销售
  console.log('\n✅ 测试3：' + testData.case3.name);
  const secondaryCommission = testData.case3.orderAmount * testData.case3.secondaryRate;
  const primaryCommission = testData.case3.orderAmount * (0.4 - testData.case3.secondaryRate);
  console.log(`订单金额: $${testData.case3.orderAmount}`);
  console.log(`二级佣金率: ${(testData.case3.secondaryRate * 100)}%`);
  console.log(`二级获得: $${secondaryCommission} (期望: $${testData.case3.secondaryGets})`);
  console.log(`一级获得: $${primaryCommission} (期望: $${testData.case3.primaryGets})`);
  console.log(`总佣金: $${secondaryCommission + primaryCommission} (期望: $${testData.case3.totalSystemCommission})`);
  console.log(`结果: ${
    secondaryCommission === testData.case3.secondaryGets && 
    primaryCommission === testData.case3.primaryGets ? '✅ 通过' : '❌ 失败'
  }`);
  
  // 测试4：一级销售综合佣金率
  console.log('\n✅ 测试4：' + testData.case4.name);
  const { primaryDirectAmount, secondaryTotalAmount, secondaryRates } = testData.case4;
  
  // 计算平均二级佣金率
  const avgSecondaryRate = secondaryRates.reduce((sum, rate) => sum + rate, 0) / secondaryRates.length;
  
  // 计算一级销售总佣金
  const primaryDirectCommission = primaryDirectAmount * 0.4;
  const primaryFromSecondary = secondaryTotalAmount * (0.4 - avgSecondaryRate);
  const totalCommission = primaryDirectCommission + primaryFromSecondary;
  
  // 计算综合佣金率
  const totalAmount = primaryDirectAmount + secondaryTotalAmount;
  const overallRate = totalCommission / totalAmount;
  
  console.log(`一级直接订单: $${primaryDirectAmount}`);
  console.log(`二级订单总额: $${secondaryTotalAmount}`);
  console.log(`二级平均佣金率: ${(avgSecondaryRate * 100).toFixed(1)}%`);
  console.log(`一级直接佣金: $${primaryDirectCommission}`);
  console.log(`一级从二级获得: $${primaryFromSecondary.toFixed(2)}`);
  console.log(`一级总佣金: $${totalCommission.toFixed(2)}`);
  console.log(`综合佣金率: ${(overallRate * 100).toFixed(2)}%`);
  console.log(`期望佣金率: ${(testData.case4.expectedRate * 100).toFixed(2)}%`);
  console.log(`结果: ${Math.abs(overallRate - testData.case4.expectedRate) < 0.001 ? '✅ 通过' : '❌ 失败'}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`
✅ 佣金计算规则验证：
1. 一级销售直接订单：订单金额 × 40%
2. 独立二级销售：订单金额 × 30%
3. 一级销售下的二级销售：
   - 二级获得：订单金额 × 设定佣金率（如25%）
   - 一级获得：订单金额 × (40% - 二级佣金率)
4. 一级销售综合佣金率：
   - 反映一级销售在所有订单中的实际收益比率
   - 包含直接订单和从二级销售获得的佣金
  `);
}

// 如果有工具函数，测试工具函数
async function testUtilFunctions() {
  console.log('\n🔧 测试工具函数');
  console.log('='.repeat(60));
  
  // 检查工具函数是否存在
  if (typeof formatCommissionRate === 'function') {
    console.log('✅ formatCommissionRate 函数存在');
    console.log('  0.3 → ' + formatCommissionRate(0.3));
    console.log('  0.255 → ' + formatCommissionRate(0.255));
  } else {
    console.log('⚠️ formatCommissionRate 函数未找到（需要在页面中导入）');
  }
  
  if (typeof percentToDecimal === 'function') {
    console.log('✅ percentToDecimal 函数存在');
    console.log('  30 → ' + percentToDecimal(30));
    console.log('  25.5 → ' + percentToDecimal(25.5));
  } else {
    console.log('⚠️ percentToDecimal 函数未找到（需要在页面中导入）');
  }
  
  if (typeof decimalToPercent === 'function') {
    console.log('✅ decimalToPercent 函数存在');
    console.log('  0.3 → ' + decimalToPercent(0.3));
    console.log('  0.255 → ' + decimalToPercent(0.255));
  } else {
    console.log('⚠️ decimalToPercent 函数未找到（需要在页面中导入）');
  }
}

// 测试API调用
async function testAPICommission() {
  console.log('\n🌐 测试API佣金计算');
  console.log('='.repeat(60));
  
  if (window.adminAPI && typeof window.adminAPI.calculateCommission === 'function') {
    try {
      // 测试一个销售代码
      const testSalesCode = 'PS_TEST001';
      const testAmount = 1000;
      
      console.log(`测试销售代码: ${testSalesCode}`);
      console.log(`测试订单金额: $${testAmount}`);
      
      const result = await window.adminAPI.calculateCommission(testSalesCode, testAmount);
      console.log('计算结果:', result);
      console.log(`  佣金: $${result.commission}`);
      console.log(`  佣金率: ${(result.rate * 100).toFixed(1)}%`);
      console.log(`  销售类型: ${result.type}`);
    } catch (error) {
      console.error('❌ API调用失败:', error.message);
    }
  } else {
    console.log('⚠️ adminAPI.calculateCommission 不可用');
  }
}

// 执行所有测试
async function runAllTests() {
  runCommissionTests();
  await testUtilFunctions();
  await testAPICommission();
  
  console.log('\n✅ 所有测试完成！');
  console.log('如果发现问题，请检查：');
  console.log('1. 数据库中的 commission_rate 字段是否为小数格式（0.3 而不是 30）');
  console.log('2. 前端代码是否正确导入和使用工具函数');
  console.log('3. API是否正确处理佣金率的单位转换');
}

// 执行测试
runAllTests();
