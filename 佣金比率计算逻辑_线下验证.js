/**
 * 一级销售佣金比率计算逻辑 - 线下验证脚本
 * 
 * 新的计算公式：
 * 佣金比率 = （（一级销售的用户下单金额×40%）+（二级销售订单总金额-二级销售分佣比率平均值×二级销售订单总金额））/（二级销售订单总金额+一级销售的用户下单金额）×100%
 */

// 复制前端的计算逻辑
function calculatePrimaryCommissionRate(testData) {
  const { primarySalesOrders, primarySalesStats } = testData;
  
  // 新的佣金比率计算逻辑
  if (!primarySalesOrders?.data || primarySalesOrders.data.length === 0) {
    return 40; // 没有订单时，显示40%
  }
  
  // 获取配置确认的订单
  const confirmedOrders = primarySalesOrders.data.filter(order => order.config_confirmed === true);
  
  if (confirmedOrders.length === 0) {
    return 40; // 没有配置确认的订单时，显示40%
  }
  
  // 1. 计算一级销售的用户下单金额（没有secondary_sales_name的订单）
  const primaryDirectOrders = confirmedOrders.filter(order => !order.secondary_sales_name);
  const primaryDirectAmount = primaryDirectOrders.reduce((sum, order) => sum + order.amount, 0);
  
  // 2. 计算二级销售订单总金额
  const secondaryOrders = confirmedOrders.filter(order => order.secondary_sales_name);
  const secondaryTotalAmount = secondaryOrders.reduce((sum, order) => sum + order.amount, 0);
  
  // 3. 计算二级销售分佣比率平均值
  let averageSecondaryRate = 0;
  if (primarySalesStats?.secondarySales && primarySalesStats.secondarySales.length > 0) {
    const secondaryRates = primarySalesStats.secondarySales.map(sales => sales.commission_rate);
    averageSecondaryRate = secondaryRates.reduce((sum, rate) => sum + rate, 0) / secondaryRates.length;
  }
  
  // 4. 计算总订单金额
  const totalOrderAmount = primaryDirectAmount + secondaryTotalAmount;
  
  if (totalOrderAmount === 0) {
    return 40; // 总金额为0时，显示40%
  }
  
  // 5. 计算一级销售总佣金
  const primaryDirectCommission = primaryDirectAmount * 0.40; // 一级销售直接用户佣金：40%
  const primaryFromSecondaryCommission = secondaryTotalAmount * (1 - averageSecondaryRate); // 一级销售从二级销售获得的佣金
  const totalPrimaryCommission = primaryDirectCommission + primaryFromSecondaryCommission;
  
  // 6. 计算一级销售佣金比率
  const primaryCommissionRate = (totalPrimaryCommission / totalOrderAmount) * 100;
  
  return parseFloat(primaryCommissionRate.toFixed(1));
}

// 测试用例
const testCases = [
  {
    name: "测试用例1：只有一级销售直接订单",
    data: {
      primarySalesOrders: {
        data: [
          { id: 1, amount: 1000, config_confirmed: true, secondary_sales_name: null },
          { id: 2, amount: 500, config_confirmed: true, secondary_sales_name: null },
        ]
      },
      primarySalesStats: {
        secondarySales: []
      }
    },
    expected: 40, // 只有直接订单，应该是40%
    description: "一级销售直接订单：1500元，无二级销售 → 佣金比率 = (1500*40%)/1500 = 40%"
  },
  
  {
    name: "测试用例2：只有二级销售订单",
    data: {
      primarySalesOrders: {
        data: [
          { id: 1, amount: 1000, config_confirmed: true, secondary_sales_name: "二级销售A" },
          { id: 2, amount: 500, config_confirmed: true, secondary_sales_name: "二级销售B" },
        ]
      },
      primarySalesStats: {
        secondarySales: [
          { wechat_name: "二级销售A", commission_rate: 0.30 },
          { wechat_name: "二级销售B", commission_rate: 0.32 },
        ]
      }
    },
    expected: 69.0, // 二级销售平均佣金率31%，一级销售获得69%的佣金，佣金比率 = (1500*69%)/1500 = 69%
    description: "二级销售订单：1500元，平均佣金率31% → 佣金比率 = (1500*(1-0.31))/1500 = 69%"
  },
  
  {
    name: "测试用例3：混合订单情况",
    data: {
      primarySalesOrders: {
        data: [
          { id: 1, amount: 1000, config_confirmed: true, secondary_sales_name: null }, // 一级销售直接
          { id: 2, amount: 800, config_confirmed: true, secondary_sales_name: "二级销售A" },
          { id: 3, amount: 600, config_confirmed: true, secondary_sales_name: "二级销售B" },
        ]
      },
      primarySalesStats: {
        secondarySales: [
          { wechat_name: "二级销售A", commission_rate: 0.30 },
          { wechat_name: "二级销售B", commission_rate: 0.28 },
        ]
      }
    },
    expected: 58.1, 
    description: "一级销售直接：1000元，二级销售：1400元(平均佣金率29%) → 佣金比率 = (1000*40% + 1400*71%)/2400 = 58.08%"
  },
  
  {
    name: "测试用例4：包含未配置确认的订单",
    data: {
      primarySalesOrders: {
        data: [
          { id: 1, amount: 1000, config_confirmed: true, secondary_sales_name: null },
          { id: 2, amount: 500, config_confirmed: false, secondary_sales_name: null }, // 不计入
          { id: 3, amount: 800, config_confirmed: true, secondary_sales_name: "二级销售A" },
        ]
      },
      primarySalesStats: {
        secondarySales: [
          { wechat_name: "二级销售A", commission_rate: 0.30 },
        ]
      }
    },
    expected: 53.3,
    description: "仅配置确认的订单计入：一级销售1000元，二级销售800元(30%佣金率) → 佣金比率 = (1000*40% + 800*70%)/1800 = 53.33%"
  },
  
  {
    name: "测试用例5：无订单情况",
    data: {
      primarySalesOrders: {
        data: []
      },
      primarySalesStats: {
        secondarySales: []
      }
    },
    expected: 40,
    description: "无订单时默认显示40%"
  }
];

// 执行验证
console.log("🧮 一级销售佣金比率计算逻辑 - 线下验证开始\n");
console.log("📋 计算公式：");
console.log("佣金比率 = （（一级销售的用户下单金额×40%）+（二级销售订单总金额-二级销售分佣比率平均值×二级销售订单总金额））/（二级销售订单总金额+一级销售的用户下单金额）×100%\n");

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`\n🔍 ${testCase.name}`);
  console.log(`📝 ${testCase.description}`);
  
  const result = calculatePrimaryCommissionRate(testCase.data);
  const passed = Math.abs(result - testCase.expected) < 0.1; // 允许0.1%的误差
  
  console.log(`⚡ 计算结果: ${result}%`);
  console.log(`🎯 期望结果: ${testCase.expected}%`);
  console.log(`✅ 测试状态: ${passed ? '通过' : '失败'}`);
  
  if (passed) {
    passedTests++;
  } else {
    console.log(`❌ 误差: ${Math.abs(result - testCase.expected)}%`);
  }
});

console.log(`\n📊 验证总结:`);
console.log(`总计测试: ${totalTests}个`);
console.log(`通过测试: ${passedTests}个`);
console.log(`失败测试: ${totalTests - passedTests}个`);
console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log(`\n🎉 线下验证完全通过！新的佣金比率计算逻辑实现正确！`);
} else {
  console.log(`\n⚠️  部分测试失败，需要检查计算逻辑！`);
}

console.log(`\n🔗 详细计算步骤说明:`);
console.log(`1. 筛选配置确认的订单(config_confirmed: true)`);
console.log(`2. 分离一级销售直接订单(无secondary_sales_name)和二级销售订单`);
console.log(`3. 计算二级销售佣金比率平均值`);
console.log(`4. 计算一级销售总佣金 = 直接订单佣金(40%) + 二级销售剩余佣金`);
console.log(`5. 计算佣金比率 = 总佣金 / 总订单金额 × 100%`);