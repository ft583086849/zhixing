const axios = require('axios');

async function testBrowserAccess() {
  console.log('🌐 浏览器访问测试和问题诊断\n');
  
  try {
    // 测试前端服务
    console.log('1️⃣ 测试前端服务...');
    const frontendResponse = await axios.get('http://localhost:3000', { timeout: 5000 });
    console.log('✅ 前端服务正常响应');
    console.log('状态码:', frontendResponse.status);
    
    // 测试后端API
    console.log('\n2️⃣ 测试后端API...');
    const backendResponse = await axios.get('http://localhost:5000/api/health', { timeout: 5000 });
    console.log('✅ 后端API正常响应');
    console.log('状态码:', backendResponse.status);
    
    // 测试管理员登录页面
    console.log('\n3️⃣ 测试管理员登录页面...');
    const adminResponse = await axios.get('http://localhost:3000/admin', { timeout: 5000 });
    console.log('✅ 管理员页面正常响应');
    console.log('状态码:', adminResponse.status);
    
    // 测试用户购买页面
    console.log('\n4️⃣ 测试用户购买页面...');
    const purchaseResponse = await axios.get('http://localhost:3000/purchase/c97f8695988d4495', { timeout: 5000 });
    console.log('✅ 用户购买页面正常响应');
    console.log('状态码:', purchaseResponse.status);
    
    console.log('\n🎉 所有服务测试通过！');
    console.log('\n🔍 如果浏览器仍然转圈，可能的原因和解决方案：');
    console.log('\n📋 问题1：浏览器缓存问题');
    console.log('解决方案：');
    console.log('1. 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 强制刷新');
    console.log('2. 或者清除浏览器缓存：');
    console.log('   - 打开开发者工具 (F12)');
    console.log('   - 右键刷新按钮 → "清空缓存并硬性重新加载"');
    console.log('   - 或者进入 Application → Local Storage → 清除所有数据');
    
    console.log('\n📋 问题2：JavaScript错误');
    console.log('解决方案：');
    console.log('1. 打开开发者工具 (F12)');
    console.log('2. 查看 Console 标签页是否有错误信息');
    console.log('3. 如果有错误，请截图记录错误信息');
    
    console.log('\n📋 问题3：网络连接问题');
    console.log('解决方案：');
    console.log('1. 检查防火墙设置');
    console.log('2. 尝试使用不同的浏览器');
    console.log('3. 检查是否有代理设置影响');
    
    console.log('\n📋 问题4：端口冲突');
    console.log('解决方案：');
    console.log('1. 检查端口3000和5000是否被其他程序占用');
    console.log('2. 重启前端和后端服务');
    console.log('3. 使用以下命令重启：');
    console.log('   cd server && npm start');
    console.log('   cd client && npm start');
    
    console.log('\n📋 推荐的测试步骤：');
    console.log('1. 强制刷新浏览器 (Ctrl+Shift+R)');
    console.log('2. 访问：http://localhost:3000/admin');
    console.log('3. 如果还是转圈，打开开发者工具查看错误');
    console.log('4. 尝试使用无痕模式访问');
    console.log('5. 尝试使用不同的浏览器');
    
    console.log('\n📱 测试链接：');
    console.log('- 管理员登录：http://localhost:3000/admin');
    console.log('- 用户购买：http://localhost:3000/purchase/c97f8695988d4495');
    console.log('- 销售页面：http://localhost:3000/sales');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 连接被拒绝，可能的原因：');
      console.log('1. 服务未启动');
      console.log('2. 端口被占用');
      console.log('3. 防火墙阻止');
      
      console.log('\n📋 解决步骤：');
      console.log('1. 检查服务状态：');
      console.log('   ps aux | grep node');
      console.log('2. 重启服务：');
      console.log('   cd server && npm start');
      console.log('   cd client && npm start');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n⏰ 请求超时，可能的原因：');
      console.log('1. 服务响应慢');
      console.log('2. 网络问题');
      console.log('3. 资源加载问题');
    }
  }
}

testBrowserAccess(); 