// 通过专用API执行数据库Schema修复
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

async function executeSchemaFix() {
  console.log('🔧 开始数据库Schema修复...');
  console.log('');

  try {
    // 1. 先检查当前schema状态
    console.log('1️⃣ 检查当前数据库schema状态...');
    const checkResult = await makeRequest(
      'https://zhixing-seven.vercel.app/api/database-schema',
      { action: 'check_schema' }
    );
    
    console.log('检查结果状态:', checkResult.status);
    if (checkResult.status === 200 && checkResult.data.success) {
      const schemaData = checkResult.data.data;
      console.log('📋 Primary Sales现有字段:', schemaData.primary_sales.existing_columns.join(', '));
      console.log('🔍 需要添加的字段:');
      console.log('  - sales_code:', schemaData.primary_sales.needs_fields.sales_code ? '❌ 缺失' : '✅ 存在');
      console.log('  - secondary_registration_code:', schemaData.primary_sales.needs_fields.secondary_registration_code ? '❌ 缺失' : '✅ 存在');
      
      if (!schemaData.ready_for_fix) {
        console.log('✅ 所有字段都已存在，无需修复');
        return;
      }
    } else {
      console.log('⚠️  无法检查schema状态，继续执行修复...');
    }

    console.log('');

    // 2. 执行字段添加
    console.log('2️⃣ 执行数据库字段添加...');
    const fixResult = await makeRequest(
      'https://zhixing-seven.vercel.app/api/database-schema',
      { action: 'add_sales_code_fields' }
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
        }
      });
      
      console.log('');
      console.log('📊 修复总结:');
      const summary = fixResult.data.data.summary;
      console.log('  - sales_code字段:', summary.sales_code_added);
      console.log('  - secondary_registration_code字段:', summary.secondary_registration_code_added);
      console.log('  - 可以正常使用:', summary.ready_for_use ? '✅ 是' : '❌ 否');
      
      if (summary.ready_for_use) {
        console.log('');
        console.log('🚀 现在可以正常使用以下功能:');
        console.log('  ✅ 用户购买页面订单创建');
        console.log('  ✅ 销售代码统一查找标准');
        console.log('  ✅ 7天免费套餐提交功能');
        console.log('  ✅ 二级销售注册流程');
        console.log('');
        console.log('🎯 建议立即测试购买页面:');
        console.log('  https://zhixing-seven.vercel.app/purchase?sales_code=22c878b96fd14f0f');
      }
      
    } else {
      console.log('❌ 数据库Schema修复失败');
      console.log('错误信息:', fixResult.data.message || '未知错误');
      if (fixResult.data.error) {
        console.log('错误详情:', fixResult.data.error);
      }
      
      console.log('');
      console.log('💡 替代方案:');
      console.log('请手动在PlanetScale控制台执行以下SQL:');
      console.log('');
      console.log('ALTER TABLE primary_sales ADD COLUMN sales_code VARCHAR(16) UNIQUE COMMENT \'用户购买时使用的销售代码\';');
      console.log('ALTER TABLE primary_sales ADD COLUMN secondary_registration_code VARCHAR(16) UNIQUE COMMENT \'二级销售注册时使用的代码\';');
      console.log('ALTER TABLE secondary_sales ADD COLUMN sales_code VARCHAR(16) UNIQUE COMMENT \'用户购买时使用的销售代码\';');
    }

  } catch (error) {
    console.error('❌ Schema修复过程出错:', error.message);
    console.log('');
    console.log('💡 请检查网络连接或稍后重试');
  }
}

// 执行修复
executeSchemaFix();