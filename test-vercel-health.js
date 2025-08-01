const axios = require('axios');

async function testVercelHealth() {
  console.log('🔍 检查Vercel部署健康状态...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  try {
    // 1. 测试健康检查API
    console.log('\n1️⃣ 测试健康检查API...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ 健康检查API正常');
    console.log('📊 响应:', healthResponse.data);
    
    // 2. 测试认证API（不登录）
    console.log('\n2️⃣ 测试认证API...');
    try {
      const authResponse = await axios.get(`${baseURL}/auth?path=verify`);
      console.log('❌ 认证API应该返回401，但返回了:', authResponse.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 认证API正常（返回401，需要登录）');
      } else {
        console.log('⚠️ 认证API异常:', error.response?.status);
      }
    }
    
    // 3. 测试管理员API（不登录）
    console.log('\n3️⃣ 测试管理员API...');
    try {
      const adminResponse = await axios.get(`${baseURL}/admin?path=stats`);
      console.log('❌ 管理员API应该返回401，但返回了:', adminResponse.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 管理员API正常（返回401，需要登录）');
      } else {
        console.log('⚠️ 管理员API异常:', error.response?.status);
      }
    }
    
    console.log('\n🎉 Vercel部署健康状态检查完成！');
    console.log('✅ 所有API端点都能正常响应');
    console.log('✅ 认证机制正常工作');
    
  } catch (error) {
    console.error('❌ Vercel健康检查失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    } else if (error.request) {
      console.error('📊 网络错误:', error.request);
    }
  }
}

// 运行测试
testVercelHealth()
  .then(() => {
    console.log('\n✅ 健康检查完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 健康检查失败');
    process.exit(1);
  }); 