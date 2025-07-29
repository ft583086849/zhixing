const axios = require('axios');

async function testComponentDebug() {
  console.log('🔍 测试组件调试信息\n');
  
  try {
    // 1. 测试后端API
    console.log('1️⃣ 测试后端API...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    
    const statsResponse = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ 统计数据API正常');
    console.log('返回数据:', statsResponse.data);
    
    // 2. 检查前端服务
    console.log('\n2️⃣ 检查前端服务...');
    const frontendResponse = await axios.get('http://localhost:3000/');
    console.log('✅ 前端服务正常');
    
    console.log('\n🎉 后端和前端服务都正常！');
    console.log('\n📱 现在请在浏览器中：');
    console.log('1. 访问：http://localhost:3000/#/admin');
    console.log('2. 使用以下信息登录：');
    console.log('   用户名：知行');
    console.log('   密码：Zhixing Universal Trading Signal');
    console.log('3. 打开浏览器开发者工具 (F12)');
    console.log('4. 查看Console标签页');
    console.log('5. 查找以"🔍"开头的调试信息');
    
    console.log('\n📋 应该看到的调试信息：');
    console.log('- "🔍 AdminOverview: 组件开始渲染"');
    console.log('- "🔍 AdminOverview: Redux状态"');
    console.log('- "🔍 AdminOverview: useEffect触发，调用getStats"');
    console.log('- "🔍 adminSlice: 开始调用getStats API"');
    console.log('- "🔍 adminSlice: getStats API调用成功"');
    console.log('- "🔍 adminSlice: getStats.fulfilled"');
    console.log('- "🔍 AdminOverview Debug:"');
    
    console.log('\n🔧 如果看不到这些调试信息，可能的问题：');
    console.log('1. 组件没有正确渲染');
    console.log('2. Redux状态管理有问题');
    console.log('3. API调用失败');
    console.log('4. 浏览器缓存问题');
    
    console.log('\n💡 调试建议：');
    console.log('1. 强制刷新页面 (Ctrl+Shift+R)');
    console.log('2. 清除浏览器缓存');
    console.log('3. 检查Network标签页的API请求');
    console.log('4. 检查是否有JavaScript错误');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testComponentDebug(); 