// 在浏览器控制台运行此脚本诊断佣金率更新问题

console.log('🔍 开始诊断佣金率更新问题...\n');

// 1. 检查 Redux store 中的销售数据结构
const state = store.getState();
const sales = state.admin?.sales || [];

console.log('📊 销售数据结构分析:');
console.log(`总共 ${sales.length} 条销售记录\n`);

// 2. 分析数据结构
sales.slice(0, 3).forEach((sale, index) => {
  console.log(`\n记录 ${index + 1}:`);
  console.log('- 有 sales 属性?', !!sale.sales);
  console.log('- 直接有 id?', !!sale.id);
  console.log('- sales.id?', sale.sales?.id);
  console.log('- 直接 commission_rate?', sale.commission_rate);
  console.log('- sales.commission_rate?', sale.sales?.commission_rate);
  console.log('- sales_type?', sale.sales_type);
  console.log('- sales.sales_type?', sale.sales?.sales_type);
  console.log('数据结构:', {
    hasNestedSales: !!sale.sales,
    topLevelId: sale.id,
    nestedId: sale.sales?.id,
    topLevelRate: sale.commission_rate,
    nestedRate: sale.sales?.commission_rate,
    topLevelType: sale.sales_type,
    nestedType: sale.sales?.sales_type
  });
});

// 3. 检查佣金率格式
console.log('\n\n📈 佣金率格式分析:');
const rates = new Set();
sales.forEach(sale => {
  const rate = sale.commission_rate || sale.sales?.commission_rate;
  if (rate !== null && rate !== undefined) {
    rates.add(rate);
  }
});

const rateArray = Array.from(rates).sort((a, b) => a - b);
console.log('所有佣金率值:', rateArray);
console.log('小数格式 (< 1):', rateArray.filter(r => r < 1));
console.log('百分比格式 (>= 1):', rateArray.filter(r => r >= 1));

// 4. 模拟更新调用
console.log('\n\n🔧 模拟更新调用:');
const testSale = sales[0];
if (testSale) {
  console.log('测试销售记录:', testSale);
  
  // 获取 salesId
  const salesId = testSale.sales?.id || testSale.id;
  const salesType = testSale.sales?.sales_type || testSale.sales_type || 'secondary';
  const currentRate = testSale.sales?.commission_rate || testSale.commission_rate;
  
  console.log('参数提取:');
  console.log('- salesId:', salesId);
  console.log('- salesType:', salesType);
  console.log('- currentRate:', currentRate);
  
  if (!salesId) {
    console.error('❌ 无法获取销售ID！数据结构有问题');
  } else {
    console.log('✅ 可以获取销售ID，理论上可以更新');
  }
}

// 5. 检查 API 方法是否存在
console.log('\n\n🔌 API 方法检查:');
console.log('AdminAPI.updateCommissionRate 存在?', typeof AdminAPI?.updateCommissionRate === 'function');
console.log('SalesAPI.updateCommissionRate 存在?', typeof SalesAPI?.updateCommissionRate === 'function');

console.log('\n\n✅ 诊断完成！');
console.log('如果看到 "无法获取销售ID" 错误，说明数据结构有问题');
console.log('请将以上输出截图发给开发者');
