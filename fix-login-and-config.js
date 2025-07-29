const axios = require('axios');

async function fixLoginAndConfig() {
  try {
    console.log('🔧 开始修复登录和配置问题...\n');
    
    // 1. 测试服务器连接
    console.log('1️⃣ 测试服务器连接...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ 服务器连接正常');
    
    // 2. 登录获取新token
    console.log('\n2️⃣ 重新登录获取新token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取新token');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // 3. 验证token
    console.log('\n3️⃣ 验证token有效性...');
    const verifyResponse = await axios.get('http://localhost:5000/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Token验证成功');
    
    // 4. 获取当前配置
    console.log('\n4️⃣ 获取当前收款配置...');
    const currentConfig = await axios.get('http://localhost:5000/api/payment-config');
    console.log('✅ 当前配置获取成功');
    console.log('支付宝收款码状态:', currentConfig.data.data.alipay_qr_code ? '已配置' : '未配置');
    
    // 5. 创建一个测试收款码（base64格式的简单图片）
    console.log('\n5️⃣ 创建测试收款码...');
    const testQRCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // 6. 更新收款配置
    console.log('\n6️⃣ 更新收款配置...');
    const updateResponse = await axios.post('http://localhost:5000/api/payment-config', {
      alipay_account: '752304285@qq.com',
      alipay_surname: '梁',
      alipay_qr_code: testQRCode,  // 添加测试收款码
      crypto_chain_name: 'TRC10/TRC20',
      crypto_address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
      crypto_qr_code: testQRCode   // 添加测试收款码
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 收款配置更新成功');
    
    // 7. 验证配置更新
    console.log('\n7️⃣ 验证配置更新...');
    const newConfig = await axios.get('http://localhost:5000/api/payment-config');
    console.log('✅ 配置验证成功');
    console.log('支付宝收款码状态:', newConfig.data.data.alipay_qr_code ? '已配置' : '未配置');
    
    // 8. 创建测试销售链接
    console.log('\n8️⃣ 创建测试销售链接...');
    const salesResponse = await axios.post('http://localhost:5000/api/sales/create', {
      wechat_name: '测试销售',
      payment_method: 'alipay',
      payment_address: '752304285@qq.com',
      alipay_surname: '梁'
    });
    console.log('✅ 测试销售链接创建成功');
    console.log('链接代码:', salesResponse.data.data.link_code);
    console.log('完整链接:', salesResponse.data.data.full_link);
    
    console.log('\n🎉 所有问题修复完成！');
    console.log('\n📋 下一步操作：');
    console.log('1. 访问管理员界面：http://localhost:3000/admin');
    console.log('2. 使用以下信息登录：');
    console.log('   用户名：知行');
    console.log('   密码：Zhixing Universal Trading Signal');
    console.log('3. 测试用户购买页面：', salesResponse.data.data.full_link);
    console.log('\n💡 提示：');
    console.log('- 收款码已配置为测试图片');
    console.log('- 如需真实收款码，请在管理员界面重新上传');
    console.log('- 测试销售链接已创建，可用于测试用户购买流程');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.response?.data || error.message);
    console.log('\n🔍 可能的原因：');
    console.log('1. 服务器未启动，请先运行: cd server && node index.js');
    console.log('2. 端口被占用，请检查端口5000是否可用');
    console.log('3. 数据库连接问题，请检查数据库配置');
  }
}

// 运行修复脚本
fixLoginAndConfig(); 