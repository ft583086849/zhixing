// 浏览器控制台诊断脚本
// 检查数据概览和销售管理数据问题

console.log('🔍 开始诊断数据获取问题...');

// 1. 检查Redux状态
const state = window.__REDUX_DEVTOOLS_EXTENSION__ ? 
  window.__REDUX_DEVTOOLS_EXTENSION__.getState() : 
  null;

if (state) {
  console.log('\n📊 Redux状态检查:');
  console.log('Admin Stats:', state.admin?.stats);
  console.log('Admin Orders:', state.admin?.orders?.length || 0, '条订单');
  console.log('Admin Sales:', state.admin?.sales?.length || 0, '个销售');
  console.log('Admin Loading:', state.admin?.loading);
  console.log('Admin Error:', state.admin?.error);
} else {
  console.log('❌ Redux DevTools 不可用');
}

// 2. 检查API调用
console.log('\n🌐 API调用测试:');

// 测试获取订单数据
fetch('/api/orders', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Orders API响应:', data);
})
.catch(error => {
  console.log('❌ Orders API错误:', error);
});

// 3. 检查数据库连接（通过API）
console.log('\n🗄️ 数据库连接测试:');
console.log('请在Supabase管理界面检查:');
console.log('1. orders表是否有数据');
console.log('2. primary_sales和secondary_sales表是否有数据');
console.log('3. API密钥是否正确配置');

// 4. 检查缓存
console.log('\n🗂️ 缓存状态:');
console.log('LocalStorage keys:', Object.keys(localStorage));
console.log('SessionStorage keys:', Object.keys(sessionStorage));

// 5. 检查控制台错误
console.log('\n🚨 请注意控制台中的任何API错误或警告');
console.log('特别关注:');
console.log('- CORS错误');
console.log('- 401/403认证错误');
console.log('- 网络连接错误');
console.log('- Supabase API密钥错误');

console.log('\n✨ 诊断完成！请查看上述输出结果');
