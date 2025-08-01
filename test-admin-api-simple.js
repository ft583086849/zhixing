const axios = require('axios');

async function testAdminAPI() {
  console.log('🔍 开始测试管理员API...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  try {
    // 测试管理员统计API
    console.log('\n📊 测试管理员统计API...');
    const response = await axios.get(`${baseURL}/admin?path=stats`, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ 管理员API调用成功');
    console.log('📊 响应状态:', response.status);
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.error('❌ 管理员API调用失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
    
    throw error;
  }
}

// 运行测试
testAdminAPI()
  .then(result => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }); 