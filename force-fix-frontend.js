const axios = require('axios');

async function forceFixFrontend() {
  try {
    console.log('🔧 强制修复前端token问题...\n');
    
    // 1. 获取新的有效token
    console.log('1️⃣ 获取新的有效token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 获取新token成功');
    
    // 2. 验证token
    console.log('\n2️⃣ 验证token...');
    const verifyResponse = await axios.get('http://localhost:5000/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Token验证成功');
    
    // 3. 测试管理员API
    console.log('\n3️⃣ 测试管理员API...');
    const adminResponse = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 管理员API测试成功');
    
    // 4. 测试收款配置保存
    console.log('\n4️⃣ 测试收款配置保存...');
    const configResponse = await axios.post('http://localhost:5000/api/payment-config', {
      alipay_account: '752304285@qq.com',
      alipay_surname: '梁',
      alipay_qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      crypto_chain_name: 'TRC10/TRC20',
      crypto_address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
      crypto_qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 收款配置保存成功');
    
    console.log('\n🎉 后端API完全正常！');
    console.log('\n🔍 问题分析：');
    console.log('- 后端API工作正常');
    console.log('- Token生成和验证正常');
    console.log('- 问题在前端token处理逻辑');
    
    console.log('\n💡 解决方案：');
    console.log('1. 完全清除浏览器数据：');
    console.log('   - 按 Ctrl+Shift+Delete (Windows) 或 Cmd+Shift+Delete (Mac)');
    console.log('   - 选择"所有时间"');
    console.log('   - 勾选"Cookie及其他网站数据"、"缓存的图片和文件"');
    console.log('   - 点击"清除数据"');
    
    console.log('\n2. 或者使用无痕模式：');
    console.log('   - 按 Ctrl+Shift+N (Windows) 或 Cmd+Shift+N (Mac)');
    console.log('   - 访问 http://localhost:3000/admin');
    console.log('   - 重新登录');
    
    console.log('\n3. 或者重启前端服务：');
    console.log('   - 停止前端服务 (Ctrl+C)');
    console.log('   - 重新启动: cd client && npm start');
    
    console.log('\n📋 登录信息：');
    console.log('用户名：知行');
    console.log('密码：Zhixing Universal Trading Signal');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

forceFixFrontend(); 