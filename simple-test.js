const axios = require('axios');

async function simpleTest() {
  try {
    console.log('🔍 简单功能测试...\n');
    
    // 1. 测试收款配置
    console.log('1️⃣ 测试收款配置API...');
    const configResponse = await axios.get('http://localhost:5000/api/payment-config');
    console.log('✅ 收款配置正常');
    console.log('- 支付宝账号:', configResponse.data.data.alipay_account);
    console.log('- 收款码配置:', configResponse.data.data.alipay_qr_code ? '已配置' : '未配置');
    
    // 2. 测试管理员登录
    console.log('\n2️⃣ 测试管理员登录...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    console.log('✅ 管理员登录正常');
    
    // 3. 测试前端访问
    console.log('\n3️⃣ 测试前端访问...');
    try {
      const frontendResponse = await axios.get('http://localhost:3000');
      console.log('✅ 前端服务正常');
    } catch (error) {
      console.log('❌ 前端服务异常:', error.message);
    }
    
    console.log('\n🎉 基本功能测试完成！');
    console.log('\n📋 下一步操作：');
    console.log('1. 访问 http://localhost:3000/admin 配置支付宝收款码');
    console.log('2. 访问 http://localhost:3000 测试用户购买流程');
    console.log('3. 上传付款截图，然后在管理员页面查看');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

simpleTest(); 