const axios = require('axios');

async function finalDebugTest() {
  console.log('🎯 最终调试测试\n');
  
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
    
    // 2. 测试前端页面
    console.log('\n2️⃣ 测试前端页面...');
    const frontendResponse = await axios.get('http://localhost:3000/');
    console.log('✅ 前端页面加载正常');
    
    // 3. 检查页面是否包含组件
    const pageContent = frontendResponse.data;
    if (pageContent.includes('AdminOverview')) {
      console.log('✅ 页面包含AdminOverview组件');
    } else {
      console.log('⚠️  页面可能不包含AdminOverview组件');
    }
    
    console.log('\n🎉 测试完成！');
    console.log('\n📱 现在请在浏览器中：');
    console.log('1. 访问：http://localhost:3000/#/admin');
    console.log('2. 使用以下信息登录：');
    console.log('   用户名：知行');
    console.log('   密码：Zhixing Universal Trading Signal');
    console.log('3. 查看数据概览页面');
    
    console.log('\n📋 现在应该能看到：');
    console.log('1. 一个蓝色的调试信息框，显示：');
    console.log('   - loading: false');
    console.log('   - stats: {"total_orders":1,"confirmed_config_orders":1,"total_amount":0,...}');
    console.log('   - timeRange: today');
    console.log('   - customRange: []');
    console.log('2. "数据概览"标题');
    console.log('3. 统计数据卡片');
    
    console.log('\n🔧 如果仍然看不到内容，请：');
    console.log('1. 强制刷新页面 (Ctrl+Shift+R)');
    console.log('2. 清除浏览器缓存');
    console.log('3. 检查Console是否有JavaScript错误');
    console.log('4. 检查Network标签页的API请求');
    
    console.log('\n💡 如果仍然看不到内容，请：');
    console.log('1. 强制刷新页面 (Ctrl+Shift+R)');
    console.log('2. 清除浏览器缓存');
    console.log('3. 检查Console是否有JavaScript错误');
    console.log('4. 检查Network标签页的API请求');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

finalDebugTest(); 