const axios = require('axios');

async function testComponentLoading() {
  console.log('🔍 测试组件加载\n');
  
  try {
    // 1. 等待前端服务启动
    console.log('1️⃣ 等待前端服务启动...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. 测试前端页面
    console.log('\n2️⃣ 测试前端页面...');
    const frontendResponse = await axios.get('http://localhost:3000/');
    console.log('✅ 前端页面加载正常');
    
    // 3. 检查页面内容是否包含调试信息
    const pageContent = frontendResponse.data;
    if (pageContent.includes('AdminOverview')) {
      console.log('✅ 页面包含AdminOverview组件');
    } else {
      console.log('⚠️  页面可能不包含AdminOverview组件');
    }
    
    // 4. 测试后端API
    console.log('\n3️⃣ 测试后端API...');
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
    
    console.log('\n🎉 测试完成！');
    console.log('\n📱 现在请在浏览器中：');
    console.log('1. 访问：http://localhost:3000/#/admin');
    console.log('2. 使用以下信息登录：');
    console.log('   用户名：知行');
    console.log('   密码：Zhixing Universal Trading Signal');
    console.log('3. 打开浏览器开发者工具 (F12)');
    console.log('4. 查看Console标签页');
    console.log('5. 查找以"🔍"开头的调试信息');
    
    console.log('\n📋 如果仍然看不到调试信息，请：');
    console.log('1. 强制刷新页面 (Ctrl+Shift+R)');
    console.log('2. 清除浏览器缓存');
    console.log('3. 检查Network标签页是否有API请求');
    console.log('4. 检查是否有JavaScript错误');
    
    console.log('\n🔧 如果问题仍然存在，可能的原因：');
    console.log('1. 组件没有正确导入');
    console.log('2. 路由配置有问题');
    console.log('3. Redux状态管理有问题');
    console.log('4. 组件渲染被阻止');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 连接被拒绝，请检查：');
      console.log('1. 前端服务是否启动：cd client && npm start');
      console.log('2. 后端服务是否启动：cd server && npm start');
    }
  }
}

testComponentLoading(); 