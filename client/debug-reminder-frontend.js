// 前端调试脚本 - 在浏览器控制台运行
// 请在销售对账页面打开浏览器控制台，复制粘贴运行此代码

console.log('🐛 开始调试催单功能...');

// 1. 检查 API 对象是否存在
if (typeof salesAPI !== 'undefined') {
  console.log('✅ salesAPI 对象存在');
  
  // 检查方法是否存在
  if (salesAPI.updateOrderReminderStatus) {
    console.log('✅ updateOrderReminderStatus 方法存在');
  } else {
    console.log('❌ updateOrderReminderStatus 方法不存在！');
    console.log('   可用的方法:', Object.keys(salesAPI));
  }
} else {
  console.log('❌ salesAPI 对象不存在');
}

// 2. 查看页面上的订单数据
const orders = document.querySelectorAll('[data-row-key]');
console.log(`\n找到 ${orders.length} 个订单在页面上`);

// 3. 手动测试 API 调用
async function testReminderAPI() {
  // 导入必要的模块
  const { salesAPI } = await import('./services/api.js');
  
  console.log('\n测试 API 调用...');
  
  // 获取页面上第一个订单的ID（你需要替换为实际的订单ID）
  const testOrderId = prompt('请输入一个订单ID进行测试（查看页面上的订单ID）:');
  
  if (!testOrderId) {
    console.log('取消测试');
    return;
  }
  
  try {
    console.log(`调用 updateOrderReminderStatus(${testOrderId}, true)`);
    const result = await salesAPI.updateOrderReminderStatus(testOrderId, true);
    
    if (result.success) {
      console.log('✅ API 调用成功:', result);
      alert('催单状态更新成功！请刷新页面查看');
    } else {
      console.log('❌ API 调用失败:', result);
      alert('催单失败: ' + result.message);
    }
  } catch (error) {
    console.error('❌ 调用出错:', error);
    alert('调用出错: ' + error.message);
  }
}

// 4. 检查催单按钮
const urgeButtons = document.querySelectorAll('button');
let reminderButtons = [];
urgeButtons.forEach(btn => {
  if (btn.textContent.includes('催单')) {
    reminderButtons.push(btn);
  }
});

console.log(`\n找到 ${reminderButtons.length} 个催单按钮`);

if (reminderButtons.length > 0) {
  console.log('第一个催单按钮:', reminderButtons[0]);
  
  // 获取按钮的点击事件
  const events = reminderButtons[0]._reactProps || reminderButtons[0].onclick;
  console.log('按钮事件:', events);
}

// 5. 提供手动测试选项
console.log('\n💡 手动测试选项:');
console.log('1. 运行 testReminderAPI() 来测试API调用');
console.log('2. 检查浏览器 Network 标签页，看点击催单时的请求');
console.log('3. 查看是否有任何红色错误信息');

// 将测试函数暴露到全局
window.testReminderAPI = testReminderAPI;

console.log('\n调试准备完成！');