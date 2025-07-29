const axios = require('axios');

async function clearBrowserCacheAndTest() {
  console.log('🧹 浏览器缓存清理和完整流程测试指南\n');
  
  console.log('📋 第一步：清除浏览器缓存');
  console.log('1. 打开浏览器开发者工具 (F12 或 右键 → 检查)');
  console.log('2. 进入 Application 标签页');
  console.log('3. 在左侧找到 Local Storage');
  console.log('4. 右键点击 http://localhost:3000');
  console.log('5. 选择 "Clear" 清除所有数据');
  console.log('6. 同样清除 http://localhost:5000 的数据');
  console.log('7. 关闭开发者工具\n');
  
  console.log('📋 第二步：测试管理员登录');
  console.log('1. 访问：http://localhost:3000/admin');
  console.log('2. 输入登录信息：');
  console.log('   用户名：知行');
  console.log('   密码：Zhixing Universal Trading Signal');
  console.log('3. 点击登录\n');
  
  console.log('📋 第三步：测试用户购买流程');
  console.log('1. 访问测试链接：http://localhost:3000/purchase/c97f8695988d4495');
  console.log('2. 选择购买时长（如：1个月）');
  console.log('3. 选择付款方式（支付宝）');
  console.log('4. 填写用户信息');
  console.log('5. 上传付款截图');
  console.log('6. 提交订单\n');
  
  console.log('📋 第四步：验证管理员后台');
  console.log('1. 在管理员后台查看新订单');
  console.log('2. 确认订单信息正确');
  console.log('3. 查看付款截图是否显示');
  console.log('4. 测试订单状态更新\n');
  
  console.log('🔍 现在开始API测试验证...\n');
  
  try {
    // 测试服务器状态
    console.log('1️⃣ 测试服务器状态...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ 服务器运行正常');
    
    // 测试管理员登录
    console.log('\n2️⃣ 测试管理员登录...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    console.log('✅ 管理员登录成功');
    
    const token = loginResponse.data.data.token;
    
    // 测试收款配置
    console.log('\n3️⃣ 测试收款配置...');
    const configResponse = await axios.get('http://localhost:5000/api/payment-config');
    console.log('✅ 收款配置正常');
    console.log('支付宝收款码：', configResponse.data.data.alipay_qr_code ? '已配置' : '未配置');
    
    // 测试销售链接
    console.log('\n4️⃣ 测试销售链接...');
    const salesResponse = await axios.get('http://localhost:5000/api/sales/link/c97f8695988d4495');
    console.log('✅ 销售链接正常');
    console.log('销售微信：', salesResponse.data.data.wechat_name);
    
    // 测试管理员统计
    console.log('\n5️⃣ 测试管理员统计...');
    const statsResponse = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ 管理员统计正常');
    console.log('总订单数：', statsResponse.data.data.totalOrders);
    
    console.log('\n🎉 所有API测试通过！');
    console.log('\n📱 现在可以开始浏览器测试了：');
    console.log('1. 清除浏览器缓存（按上面的步骤）');
    console.log('2. 访问管理员界面：http://localhost:3000/admin');
    console.log('3. 测试用户购买：http://localhost:3000/purchase/c97f8695988d4495');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
    console.log('\n🔧 解决方案：');
    console.log('1. 确保服务器正在运行：cd server && npm start');
    console.log('2. 确保前端正在运行：cd client && npm start');
    console.log('3. 检查端口5000和3000是否被占用');
  }
}

clearBrowserCacheAndTest(); 