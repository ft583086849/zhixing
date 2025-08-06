#!/usr/bin/env node

/**
 * 通过API检查数据 - 模拟管理员登录并检查数据
 */

const https = require('https');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function checkDataThroughAPI() {
  const baseUrl = 'zhixing-seven.vercel.app';
  
  try {
    console.log('🔍 通过API检查数据概览统计...');
    
    // 1. 检查数据概览API (不需要认证的基础检查)
    console.log('\n📊 检查基础API响应...');
    
    const options = {
      hostname: baseUrl,
      port: 443,
      path: '/api/admin?path=stats',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const result = await makeRequest(options);
    console.log(`状态码: ${result.status}`);
    
    if (result.status === 401) {
      console.log('✅ API正常，需要认证（这是预期的）');
      console.log('响应:', JSON.stringify(result.data, null, 2));
    } else if (result.status === 200) {
      console.log('✅ API正常，获得统计数据:');
      console.log('响应:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ API异常响应:');
      console.log('响应:', result.data);
    }
    
    // 2. 检查orders API
    console.log('\n📋 检查订单API...');
    const orderOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/admin?path=orders&page=1&limit=5',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const orderResult = await makeRequest(orderOptions);
    console.log(`状态码: ${orderResult.status}`);
    console.log('响应:', JSON.stringify(orderResult.data, null, 2));
    
    // 3. 检查销售API
    console.log('\n👥 检查销售API...');
    const salesOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/admin?path=sales&page=1&limit=5',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const salesResult = await makeRequest(salesOptions);
    console.log(`状态码: ${salesResult.status}`);
    console.log('响应:', JSON.stringify(salesResult.data, null, 2));
    
    // 4. 检查基础路由
    console.log('\n🌐 检查基础路由...');
    const baseOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const baseResult = await makeRequest(baseOptions, JSON.stringify({test: 'check'}));
    console.log(`状态码: ${baseResult.status}`);
    console.log('响应:', JSON.stringify(baseResult.data, null, 2));
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

if (require.main === module) {
  checkDataThroughAPI();
}

module.exports = { checkDataThroughAPI };