const axios = require('axios');

async function checkLoginResponse() {
  console.log('🔍 检查登录响应格式\n');
  
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    console.log('✅ 登录成功');
    console.log('完整响应:', JSON.stringify(loginResponse.data, null, 2));
    
    console.log('\n📋 响应结构分析：');
    console.log('响应类型:', typeof loginResponse.data);
    console.log('是否有token字段:', 'token' in loginResponse.data);
    console.log('是否有admin字段:', 'admin' in loginResponse.data);
    
    if (loginResponse.data.token) {
      console.log('Token长度:', loginResponse.data.token.length);
      console.log('Token前20字符:', loginResponse.data.token.substring(0, 20) + '...');
    }
    
    if (loginResponse.data.admin) {
      console.log('Admin用户名:', loginResponse.data.admin.username);
    }
    
    // 测试token验证
    if (loginResponse.data.token) {
      console.log('\n🔐 测试token验证...');
      try {
        const verifyResponse = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.token}`
          }
        });
        
        console.log('✅ Token验证成功');
        console.log('验证响应:', JSON.stringify(verifyResponse.data, null, 2));
        
      } catch (error) {
        console.log('❌ Token验证失败:', error.response?.data?.message || error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ 登录失败:', error.response?.data?.message || error.message);
    if (error.response) {
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkLoginResponse(); 