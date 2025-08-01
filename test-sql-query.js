const axios = require('axios');

async function testSQLQuery() {
  console.log('🔍 测试SQL查询...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  // 先获取token
  console.log('🔑 获取管理员token...');
  const loginResponse = await axios.post(`${baseURL}/auth?path=login`, {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  });
  
  const token = loginResponse.data.data.token;
  console.log('✅ 获取token成功');
  
  try {
    // 测试最简单的统计查询
    console.log('\n1️⃣ 测试最简单的统计查询...');
    
    // 先测试健康检查
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ 健康检查正常');
    
    // 测试认证
    const authResponse = await axios.get(`${baseURL}/auth?path=verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ 认证正常');
    
    // 测试最简单的管理员API
    console.log('\n2️⃣ 测试管理员API...');
    try {
      const adminResponse = await axios.get(`${baseURL}/admin?path=stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ 管理员API正常');
      console.log('📊 响应:', JSON.stringify(adminResponse.data, null, 2));
    } catch (error) {
      console.error('❌ 管理员API失败:', error.response?.data || error.message);
      
      // 尝试获取更详细的错误信息
      if (error.response?.data?.error) {
        console.error('📊 详细错误:', error.response.data.error);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
  }
}

// 运行测试
testSQLQuery()
  .then(() => {
    console.log('\n✅ SQL查询测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ SQL查询测试失败');
    process.exit(1);
  }); 