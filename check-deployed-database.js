const axios = require('axios');

const baseURL = 'https://zhixing-seven.vercel.app/api';

async function checkDeployedDatabase() {
  console.log('🔍 通过部署的API检查数据库表结构...');
  
  try {
    // 1. 先测试健康检查
    console.log('\n1. 测试健康检查...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ 健康检查通过:', healthResponse.data.message);
    
    // 2. 测试管理员登录获取token
    console.log('\n2. 获取管理员token...');
    const authResponse = await axios.post(`${baseURL}/auth?path=login`, {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    if (!authResponse.data.success) {
      console.log('❌ 管理员登录失败:', authResponse.data.message);
      return;
    }
    
    const token = authResponse.data.data.token;
    console.log('✅ 管理员登录成功');
    
    // 3. 测试一级销售列表API
    console.log('\n3. 测试一级销售列表API...');
    try {
      const primarySalesResponse = await axios.get(`${baseURL}/primary-sales?path=list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ 一级销售列表API正常');
      console.log('   数据:', primarySalesResponse.data);
    } catch (error) {
      console.log('❌ 一级销售列表API失败:', error.response?.data || error.message);
    }
    
    // 4. 测试销售层级统计API
    console.log('\n4. 测试销售层级统计API...');
    try {
      const hierarchyResponse = await axios.get(`${baseURL}/sales-hierarchy?path=stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ 销售层级统计API正常');
      console.log('   数据:', hierarchyResponse.data);
    } catch (error) {
      console.log('❌ 销售层级统计API失败:', error.response?.data || error.message);
    }
    
    // 5. 测试管理员统计API（这个应该工作正常）
    console.log('\n5. 测试管理员统计API...');
    try {
      const adminResponse = await axios.get(`${baseURL}/admin?path=stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ 管理员统计API正常');
      console.log('   数据:', adminResponse.data);
    } catch (error) {
      console.log('❌ 管理员统计API失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ 检查失败:', error.message);
  }
}

checkDeployedDatabase(); 