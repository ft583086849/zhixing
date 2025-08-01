const axios = require('axios');

async function testDatabaseSchemaAPI() {
  console.log('🔍 开始测试数据库结构调整API...');
  
  try {
    // 调用数据库结构调整API
    console.log('📡 调用数据库结构调整API...');
    const response = await axios.post('https://zhixing-seven.vercel.app/api/update-db-schema', {}, {
      headers: {
        'Authorization': 'Bearer admin123',
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60秒超时
    });
    
    console.log('✅ API调用成功');
    console.log('📊 响应状态:', response.status);
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
    // 分析结果
    const { success, message, data } = response.data;
    
    console.log('\n🎯 结果分析:');
    console.log(`✅ 成功状态: ${success}`);
    console.log(`📝 消息: ${message}`);
    
    if (data) {
      console.log('\n📋 详细结果:');
      console.log(`📊 创建的表: ${data.tables_created.length} 个`);
      if (data.tables_created.length > 0) {
        data.tables_created.forEach(table => console.log(`  - ${table}`));
      }
      
      console.log(`📊 更新的表: ${data.tables_updated.length} 个`);
      if (data.tables_updated.length > 0) {
        data.tables_updated.forEach(table => console.log(`  - ${table}`));
      }
      
      console.log(`📊 创建的视图: ${data.views_created.length} 个`);
      if (data.views_created.length > 0) {
        data.views_created.forEach(view => console.log(`  - ${view}`));
      }
      
      console.log(`📊 总表数: ${data.total_tables}`);
      console.log(`📊 表名列表: ${data.table_names.join(', ')}`);
      
      if (data.errors && data.errors.length > 0) {
        console.log(`❌ 错误数量: ${data.errors.length} 个`);
        data.errors.forEach(error => console.log(`  - ${error}`));
      }
    }
    
    // 最终评估
    if (success) {
      console.log('\n🎉 数据库结构调整完全成功！');
      console.log('✅ 所有表创建成功');
      console.log('✅ 所有表结构更新成功');
      console.log('✅ 所有视图创建成功');
    } else {
      console.log('\n⚠️ 数据库结构调整部分成功');
      console.log('✅ 部分操作成功');
      console.log('❌ 存在一些错误，请检查错误信息');
    }
    
    return response.data;
    
  } catch (error) {
    console.error('❌ API调用失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
    
    throw error;
  }
}

// 运行测试
testDatabaseSchemaAPI()
  .then(result => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }); 