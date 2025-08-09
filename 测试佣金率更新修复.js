// 🧪 测试佣金率更新修复
// 请在部署后在 https://zhixing-seven.vercel.app/admin/sales 页面运行

console.log('🧪 开始测试佣金率更新修复...\n');

// 1. 检查 API 是否暴露
console.log('📌 步骤1: 检查 API 暴露');
console.log('- window.AdminAPI 存在?', !!window.AdminAPI);
console.log('- window.SalesAPI 存在?', !!window.SalesAPI);
console.log('- AdminAPI.updateCommissionRate 存在?', 
  typeof window.AdminAPI?.updateCommissionRate === 'function');

if (!window.AdminAPI || !window.SalesAPI) {
  console.error('❌ API 未正确暴露，请刷新页面重试');
  return;
}

// 2. 获取销售数据
console.log('\n📌 步骤2: 获取销售数据');
const state = window.store?.getState();
const sales = state?.admin?.sales || [];

if (sales.length === 0) {
  console.error('❌ 没有销售数据，请先刷新页面');
  return;
}

const testSale = sales[0];
console.log('测试销售记录:', {
  id: testSale.sales?.id,
  type: testSale.sales?.sales_type,
  currentRate: testSale.sales?.commission_rate,
  wechat: testSale.sales?.wechat_name
});

// 3. 测试佣金率转换逻辑
console.log('\n📌 步骤3: 测试佣金率转换');
const testRates = [0, 25, 30, 40];

testRates.forEach(inputRate => {
  let rateToStore;
  
  if (inputRate === 0) {
    rateToStore = 0;
  } else {
    rateToStore = inputRate / 100;
  }
  
  // 处理浮点数精度
  rateToStore = Math.round(rateToStore * 10000) / 10000;
  
  console.log(`输入 ${inputRate}% → 存储 ${rateToStore}`);
});

// 4. 测试实际更新（可选）
console.log('\n📌 步骤4: 测试实际更新');
console.log('要测试实际更新，请运行:');
console.log(`
// 替换下面的参数
const salesId = ${testSale.sales?.id || '1'};
const newRate = 25; // 百分比
const salesType = '${testSale.sales?.sales_type || 'primary'}';

// 统一转换为小数
const rateToStore = newRate === 0 ? 0 : Math.round((newRate / 100) * 10000) / 10000;

// 执行更新
AdminAPI.updateCommissionRate(salesId, rateToStore, salesType)
  .then(result => {
    console.log('✅ 更新成功:', result);
    // 刷新页面查看结果
    setTimeout(() => location.reload(), 1000);
  })
  .catch(error => {
    console.error('❌ 更新失败:', error);
  });
`);

console.log('\n✅ 测试脚本完成！');
console.log('如果 API 已暴露，可以复制上面的代码测试实际更新');
