#!/usr/bin/env node

/**
 * 测试线上用户购买页面状态
 * 检查是否还有"下单拥挤，请等待"的问题
 */

const https = require('https');

const API_BASE = 'https://zhixing-seven.vercel.app/api';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testOnlineStatus() {
  console.log('🔍 检查线上购买页面状态...\n');

  try {
    // 1. 测试API健康状况
    console.log('1. 检查API健康状况...');
    const health = await makeRequest('/health');
    console.log(`   状态: ${health.status}`);
    console.log(`   响应: ${health.data.message || 'OK'}\n`);

    // 2. 测试销售代码查找（这是购买页面的关键）
    console.log('2. 测试销售代码查找功能...');
    
    // 测试一个已知的销售代码（如果有的话）
    const testSalesCode = 'test_code';
    const salesResult = await makeRequest(`/sales?sales_code=${testSalesCode}`);
    console.log(`   测试sales_code查找: ${salesResult.status}`);
    console.log(`   响应: ${salesResult.data.message || '未找到销售信息'}\n`);

    // 3. 模拟用户购买请求
    console.log('3. 模拟用户购买请求...');
    const orderData = {
      sales_code: testSalesCode,
      customer_wechat: 'test_user',
      tradingview_username: 'test_tv_user',
      package_type: '7_days_free',
      amount: 0
    };

    const orderResult = await makeRequest('/orders', 'POST', orderData);
    console.log(`   购买请求状态: ${orderResult.status}`);
    console.log(`   响应消息: ${orderResult.data.message}`);
    
    if (orderResult.data.message === '下单拥挤，请等待') {
      console.log('   ❌ 仍然存在"下单拥挤"问题');
    } else if (orderResult.status >= 200 && orderResult.status < 300) {
      console.log('   ✅ 购买功能正常');
    } else {
      console.log(`   ⚠️  其他错误: ${orderResult.data.message}`);
    }

    // 4. 测试管理员API
    console.log('\n4. 测试管理员API状态...');
    const adminResult = await makeRequest('/admin?action=stats');
    console.log(`   管理员API状态: ${adminResult.status}`);
    console.log(`   响应: ${adminResult.data.message || 'OK'}`);

  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
  }
}

async function main() {
  console.log('🚀 线上购买页面状态检查\n');
  console.log('='.repeat(50));
  
  await testOnlineStatus();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ 检查完成');
}

if (require.main === module) {
  main();
}