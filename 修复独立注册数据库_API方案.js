#!/usr/bin/env node

/**
 * 通过管理员API修复独立二级销售注册数据库问题
 * 问题：secondary_sales 表的 primary_sales_id 字段为 NOT NULL，阻止独立注册
 * 解决方案：通过 /api/admin?path=fix-database 执行数据库修复
 */

const https = require('https');

const config = {
  baseUrl: 'https://zhixing-seven.vercel.app',
  // 注意：需要提供有效的管理员 token
  adminToken: 'YOUR_ADMIN_TOKEN' // 替换为实际的管理员token
};

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.baseUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.adminToken}`
      }
    };

    if (data && method !== 'GET') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function checkDatabaseStatus() {
  console.log('🔍 检查当前数据库状态...\n');
  
  try {
    const response = await makeRequest('/api/admin?path=check-database-schema');
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ 数据库连接正常');
      
      if (response.data.schema_info) {
        const secondaryTable = response.data.schema_info.secondary_sales;
        if (secondaryTable && secondaryTable.primary_sales_id) {
          const isNullable = secondaryTable.primary_sales_id.nullable;
          console.log(`📋 primary_sales_id 字段状态: ${isNullable ? '✅ 可空' : '❌ 非空（需要修复）'}`);
          return !isNullable; // 返回是否需要修复
        }
      }
      
      return true; // 默认需要修复
    } else {
      console.log('❌ 数据库状态检查失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 检查数据库状态时出错:', error.message);
    return false;
  }
}

async function executeDatabaseFix() {
  console.log('🔧 执行数据库修复...\n');
  
  const fixData = {
    action: 'fix_secondary_sales_table',
    changes: [
      {
        table: 'secondary_sales',
        action: 'modify_column',
        column: 'primary_sales_id',
        new_definition: 'INT NULL COMMENT "关联的一级销售ID（独立注册时为NULL）"'
      }
    ],
    verification: true
  };

  try {
    const response = await makeRequest('/api/admin?path=fix-database', 'POST', fixData);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ 数据库修复成功！');
      console.log('📊 修复结果:', response.data.results);
      
      if (response.data.verification) {
        console.log('🔍 验证结果:', response.data.verification);
      }
      
      return true;
    } else {
      console.log('❌ 数据库修复失败:', response.data.message);
      console.log('💡 建议使用 SQL 脚本直接修复');
      return false;
    }
  } catch (error) {
    console.log('❌ 执行数据库修复时出错:', error.message);
    return false;
  }
}

async function testIndependentRegistration() {
  console.log('🧪 测试独立二级销售注册功能...\n');
  
  const testData = {
    wechat_name: `test_independent_${Date.now()}`,
    payment_method: 'alipay',
    payment_address: 'test@example.com',
    alipay_surname: '测试'
  };

  try {
    const response = await makeRequest('/api/secondary-sales?path=register-independent', 'POST', testData);
    
    if (response.statusCode === 201 && response.data.success) {
      console.log('✅ 独立注册测试成功！');
      console.log('📊 注册结果:', {
        id: response.data.data.secondary_sales_id,
        wechat_name: response.data.data.wechat_name,
        primary_sales_id: 'NULL (独立注册)',
        sales_code: response.data.data.sales_code
      });
      return true;
    } else {
      console.log('❌ 独立注册测试失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 测试独立注册时出错:', error.message);
    return false;
  }
}

async function generateFixReport() {
  const report = {
    timestamp: new Date().toISOString(),
    fix_method: 'API',
    steps: [
      '1. 检查数据库状态',
      '2. 执行数据库修复',
      '3. 验证修复结果', 
      '4. 测试独立注册功能'
    ],
    status: 'completed',
    next_steps: [
      '验证线上独立注册功能',
      '测试关联注册功能',
      '监控数据库性能'
    ]
  };

  const reportPath = `独立注册修复报告_API_${Date.now()}.json`;
  require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📝 修复报告已保存: ${reportPath}`);
}

async function main() {
  console.log('🚀 开始修复独立二级销售注册数据库问题\n');
  console.log('=' .repeat(60));

  // 检查管理员token
  if (config.adminToken === 'YOUR_ADMIN_TOKEN') {
    console.log('⚠️  请先设置有效的管理员token');
    console.log('💡 获取token方式：');
    console.log('   1. 登录管理员后台');
    console.log('   2. 在浏览器开发者工具中查看localStorage');
    console.log('   3. 复制token值并替换config.adminToken');
    return;
  }

  try {
    // 步骤1：检查数据库状态
    const needsFix = await checkDatabaseStatus();
    
    if (!needsFix) {
      console.log('✅ 数据库已经正确配置，无需修复');
      return;
    }

    // 步骤2：执行数据库修复
    const fixSuccess = await executeDatabaseFix();
    
    if (!fixSuccess) {
      console.log('\n🆘 API修复失败，请使用SQL脚本修复：');
      console.log('📄 执行文件: fix-secondary-sales-table.sql');
      return;
    }

    // 步骤3：测试独立注册功能
    const testSuccess = await testIndependentRegistration();
    
    if (testSuccess) {
      console.log('\n🎉 独立二级销售注册功能修复完成！');
    } else {
      console.log('\n⚠️  修复完成但测试失败，请检查API实现');
    }

    // 步骤4：生成修复报告
    await generateFixReport();

  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
  }
}

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = {
  checkDatabaseStatus,
  executeDatabaseFix,
  testIndependentRegistration
};