/**
 * 验证资金统计页面功能
 * 
 * 使用方法：
 * 1. 访问 https://zhixing-seven.vercel.app/admin/finance
 * 2. 打开控制台(F12)
 * 3. 运行此脚本
 */

console.log('🔧 验证资金统计功能\n');
console.log('='.repeat(50));

// 1. 测试收益分配保存功能
function testProfitSave() {
  console.log('\n📊 1. 测试收益分配保存功能:');
  
  // 检查localStorage
  const saved = localStorage.getItem('profitRatios');
  if (saved) {
    const ratios = JSON.parse(saved);
    console.log('✅ 已保存的收益分配:');
    console.log('  - 公户:', ratios.public + '%');
    console.log('  - 知行:', ratios.zhixing + '%');
    console.log('  - 子俊:', ratios.zijun + '%');
    console.log('  - 总和:', (ratios.public + ratios.zhixing + ratios.zijun) + '%');
  } else {
    console.log('⚠️ 还没有保存过收益分配');
  }
  
  // 模拟保存新配置
  console.log('\n💾 模拟保存新配置...');
  const newRatios = {
    public: 45,
    zhixing: 30,
    zijun: 25
  };
  localStorage.setItem('profitRatios', JSON.stringify(newRatios));
  console.log('✅ 新配置已保存，请刷新页面查看');
}

// 2. 验证时间筛选
async function testTimeFilter() {
  console.log('\n⏰ 2. 测试时间筛选功能:');
  
  try {
    const { AdminAPI } = await import('./services/api.js');
    
    // 测试不同时间范围
    const timeRanges = ['today', 'week', 'month', 'all'];
    const results = {};
    
    for (const range of timeRanges) {
      const stats = await AdminAPI.getStats({ 
        timeRange: range, 
        usePaymentTime: true  // 资金统计使用付款时间
      });
      
      results[range] = {
        orders: stats.total_orders,
        amount: stats.total_amount,
        confirmed: stats.confirmed_amount
      };
    }
    
    console.log('\n📊 筛选结果对比:');
    console.table(results);
    
    // 检查是否有差异
    if (results.today.orders === results.all.orders) {
      console.warn('⚠️ 时间筛选可能未生效，所有时间段数据相同');
    } else {
      console.log('✅ 时间筛选正常工作');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 3. 检查已确认订单统计
async function checkConfirmedOrders() {
  console.log('\n✅ 3. 检查已确认订单统计:');
  
  const { data: orders } = await supabaseClient
    .from('orders')
    .select('id, status, amount, payment_time');
  
  // 定义已确认状态
  const confirmedStatuses = ['confirmed', 'confirmed_configuration', 'confirmed_config', 'active'];
  
  const confirmed = orders.filter(o => confirmedStatuses.includes(o.status));
  const pending = orders.filter(o => !confirmedStatuses.includes(o.status));
  
  console.log(`总订单数: ${orders.length}`);
  console.log(`已确认订单: ${confirmed.length} 个`);
  console.log(`待确认订单: ${pending.length} 个`);
  
  // 计算金额
  const confirmedAmount = confirmed.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalAmount = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  
  console.log(`\n💰 金额统计:`);
  console.log(`总金额: $${totalAmount.toFixed(2)}`);
  console.log(`已确认金额: $${confirmedAmount.toFixed(2)}`);
  console.log(`确认率: ${((confirmed.length / orders.length) * 100).toFixed(1)}%`);
}

// 4. 验证页面元素
function checkPageElements() {
  console.log('\n🎨 4. 检查页面元素:');
  
  const checks = [
    { selector: '.ant-radio-group', name: '时间选择器' },
    { selector: '.ant-table', name: '财务指标表' },
    { selector: '.ant-input-number', name: '比例输入框' },
    { selector: '.ant-btn-primary', name: '保存按钮' }
  ];
  
  checks.forEach(check => {
    const element = document.querySelector(check.selector);
    if (element) {
      console.log(`✅ ${check.name}: 存在`);
    } else {
      console.log(`❌ ${check.name}: 未找到`);
    }
  });
  
  // 检查保存按钮
  const saveBtn = document.querySelector('.ant-btn-primary');
  if (saveBtn) {
    const text = saveBtn.textContent;
    if (text.includes('保存')) {
      console.log('✅ 保存按钮状态正常');
    }
  }
}

// 主测试流程
async function runAllTests() {
  console.log('\n🚀 开始全面测试...\n');
  
  // 1. 测试保存功能
  testProfitSave();
  
  // 2. 测试时间筛选
  await testTimeFilter();
  
  // 3. 检查订单统计
  await checkConfirmedOrders();
  
  // 4. 检查页面元素
  checkPageElements();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ 测试完成！\n');
  
  console.log('建议操作:');
  console.log('1. 切换时间范围，观察数据变化');
  console.log('2. 调整收益分配比例并保存');
  console.log('3. 刷新页面验证数据持久化');
}

// 导出函数
window.testProfitSave = testProfitSave;
window.testTimeFilter = testTimeFilter;
window.checkConfirmedOrders = checkConfirmedOrders;
window.checkPageElements = checkPageElements;
window.runAllTests = runAllTests;

// 自动运行
console.log('可用命令:');
console.log('- runAllTests()     : 运行所有测试');
console.log('- testProfitSave()  : 测试保存功能');
console.log('- testTimeFilter()  : 测试时间筛选');
console.log('\n运行 runAllTests() 开始测试');
