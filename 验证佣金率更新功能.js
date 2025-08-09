/**
 * 🔍 验证佣金率更新功能
 * 用于测试销售管理页面的佣金率设置功能
 */

// 在浏览器控制台运行此脚本
// 访问: https://zhixing-seven.vercel.app/admin/sales

console.log('📊 开始验证佣金率更新功能...\n');

// 1. 检查Redux Store
console.log('1️⃣ 检查Redux Store状态:');
const state = window.__REDUX_DEVTOOLS_EXTENSION__ && 
  window.__REDUX_DEVTOOLS_EXTENSION__.getState();
if (state) {
  console.log('✅ Redux Store 可访问');
  console.log('销售数据:', state.admin?.sales);
} else {
  console.log('⚠️ Redux DevTools 未安装');
}

// 2. 模拟佣金率更新请求
console.log('\n2️⃣ 测试API调用:');
async function testCommissionUpdate() {
  try {
    // 获取第一个销售记录用于测试
    const testSalesId = 'test_id'; // 替换为实际的销售ID
    const testRate = 0.25; // 25%
    const testType = 'secondary';
    
    console.log('测试参数:', {
      salesId: testSalesId,
      commissionRate: testRate,
      salesType: testType
    });
    
    // 这里需要实际的销售ID才能测试
    console.log('💡 请在页面上手动点击某个销售的编辑按钮进行测试');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 3. 监听网络请求
console.log('\n3️⃣ 监听网络请求:');
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  if (url.includes('supabase') && options?.method === 'PATCH') {
    console.log('📡 捕获到更新请求:');
    console.log('URL:', url);
    console.log('Body:', options.body);
    
    try {
      const body = JSON.parse(options.body);
      console.log('请求数据:', body);
    } catch (e) {
      console.log('请求数据解析失败');
    }
  }
  
  return originalFetch.apply(this, args)
    .then(response => {
      if (url.includes('supabase') && options?.method === 'PATCH') {
        response.clone().json().then(data => {
          console.log('📥 响应数据:', data);
        }).catch(() => {});
      }
      return response;
    })
    .catch(error => {
      if (url.includes('supabase') && options?.method === 'PATCH') {
        console.error('❌ 请求失败:', error);
      }
      throw error;
    });
};

console.log('✅ 网络请求监听已启动');

// 4. 添加调试日志到控制台
console.log('\n4️⃣ 调试建议:');
console.log('• 打开开发者工具的Network标签');
console.log('• 尝试修改任意销售的佣金率');
console.log('• 观察控制台输出的参数和错误信息');
console.log('• 检查Network标签中的请求详情');

// 5. 检查页面上的错误处理
console.log('\n5️⃣ 页面错误处理:');
window.addEventListener('unhandledrejection', event => {
  if (event.reason?.message?.includes('佣金')) {
    console.error('🔴 捕获到佣金相关错误:', event.reason);
    console.log('错误详情:', {
      message: event.reason.message,
      stack: event.reason.stack
    });
  }
});

console.log('\n📋 验证脚本已就绪，请手动测试佣金率更新功能');
console.log('提示: 点击任意销售的编辑按钮，修改佣金率并保存');

// 导出测试函数供手动调用
window.testCommissionUpdate = testCommissionUpdate;
