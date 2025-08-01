const axios = require('axios');

async function testOrdersStructure() {
  console.log('🔍 检查orders表结构...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  try {
    // 测试基本的orders查询
    const response = await axios.get(`${baseURL}/orders?path=list`);
    
    console.log('✅ orders表查询成功');
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ orders表查询失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
  }
}

testOrdersStructure(); 