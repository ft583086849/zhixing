#!/usr/bin/env node

/**
 * 诊断API错误 - 一级分销商移除功能
 * 
 * 目的：获取具体的500错误信息
 */

const https = require('https');

function makeDetailedRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Error-Diagnosis-Tool/1.0',
        'Accept': 'application/json',
        'Accept-Encoding': 'identity', // 避免压缩，获取原始响应
        ...options.headers
      },
      timeout: 15000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk.toString();
      });
      
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          headers: res.headers,
          body: data,
          rawResponse: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function diagnoseAPI() {
  console.log('🔍 诊断一级分销商移除功能API错误');
  console.log('='.repeat(50));
  
  const baseUrl = 'https://zhixing-seven.vercel.app/api';
  
  console.log('\n📋 测试1: 基础健康检查');
  try {
    const health = await makeDetailedRequest(`${baseUrl}/health`);
    console.log(`✅ 健康检查: ${health.status}`);
    if (health.status !== 200) {
      console.log(`❌ 响应体: ${health.body}`);
    }
  } catch (error) {
    console.log(`❌ 健康检查失败: ${error.message}`);
  }
  
  console.log('\n📋 测试2: OPTIONS预检请求');
  try {
    const options = await makeDetailedRequest(`${baseUrl}/sales`, {
      method: 'OPTIONS'
    });
    console.log(`✅ OPTIONS请求: ${options.status}`);
    console.log(`📄 允许的方法: ${options.headers['access-control-allow-methods'] || '未设置'}`);
    console.log(`📄 完整响应: ${options.body}`);
  } catch (error) {
    console.log(`❌ OPTIONS请求失败: ${error.message}`);
  }
  
  console.log('\n📋 测试3: PUT请求到remove-secondary（无Token）');
  try {
    const putRequest = await makeDetailedRequest(`${baseUrl}/sales?path=remove-secondary&id=123`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: '测试移除' })
    });
    
    console.log(`📊 状态码: ${putRequest.status}`);
    console.log(`📄 响应头: ${JSON.stringify(putRequest.headers, null, 2)}`);
    console.log(`📄 完整响应体: ${putRequest.body}`);
    
    // 尝试解析JSON
    try {
      const jsonResponse = JSON.parse(putRequest.body);
      console.log(`📊 解析的JSON: ${JSON.stringify(jsonResponse, null, 2)}`);
    } catch {
      console.log(`⚠️  响应不是有效JSON`);
    }
    
  } catch (error) {
    console.log(`❌ PUT请求失败: ${error.message}`);
  }
  
  console.log('\n📋 测试4: PUT请求到不存在的路径');
  try {
    const nonExistentPath = await makeDetailedRequest(`${baseUrl}/sales?path=non-existent`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'data' })
    });
    
    console.log(`📊 不存在路径状态码: ${nonExistentPath.status}`);
    console.log(`📄 不存在路径响应: ${nonExistentPath.body}`);
    
  } catch (error) {
    console.log(`❌ 不存在路径测试失败: ${error.message}`);
  }
  
  console.log('\n📋 测试5: 检查具体错误日志');
  console.log('💡 如果所有请求都返回500，可能的原因：');
  console.log('   1. 数据库连接问题');
  console.log('   2. 环境变量配置问题');
  console.log('   3. 代码中有运行时错误');
  console.log('   4. Vercel函数冷启动问题');
  console.log('   5. 内存或超时限制');
  
  console.log('\n🔧 建议调试步骤：');
  console.log('   1. 检查Vercel部署日志');
  console.log('   2. 验证数据库连接参数');
  console.log('   3. 添加更多console.log调试信息');
  console.log('   4. 简化API函数进行测试');
}

// 运行诊断
diagnoseAPI().then(() => {
  console.log('\n🏁 诊断完成');
}).catch(error => {
  console.error('\n💥 诊断过程出错:', error);
});