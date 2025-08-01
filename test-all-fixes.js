const axios = require('axios');

async function testAllFixes() {
  console.log('🔍 测试所有修复...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  try {
    // 1. 测试健康检查
    console.log('\n🏥 测试健康检查...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ 健康检查通过');
    
    // 2. 测试数据库结构调整API
    console.log('\n🔧 测试数据库结构调整API...');
    const schemaResponse = await axios.post(`${baseURL}/admin`, {
      path: 'update-schema'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ 数据库结构调整成功');
    console.log('📊 创建的表:', schemaResponse.data.data.tables_created.length);
    console.log('📊 更新的表:', schemaResponse.data.data.tables_updated.length);
    console.log('📊 创建的视图:', schemaResponse.data.data.views_created.length);
    
    // 3. 测试管理员登录
    console.log('\n🔑 测试管理员登录...');
    const loginResponse = await axios.post(`${baseURL}/auth`, {
      path: 'login',
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    console.log('✅ 管理员登录成功');
    
    const adminToken = loginResponse.data.data.token;
    
    // 4. 测试销售层级API
    console.log('\n🔗 测试销售层级API...');
    const hierarchyResponse = await axios.get(`${baseURL}/sales-hierarchy?path=list`);
    console.log('✅ 销售层级API正常');
    console.log('📊 层级关系数:', hierarchyResponse.data.data.length);
    
    // 5. 测试订单API
    console.log('\n📋 测试订单API...');
    const ordersResponse = await axios.get(`${baseURL}/orders?path=list`);
    console.log('✅ 订单API正常');
    console.log('📊 订单数:', ordersResponse.data.data.orders.length);
    
    // 6. 测试订单佣金API
    console.log('\n💰 测试订单佣金API...');
    const commissionResponse = await axios.get(`${baseURL}/orders-commission?path=list`);
    console.log('✅ 订单佣金API正常');
    console.log('📊 佣金记录数:', commissionResponse.data.data.length);
    
    // 7. 测试销售API
    console.log('\n👥 测试销售API...');
    const salesResponse = await axios.get(`${baseURL}/sales?path=filter&sales_type=all`);
    console.log('✅ 销售API正常');
    console.log('📊 销售数:', salesResponse.data.data.length);
    
    // 8. 测试一级销售API
    console.log('\n👥 测试一级销售API...');
    const primaryResponse = await axios.get(`${baseURL}/primary-sales?path=list`);
    console.log('✅ 一级销售API正常');
    console.log('📊 一级销售数:', primaryResponse.data.data.length);
    
    // 9. 测试二级销售API
    console.log('\n👥 测试二级销售API...');
    const secondaryResponse = await axios.get(`${baseURL}/secondary-sales?path=list`);
    console.log('✅ 二级销售API正常');
    console.log('📊 二级销售数:', secondaryResponse.data.data.length);
    
    // 10. 测试管理员统计API
    console.log('\n📊 测试管理员统计API...');
    const statsResponse = await axios.get(`${baseURL}/admin?path=stats`);
    console.log('✅ 管理员统计API正常');
    console.log('📊 统计信息:', statsResponse.data.data);
    
    console.log('\n🎉 所有修复测试通过！');
    
    return {
      success: true,
      message: '所有修复验证成功'
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
    
    throw error;
  }
}

// 运行测试
testAllFixes()
  .then(result => {
    console.log('\n✅ 所有测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }); 