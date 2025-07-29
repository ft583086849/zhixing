const axios = require('axios');

async function testFrontendActual() {
  console.log('🔍 测试前端实际状态\n');
  
  try {
    // 1. 检查前端服务
    console.log('1️⃣ 检查前端服务...');
    const frontendResponse = await axios.get('http://localhost:3000/');
    console.log('✅ 前端服务正常');
    console.log('HTML标题:', frontendResponse.data.includes('支付管理系统') ? '正确' : '错误');
    
    // 2. 检查JavaScript bundle
    console.log('\n2️⃣ 检查JavaScript bundle...');
    try {
      const bundleResponse = await axios.get('http://localhost:3000/static/js/bundle.js');
      console.log('✅ JavaScript bundle可访问');
      console.log('Bundle大小:', (bundleResponse.data.length / 1024 / 1024).toFixed(2), 'MB');
    } catch (error) {
      console.log('❌ JavaScript bundle不可访问');
    }
    
    // 3. 检查管理员登录页面
    console.log('\n3️⃣ 检查管理员登录页面...');
    try {
      const adminResponse = await axios.get('http://localhost:3000/#/admin');
      console.log('✅ 管理员页面可访问');
    } catch (error) {
      console.log('❌ 管理员页面不可访问:', error.message);
    }
    
    console.log('\n🎯 现在请在浏览器中：');
    console.log('1. 访问：http://localhost:3000/#/admin');
    console.log('2. 使用以下信息登录：');
    console.log('   用户名：知行');
    console.log('   密码：Zhixing Universal Trading Signal');
    console.log('3. 查看数据概览页面');
    
    console.log('\n🔍 应该能看到：');
    console.log('1. 🔥 红色的测试信息框："测试：AdminOverview组件正在渲染！"');
    console.log('2. 蓝色的调试信息框，显示数据状态');
    console.log('3. "数据概览"标题');
    console.log('4. 统计数据卡片');
    
    console.log('\n📋 如果页面完全空白，说明：');
    console.log('1. 前端JavaScript没有正确加载');
    console.log('2. React应用没有启动');
    console.log('3. 需要检查浏览器Console中的错误');
    
    console.log('\n📋 如果页面有内容但没有我们的组件，说明：');
    console.log('1. 路由配置有问题');
    console.log('2. 组件导入失败');
    console.log('3. 需要检查Console中的错误信息');
    
    console.log('\n💡 调试步骤：');
    console.log('1. 打开浏览器开发者工具 (F12)');
    console.log('2. 查看Console标签页的错误信息');
    console.log('3. 查看Network标签页的资源加载情况');
    console.log('4. 使用Cmd+Shift+R强制刷新');
    console.log('5. 检查是否有JavaScript错误阻止了应用启动');
    
    console.log('\n🚨 如果看到JavaScript错误，请告诉我具体的错误信息！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFrontendActual(); 