const axios = require('axios');

async function testFourthStageComplete() {
  console.log('🎯 开始第四阶段完整功能测试...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  try {
    // 1. 测试数据库结构调整API
    console.log('\n🔧 测试数据库结构调整API...');
    const schemaResponse = await axios.post(`${baseURL}/update-sales-schema`, {}, {
      headers: {
        'Authorization': 'Bearer admin123',
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    console.log('✅ 数据库结构调整成功');
    console.log('📊 创建的表:', schemaResponse.data.data.tables_created.length);
    console.log('📊 更新的表:', schemaResponse.data.data.tables_updated.length);
    console.log('📊 创建的视图:', schemaResponse.data.data.views_created.length);
    
    // 2. 获取管理员token
    console.log('\n🔑 获取管理员JWT token...');
    const loginResponse = await axios.post(`${baseURL}/auth`, {
      path: 'login',
      username: '知行',
      password: '123456'
    });
    
    const adminToken = loginResponse.data.data.token;
    console.log('✅ 成功获取JWT token');
    
    // 3. 测试销售层级统计API
    console.log('\n📊 测试销售层级统计API...');
    const statsResponse = await axios.get(`${baseURL}/admin?path=stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 销售层级统计API调用成功');
    const stats = statsResponse.data.data;
    console.log('📊 层级统计结果:');
    console.log(`  - 一级销售数: ${stats.primary_sales_count}`);
    console.log(`  - 二级销售数: ${stats.secondary_sales_count}`);
    console.log(`  - 活跃层级关系: ${stats.active_hierarchies}`);
    
    // 4. 测试销售类型筛选API
    console.log('\n🔍 测试销售类型筛选API...');
    
    // 测试获取全部销售
    const allSalesResponse = await axios.get(`${baseURL}/sales?path=filter&sales_type=all`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 获取全部销售成功');
    console.log(`📊 销售总数: ${allSalesResponse.data.data?.length || 0}`);
    
    // 测试获取一级销售
    const primarySalesResponse = await axios.get(`${baseURL}/sales?path=filter&sales_type=primary`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 获取一级销售成功');
    console.log(`📊 一级销售数: ${primarySalesResponse.data.data?.length || 0}`);
    
    // 测试获取二级销售
    const secondarySalesResponse = await axios.get(`${baseURL}/sales?path=filter&sales_type=secondary`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 获取二级销售成功');
    console.log(`📊 二级销售数: ${secondarySalesResponse.data.data?.length || 0}`);
    
    // 5. 测试一级销售API
    console.log('\n👥 测试一级销售API...');
    const primarySalesAPIResponse = await axios.get(`${baseURL}/primary-sales?path=list`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 一级销售API调用成功');
    console.log(`📊 一级销售数: ${primarySalesAPIResponse.data.data?.length || 0}`);
    
    // 6. 测试二级销售API
    console.log('\n👥 测试二级销售API...');
    const secondarySalesAPIResponse = await axios.get(`${baseURL}/secondary-sales?path=list`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 二级销售API调用成功');
    console.log(`📊 二级销售数: ${secondarySalesAPIResponse.data.data?.length || 0}`);
    
    // 7. 测试销售层级API
    console.log('\n🔗 测试销售层级API...');
    const hierarchyResponse = await axios.get(`${baseURL}/sales-hierarchy?path=list`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 销售层级API调用成功');
    console.log(`📊 层级关系数: ${hierarchyResponse.data.data?.length || 0}`);
    
    // 8. 测试订单佣金API
    console.log('\n💰 测试订单佣金API...');
    const commissionResponse = await axios.get(`${baseURL}/orders-commission?path=list`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 订单佣金API调用成功');
    console.log(`📊 佣金记录数: ${commissionResponse.data.data?.length || 0}`);
    
    // 9. 最终验证
    console.log('\n🎯 第四阶段功能验证结果:');
    console.log('✅ 数据库结构调整: 完成');
    console.log('✅ 销售层级统计: 完成');
    console.log('✅ 销售类型筛选: 完成');
    console.log('✅ 一级销售管理: 完成');
    console.log('✅ 二级销售管理: 完成');
    console.log('✅ 销售层级关系: 完成');
    console.log('✅ 订单佣金系统: 完成');
    
    console.log('\n🎉 第四阶段所有功能测试通过！');
    console.log('📋 准备提交部署...');
    
    return {
      success: true,
      message: '第四阶段所有功能测试通过'
    };
    
  } catch (error) {
    console.error('❌ 第四阶段功能测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
    
    throw error;
  }
}

// 运行测试
testFourthStageComplete()
  .then(result => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }); 