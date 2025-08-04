// 通过修改后的健康检查API执行数据库Schema修复
const https = require('https');

function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function fixDatabaseSchema() {
  console.log('🔧 通过健康检查API执行数据库Schema修复...');
  console.log('');

  try {
    // 1. 先测试健康检查API是否正常
    console.log('1️⃣ 测试健康检查API连接...');
    const healthResult = await makeRequest('https://zhixing-seven.vercel.app/api/health');
    
    console.log('健康检查状态:', healthResult.status);
    if (healthResult.status === 200 && healthResult.data.success) {
      console.log('✅ API连接正常');
      console.log('数据库状态:', healthResult.data.data.database.connected ? '✅ 已连接' : '❌ 连接失败');
    } else {
      console.log('⚠️  API连接异常，继续尝试修复...');
    }

    console.log('');

    // 2. 执行Schema修复
    console.log('2️⃣ 执行数据库Schema修复...');
    const fixResult = await makeRequest(
      'https://zhixing-seven.vercel.app/api/health',
      { action: 'fix_schema' }
    );
    
    console.log('修复结果状态:', fixResult.status);
    console.log('');
    
    if (fixResult.status === 200 && fixResult.data.success) {
      console.log('🎉 数据库Schema修复成功！');
      console.log('');
      
      const results = fixResult.data.data.results;
      console.log('📋 修复详情:');
      results.forEach((result, index) => {
        const statusEmoji = {
          'added': '✅ 已添加',
          'exists': 'ℹ️  已存在',
          'failed': '❌ 失败',
          'completed': '✅ 完成',
          'not_needed': 'ℹ️  无需处理',
          'table_not_exists': '⚠️  表不存在'
        };
        
        console.log(`  ${index + 1}. ${result.field}: ${statusEmoji[result.status] || result.status}`);
        if (result.error) {
          console.log(`     错误: ${result.error}`);
        }
        if (result.updated && result.updated.length > 0) {
          console.log(`     更新了 ${result.updated.length} 条记录`);
          result.updated.forEach(update => {
            console.log(`       - ${update.wechat_name}: ${update.sales_code || update.secondary_registration_code}`);
          });
        }
      });
      
      console.log('');
      console.log('📊 修复总结:');
      const summary = fixResult.data.data.summary;
      console.log('  - sales_code字段:', summary.sales_code_field);
      console.log('  - secondary_registration_code字段:', summary.secondary_registration_code_field);
      console.log('  - 可以正常使用:', summary.ready_for_use ? '✅ 是' : '❌ 否');
      console.log('');
      console.log('📋 数据库最终字段列表:');
      fixResult.data.data.final_columns.forEach((col, index) => {
        const isNew = ['sales_code', 'secondary_registration_code'].includes(col);
        console.log(`  ${index + 1}. ${isNew ? '🆕' : '  '} ${col}`);
      });
      
      if (summary.ready_for_use) {
        console.log('');
        console.log('🚀 数据库修复完成！现在可以正常使用以下功能:');
        console.log('  ✅ 用户购买页面订单创建');
        console.log('  ✅ 销售代码统一查找标准');
        console.log('  ✅ 7天免费套餐提交功能');
        console.log('  ✅ 二级销售注册流程');
        console.log('');
        console.log('🎯 建议立即测试购买页面:');
        console.log('  https://zhixing-seven.vercel.app/purchase?sales_code=22c878b96fd14f0f');
        console.log('');
        console.log('🧪 运行验证测试:');
        console.log('  node test-database-structure.js');
      }
      
    } else {
      console.log('❌ 数据库Schema修复失败');
      console.log('错误信息:', fixResult.data.message || '未知错误');
      if (fixResult.data.error) {
        console.log('错误详情:', fixResult.data.error);
      }
      
      console.log('');
      console.log('💡 可能的原因:');
      console.log('1. 数据库连接问题');
      console.log('2. 权限不足');
      console.log('3. 字段已存在但检测失败');
      console.log('4. PlanetScale不允许ALTER TABLE操作');
      console.log('');
      console.log('🔧 替代方案:');
      console.log('请手动在PlanetScale控制台执行以下SQL:');
      console.log('');
      console.log('ALTER TABLE primary_sales ADD COLUMN sales_code VARCHAR(16) UNIQUE COMMENT \'用户购买时使用的销售代码\';');
      console.log('ALTER TABLE primary_sales ADD COLUMN secondary_registration_code VARCHAR(16) UNIQUE COMMENT \'二级销售注册时使用的代码\';');
      console.log('ALTER TABLE secondary_sales ADD COLUMN sales_code VARCHAR(16) UNIQUE COMMENT \'用户购买时使用的销售代码\';');
    }

  } catch (error) {
    console.error('❌ Schema修复过程出错:', error.message);
    console.log('');
    console.log('💡 请检查:');
    console.log('1. 网络连接是否正常');
    console.log('2. Vercel API是否部署成功');
    console.log('3. 数据库环境变量是否配置正确');
  }
}

// 执行修复
fixDatabaseSchema();