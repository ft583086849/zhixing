const axios = require('axios');

async function testComponentLoading() {
  console.log('🔍 测试组件加载和调试信息\n');
  
  try {
    // 1. 检查前端服务
    console.log('1️⃣ 检查前端服务...');
    const frontendResponse = await axios.get('http://localhost:3000/');
    console.log('✅ 前端服务正常');
    
    // 2. 检查管理员页面
    console.log('\n2️⃣ 检查管理员页面...');
    const adminPageResponse = await axios.get('http://localhost:3000/#/admin');
    console.log('✅ 管理员页面可访问');
    
    // 3. 检查页面内容
    const pageContent = adminPageResponse.data;
    console.log('\n📄 页面内容检查:');
    
    // 检查是否包含关键组件
    const hasAdminOverview = pageContent.includes('AdminOverview') || pageContent.includes('数据概览');
    const hasReactApp = pageContent.includes('react') || pageContent.includes('React');
    const hasAntd = pageContent.includes('antd') || pageContent.includes('ant-design');
    
    console.log('- 包含React应用:', hasReactApp);
    console.log('- 包含Ant Design:', hasAntd);
    console.log('- 包含AdminOverview组件:', hasAdminOverview);
    
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
    
    console.log('\n📋 如果看不到红色测试框，说明：');
    console.log('1. 组件没有被正确加载');
    console.log('2. 路由配置有问题');
    console.log('3. 需要检查Console中的错误信息');
    
    console.log('\n📋 如果看到红色测试框但数据为空，说明：');
    console.log('1. 组件已加载，但API调用失败');
    console.log('2. Redux状态没有正确更新');
    console.log('3. 检查Console中的调试信息');
    
    console.log('\n💡 调试步骤：');
    console.log('1. 打开浏览器开发者工具 (F12)');
    console.log('2. 查看Console标签页');
    console.log('3. 查找以下调试信息：');
    console.log('   - "🔥 AdminOverview组件被加载了！"');
    console.log('   - "🔍 AdminOverview: 组件开始渲染"');
    console.log('   - "🔍 adminSlice: 开始调用getStats API"');
    console.log('4. 查看Network标签页的API请求');
    console.log('5. 使用Cmd+Shift+R强制刷新');
    
    console.log('\n🚨 如果Console中没有我们的调试信息，说明：');
    console.log('1. 前端代码没有正确编译');
    console.log('2. 浏览器缓存问题');
    console.log('3. 需要重启前端服务');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testComponentLoading(); 