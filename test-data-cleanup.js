const axios = require('axios');

async function testDataCleanup() {
  console.log('🧹 测试数据库数据清理功能...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  try {
    // 1. 清理前检查数据状态
    console.log('\n📊 清理前数据状态检查...');
    
    const statsBefore = await axios.get(`${baseURL}/admin?path=stats`);
    console.log('✅ 清理前统计信息:');
    console.log(`  - 总订单数: ${statsBefore.data.data.total_orders}`);
    console.log(`  - 一级销售数: ${statsBefore.data.data.primary_sales_count}`);
    console.log(`  - 二级销售数: ${statsBefore.data.data.secondary_sales_count}`);
    
    // 2. 执行数据清理
    console.log('\n🧹 执行数据清理...');
    
    const cleanupResponse = await axios.post(`${baseURL}/data-cleanup`, {}, {
      headers: {
        'Authorization': 'Bearer admin123',
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    console.log('✅ 数据清理成功');
    console.log('📊 清理结果:');
    console.log(`  - 清理的表: ${cleanupResponse.data.data.tables_cleaned.length} 个`);
    cleanupResponse.data.data.tables_cleaned.forEach(table => {
      console.log(`    - ${table}`);
    });
    
    console.log('📊 删除的记录数:');
    Object.entries(cleanupResponse.data.data.records_deleted).forEach(([table, count]) => {
      console.log(`  - ${table}: ${count} 条`);
    });
    
    if (cleanupResponse.data.data.errors.length > 0) {
      console.log('⚠️ 清理过程中的错误:');
      cleanupResponse.data.data.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    // 3. 清理后验证
    console.log('\n📊 清理后数据状态检查...');
    
    const statsAfter = await axios.get(`${baseURL}/admin?path=stats`);
    console.log('✅ 清理后统计信息:');
    console.log(`  - 总订单数: ${statsAfter.data.data.total_orders}`);
    console.log(`  - 一级销售数: ${statsAfter.data.data.primary_sales_count}`);
    console.log(`  - 二级销售数: ${statsAfter.data.data.secondary_sales_count}`);
    
    // 4. 验证清理结果
    console.log('\n🎯 验证清理结果:');
    
    const verification = cleanupResponse.data.data.verification;
    console.log('📊 各表记录数:');
    verification.forEach(table => {
      console.log(`  - ${table.table_name}: ${table.row_count} 条记录`);
    });
    
    // 5. 检查是否所有表都为空
    const allEmpty = verification.every(table => table.row_count === 0);
    if (allEmpty) {
      console.log('✅ 所有表都已清空，数据清理完全成功！');
    } else {
      console.log('⚠️ 部分表可能还有数据，请检查清理结果');
    }
    
    console.log('\n🎉 数据清理功能测试完成');
    
    return {
      success: true,
      message: '数据清理功能测试成功',
      data: {
        before: statsBefore.data.data,
        after: statsAfter.data.data,
        cleanup: cleanupResponse.data.data
      }
    };
    
  } catch (error) {
    console.error('❌ 数据清理功能测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
    
    throw error;
  }
}

// 运行测试
testDataCleanup()
  .then(result => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }); 