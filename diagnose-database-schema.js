const axios = require('axios');

async function diagnoseDatabaseSchema() {
  console.log('🔍 诊断数据库表结构...');
  
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
    // 1. 检查销售表结构
    console.log('\n1️⃣ 检查销售表结构...');
    const salesResponse = await axios.get(`${baseURL}/admin?path=sales`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 销售表查询成功');
    const sales = salesResponse.data.data || salesResponse.data;
    
    if (sales && sales.length > 0) {
      const firstSales = sales[0];
      console.log('📊 第一个销售记录字段:');
      Object.keys(firstSales).forEach(key => {
        console.log(`  ${key}: ${firstSales[key]}`);
      });
      
      // 检查关键字段
      console.log('\n🔍 检查关键字段:');
      console.log(`  sales_type: ${firstSales.sales_type ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`  secondary_sales_count: ${firstSales.secondary_sales_count !== undefined ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`  primary_sales_name: ${firstSales.primary_sales_name !== undefined ? '✅ 存在' : '❌ 不存在'}`);
    }
    
    // 2. 检查统计API的详细错误
    console.log('\n2️⃣ 检查统计API详细错误...');
    try {
      const statsResponse = await axios.get(`${baseURL}/admin?path=stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ 统计API调用成功');
      const stats = statsResponse.data.data || statsResponse.data;
      console.log('📊 统计API返回字段:');
      Object.keys(stats).forEach(key => {
        console.log(`  ${key}: ${stats[key]}`);
      });
      
    } catch (error) {
      console.error('❌ 统计API调用失败:', error.response?.data || error.message);
    }
    
    // 3. 检查数据库连接
    console.log('\n3️⃣ 检查数据库连接...');
    try {
      const healthResponse = await axios.get(`${baseURL}/health`);
      console.log('✅ 数据库连接正常');
      console.log('📊 健康检查响应:', healthResponse.data);
    } catch (error) {
      console.error('❌ 数据库连接异常:', error.message);
    }
    
    console.log('\n🎯 诊断完成！');
    
  } catch (error) {
    console.error('❌ 诊断失败:', error.message);
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
  }
}

// 运行诊断
diagnoseDatabaseSchema()
  .then(() => {
    console.log('\n✅ 诊断完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 诊断失败');
    process.exit(1);
  }); 