const axios = require('axios');

async function testToken() {
  try {
    console.log('🔍 测试登录和token状态...\n');
    
    // 1. 测试登录
    console.log('1️⃣ 测试登录...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // 2. 测试token验证
    console.log('\n2️⃣ 测试token验证...');
    const verifyResponse = await axios.get('http://localhost:5000/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Token验证成功');
    
    // 3. 测试收款配置API（不需要认证）
    console.log('\n3️⃣ 测试收款配置获取...');
    const configResponse = await axios.get('http://localhost:5000/api/payment-config');
    console.log('✅ 收款配置获取成功');
    console.log('支付宝收款码状态:', configResponse.data.data.alipay_qr_code ? '已配置' : '未配置');
    
    // 4. 测试收款配置保存（需要认证）
    console.log('\n4️⃣ 测试收款配置保存...');
    const saveResponse = await axios.post('http://localhost:5000/api/payment-config', {
      alipay_account: '752304285@qq.com',
      alipay_surname: '梁',
      alipay_qr_code: null,
      crypto_chain_name: 'TRC10/TRC20',
      crypto_address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
      crypto_qr_code: null
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 收款配置保存成功');
    
    console.log('\n🎉 所有测试通过！');
    console.log('\n💡 建议：');
    console.log('1. 清除浏览器localStorage');
    console.log('2. 重新登录管理员界面');
    console.log('3. 配置支付宝收款码');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testToken(); 