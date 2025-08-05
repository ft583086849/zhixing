#!/usr/bin/env node

/**
 * 测试简化API - 对比分析
 * 
 * 目的：对比test-simple.js和sales.js的行为差异
 * 找出导致FUNCTION_INVOCATION_FAILED的根本原因
 */

const https = require('https');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'API-Comparison-Test/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: 15000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          headers: res.headers,
          body: data,
          success: res.statusCode < 400
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function compareAPIs() {
  console.log('🔍 API对比分析 - 简化版 vs 完整版');
  console.log('='.repeat(60));
  
  const baseUrl = 'https://zhixing-seven.vercel.app/api';
  
  console.log('\n📋 第一轮: 基础GET请求对比');
  console.log('-'.repeat(40));
  
  // 测试1: 简化API
  console.log('\n🧪 测试简化API - GET请求');
  try {
    const simpleGet = await makeRequest(`${baseUrl}/test-simple`);
    console.log(`✅ 简化API状态: ${simpleGet.status}`);
    console.log(`📄 简化API响应: ${simpleGet.body}`);
    
    if (simpleGet.headers['x-vercel-error']) {
      console.log(`❌ Vercel错误: ${simpleGet.headers['x-vercel-error']}`);
    }
    
  } catch (error) {
    console.log(`❌ 简化API失败: ${error.message}`);
  }
  
  // 测试2: 完整API的健康检查（已知正常）
  console.log('\n🧪 测试完整API - 健康检查');
  try {
    const healthCheck = await makeRequest(`${baseUrl}/health`);
    console.log(`✅ 健康检查状态: ${healthCheck.status}`);
    console.log(`📄 健康检查响应: ${healthCheck.body.substring(0, 100)}...`);
  } catch (error) {
    console.log(`❌ 健康检查失败: ${error.message}`);
  }
  
  // 测试3: 完整API的sales端点
  console.log('\n🧪 测试完整API - sales端点');
  try {
    const salesGet = await makeRequest(`${baseUrl}/sales`);
    console.log(`📊 Sales API状态: ${salesGet.status}`);
    console.log(`📄 Sales API响应: ${salesGet.body}`);
    
    if (salesGet.headers['x-vercel-error']) {
      console.log(`❌ Vercel错误: ${salesGet.headers['x-vercel-error']}`);
    }
    
  } catch (error) {
    console.log(`❌ Sales API失败: ${error.message}`);
  }
  
  console.log('\n📋 第二轮: OPTIONS预检请求对比');
  console.log('-'.repeat(40));
  
  // 测试4: 简化API的OPTIONS
  console.log('\n🧪 测试简化API - OPTIONS请求');
  try {
    const simpleOptions = await makeRequest(`${baseUrl}/test-simple`, {
      method: 'OPTIONS'
    });
    console.log(`✅ 简化API OPTIONS状态: ${simpleOptions.status}`);
    console.log(`📄 简化API允许方法: ${simpleOptions.headers['access-control-allow-methods'] || '未设置'}`);
    
  } catch (error) {
    console.log(`❌ 简化API OPTIONS失败: ${error.message}`);
  }
  
  // 测试5: 完整API的OPTIONS
  console.log('\n🧪 测试完整API - OPTIONS请求');
  try {
    const salesOptions = await makeRequest(`${baseUrl}/sales`, {
      method: 'OPTIONS'
    });
    console.log(`📊 Sales API OPTIONS状态: ${salesOptions.status}`);
    console.log(`📄 Sales API允许方法: ${salesOptions.headers['access-control-allow-methods'] || '未设置'}`);
    
    if (salesOptions.headers['x-vercel-error']) {
      console.log(`❌ Vercel错误: ${salesOptions.headers['x-vercel-error']}`);
    }
    
  } catch (error) {
    console.log(`❌ Sales API OPTIONS失败: ${error.message}`);
  }
  
  console.log('\n📋 第三轮: PUT请求对比');
  console.log('-'.repeat(40));
  
  // 测试6: 简化API的PUT
  console.log('\n🧪 测试简化API - PUT请求');
  try {
    const simplePut = await makeRequest(`${baseUrl}/test-simple?path=test`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: { test: 'data' }
    });
    console.log(`✅ 简化API PUT状态: ${simplePut.status}`);
    console.log(`📄 简化API PUT响应: ${simplePut.body}`);
    
  } catch (error) {
    console.log(`❌ 简化API PUT失败: ${error.message}`);
  }
  
  // 测试7: 完整API的PUT
  console.log('\n🧪 测试完整API - PUT请求');
  try {
    const salesPut = await makeRequest(`${baseUrl}/sales?path=remove-secondary&id=test`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: { reason: 'test' }
    });
    console.log(`📊 Sales API PUT状态: ${salesPut.status}`);
    console.log(`📄 Sales API PUT响应: ${salesPut.body}`);
    
    if (salesPut.headers['x-vercel-error']) {
      console.log(`❌ Vercel错误: ${salesPut.headers['x-vercel-error']}`);
    }
    
  } catch (error) {
    console.log(`❌ Sales API PUT失败: ${error.message}`);
  }
  
  console.log('\n📋 分析总结');
  console.log('-'.repeat(40));
  console.log('💡 如果简化API正常工作而Sales API失败，说明：');
  console.log('   1. Vercel环境本身正常');
  console.log('   2. PUT方法支持正常');
  console.log('   3. 问题在于api/sales.js的具体代码');
  console.log('   4. 可能的原因：数据库连接、依赖模块、异步处理');
  console.log('\n💡 如果两个API都失败，说明：');
  console.log('   1. Vercel部署环境有问题');
  console.log('   2. 账户配置或权限问题');
  console.log('   3. 需要检查Vercel控制台日志');
}

// 等待部署完成后执行
async function waitAndTest() {
  console.log('⏰ 等待Vercel部署完成...');
  await new Promise(resolve => setTimeout(resolve, 30000)); // 等待30秒
  
  await compareAPIs();
}

waitAndTest().then(() => {
  console.log('\n🏁 对比分析完成');
}).catch(error => {
  console.error('\n💥 分析过程出错:', error);
});