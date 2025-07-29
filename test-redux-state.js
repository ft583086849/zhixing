const axios = require('axios');

async function testReduxState() {
  console.log('🔍 测试Redux状态更新\n');
  
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
    console.log('API返回数据:', statsResponse.data);
    
    // 2. 检查数据结构
    const apiData = statsResponse.data.data;
    console.log('\n📊 API数据结构检查:');
    console.log('- total_orders:', apiData.total_orders);
    console.log('- pending_payment_orders:', apiData.pending_payment_orders);
    console.log('- pending_config_orders:', apiData.pending_config_orders);
    console.log('- confirmed_payment_orders:', apiData.confirmed_payment_orders);
    console.log('- confirmed_config_orders:', apiData.confirmed_config_orders);
    console.log('- total_amount:', apiData.total_amount);
    
    // 3. 检查前端服务
    console.log('\n2️⃣ 检查前端服务...');
    const frontendResponse = await axios.get('http://localhost:3000/');
    console.log('✅ 前端服务正常');
    
    console.log('\n🎉 测试完成！');
    console.log('\n📱 现在请在浏览器中：');
    console.log('1. 访问：http://localhost:3000/#/admin');
    console.log('2. 使用以下信息登录：');
    console.log('   用户名：知行');
    console.log('   密码：Zhixing Universal Trading Signal');
    console.log('3. 查看数据概览页面');
    
    console.log('\n📋 现在应该能看到：');
    console.log('1. 蓝色的调试信息框，显示：');
    console.log('   - loading: false');
    console.log('   - total_orders: 1');
    console.log('   - confirmed_config_orders: 1');
    console.log('   - total_amount: 0');
    console.log('2. "数据概览"标题');
    console.log('3. 统计数据卡片');
    
    console.log('\n🔧 如果调试信息框显示loading: true，说明：');
    console.log('1. API调用正在进行中');
    console.log('2. 等待几秒钟应该会变成false');
    
    console.log('\n🔧 如果调试信息框显示loading: false但数据为0，说明：');
    console.log('1. API调用失败');
    console.log('2. Redux状态没有正确更新');
    console.log('3. 检查Console中的错误信息');
    
    console.log('\n💡 调试建议：');
    console.log('1. 打开浏览器开发者工具 (F12)');
    console.log('2. 查看Console标签页的调试信息');
    console.log('3. 查看Network标签页的API请求');
    console.log('4. 使用Cmd+Shift+R强制刷新');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testReduxState(); 