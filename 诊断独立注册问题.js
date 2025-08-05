#!/usr/bin/env node

/**
 * 诊断独立二级销售注册问题
 * 快速检查数据库结构和API状态
 */

const https = require('https');

async function testAPI(url, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

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
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: parsed,
            rawData: responseData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            success: false,
            data: null,
            rawData: responseData,
            error: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        success: false,
        data: null,
        error: error.message
      });
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function diagnoseIndependentRegistration() {
  console.log('🔍 诊断独立二级销售注册问题\n');
  console.log('='.repeat(60));

  // 测试数据
  const testData = {
    wechat_name: `test_independent_${Date.now()}`,
    payment_method: 'alipay',
    payment_address: 'test@example.com',
    alipay_surname: '测试'
  };

  console.log('📋 测试数据:', testData);
  console.log('\n🧪 开始测试独立注册API...\n');

  try {
    // 测试独立注册API
    const response = await testAPI(
      'https://zhixing-seven.vercel.app/api/secondary-sales?path=register-independent',
      'POST',
      testData
    );

    console.log(`📊 HTTP状态: ${response.statusCode}`);
    console.log(`✅ 请求成功: ${response.success}`);
    
    if (response.data) {
      console.log('📦 响应数据:', JSON.stringify(response.data, null, 2));
      
      if (!response.success) {
        console.log('\n🔍 错误分析:');
        
        if (response.data.message) {
          const errorMsg = response.data.message.toLowerCase();
          
          if (errorMsg.includes('cannot be null') || errorMsg.includes('not null')) {
            console.log('❌ 确认问题：primary_sales_id 字段不能为 NULL');
            console.log('🔧 需要执行数据库修复脚本');
            return 'DATABASE_CONSTRAINT_ERROR';
          } else if (errorMsg.includes('path not found') || errorMsg.includes('路径不存在')) {
            console.log('❌ API路由问题：register-independent 路径不存在');
            console.log('🔧 需要检查后端API实现');
            return 'API_ROUTE_ERROR';
          } else if (errorMsg.includes('duplicate') || errorMsg.includes('唯一')) {
            console.log('⚠️ 微信号重复，这是正常的验证');
            console.log('✅ API路由工作正常，数据库约束正常');
            return 'VALIDATION_ERROR';
          } else {
            console.log('❓ 其他错误:', response.data.message);
            return 'OTHER_ERROR';
          }
        }
      } else {
        console.log('✅ 独立注册成功！');
        console.log('🎉 数据库和API都工作正常');
        return 'SUCCESS';
      }
    } else if (response.rawData) {
      console.log('📄 原始响应:', response.rawData);
      
      if (response.rawData.includes('404') || response.rawData.includes('Not Found')) {
        console.log('❌ 页面不存在，可能是路由问题');
        return 'ROUTE_NOT_FOUND';
      }
    }

    if (response.error) {
      console.log('❌ 网络错误:', response.error);
      return 'NETWORK_ERROR';
    }

    return 'UNKNOWN_ERROR';

  } catch (error) {
    console.log('❌ 诊断过程中出错:', error.message);
    return 'DIAGNOSIS_ERROR';
  }
}

async function provideSolution(problemType) {
  console.log('\n💡 解决方案建议:\n');
  
  switch (problemType) {
    case 'DATABASE_CONSTRAINT_ERROR':
      console.log('🔧 数据库约束问题 - 需要修复 secondary_sales 表');
      console.log('');
      console.log('📋 解决步骤:');
      console.log('1. 执行 SQL 脚本修复:');
      console.log('   文件: fix-secondary-sales-table.sql');
      console.log('');
      console.log('2. 或使用 API 修复 (需要管理员权限):');
      console.log('   运行: node 修复独立注册数据库_API方案.js');
      console.log('');
      console.log('3. SQL 修复命令:');
      console.log('   ALTER TABLE secondary_sales MODIFY COLUMN primary_sales_id INT NULL;');
      break;

    case 'API_ROUTE_ERROR':
      console.log('🛣️ API路由问题 - register-independent 路径不存在');
      console.log('');
      console.log('📋 解决步骤:');
      console.log('1. 检查 api/secondary-sales.js 是否包含独立注册路由');
      console.log('2. 确认代码已正确部署到生产环境');
      console.log('3. 可能需要重新部署后端API');
      break;

    case 'SUCCESS':
      console.log('🎉 一切正常！独立注册功能工作正常');
      console.log('');
      console.log('✅ 可以正常使用以下功能:');
      console.log('- 独立注册: /secondary-sales');
      console.log('- 关联注册: /secondary-sales?sales_code=SR...');
      break;

    case 'VALIDATION_ERROR':
      console.log('✅ API工作正常，只是验证错误（微信号重复等）');
      console.log('');
      console.log('📋 正常情况:');
      console.log('- 数据库约束正常工作');
      console.log('- API路由配置正确');
      console.log('- 独立注册功能可用');
      break;

    default:
      console.log('❓ 未知问题，需要进一步调查');
      console.log('');
      console.log('📋 建议步骤:');
      console.log('1. 检查网络连接');
      console.log('2. 确认Vercel部署状态');
      console.log('3. 查看服务器日志');
      break;
  }

  console.log('\n📞 如需帮助，请提供以上诊断结果');
}

async function main() {
  const problemType = await diagnoseIndependentRegistration();
  await provideSolution(problemType);
  
  console.log('\n📝 诊断完成');
  console.log(`⏰ 诊断时间: ${new Date().toLocaleString('zh-CN')}`);
}

if (require.main === module) {
  main();
}