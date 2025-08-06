#!/usr/bin/env node

/**
 * 修复API调用并检查数据 - 使用正确的API路径
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

async function checkDatabaseWithCorrectAPI() {
  const baseUrl = 'zhixing-seven.vercel.app';
  
  console.log('🔍 使用正确的API路径检查数据库...\n');
  
  try {
    // 1. 创建测试订单 - 使用正确的API路径
    console.log('📝 1. 使用正确API路径创建测试订单...');
    const testOrderData = {
      sales_code: 'DB_TEST_' + Date.now(),
      sales_type: 'primary',
      tradingview_username: 'api_test_user',
      customer_wechat: 'api_test_wechat',
      duration: '1month',
      purchase_type: 'immediate',
      effective_time: new Date().toISOString(),
      amount: 188,
      payment_method: 'alipay',
      alipay_amount: 188,
      crypto_amount: 0,
      commission_rate: 0.30,
      commission_amount: 56.4,
      status: 'pending_payment',
      payment_time: new Date().toISOString()
    };
    
    // 正确的API路径：/api/orders?path=create
    const createOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/orders?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const createResult = await makeRequest(createOptions, JSON.stringify(testOrderData));
    console.log(`   创建订单状态码: ${createResult.status}`);
    console.log('   响应:', JSON.stringify(createResult.data, null, 2));
    
    let orderCreated = false;
    let orderId = null;
    
    if (createResult.status === 201 || createResult.status === 200) {
      console.log('   ✅ 测试订单创建成功！');
      orderCreated = true;
      orderId = createResult.data?.data?.orderId || createResult.data?.data?.id;
      console.log(`   📋 订单ID: ${orderId}`);
    } else if (createResult.status === 404) {
      console.log('   ❌ API路径仍然不存在');
    } else if (createResult.status === 500) {
      console.log('   ❌ 服务器内部错误');
    } else if (createResult.status === 422) {
      console.log('   ⚠️  参数验证错误（但API路径正确）');
    } else {
      console.log(`   ⚠️  其他响应状态: ${createResult.status}`);
    }
    
    // 2. 尝试获取订单列表（需要管理员权限）
    console.log('\n📋 2. 检查订单列表API...');
    const listOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/orders?path=list',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const listResult = await makeRequest(listOptions);
    console.log(`   订单列表状态码: ${listResult.status}`);
    
    if (listResult.status === 401) {
      console.log('   ✅ API路径正确（需要管理员权限）');
    } else if (listResult.status === 200) {
      console.log('   ✅ 获取到订单列表');
      console.log('   订单数量:', listResult.data?.data?.orders?.length || 0);
    } else {
      console.log('   响应:', JSON.stringify(listResult.data, null, 2));
    }
    
    // 3. 检查一级销售API
    console.log('\n👥 3. 检查一级销售创建API...');
    const primarySalesData = {
      wechat_name: 'test_primary_' + Date.now(),
      commission_rate: 40,
      alipay_account: 'test@example.com',
      alipay_surname: '测试'
    };
    
    const primaryOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/primary-sales',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const primaryResult = await makeRequest(primaryOptions, JSON.stringify(primarySalesData));
    console.log(`   一级销售创建状态码: ${primaryResult.status}`);
    console.log('   响应:', JSON.stringify(primaryResult.data, null, 2));
    
    let salesCodeCreated = null;
    if (primaryResult.status === 201 || primaryResult.status === 200) {
      console.log('   ✅ 一级销售创建成功！');
      salesCodeCreated = primaryResult.data?.data?.sales_code;
      console.log(`   销售代码: ${salesCodeCreated}`);
    }
    
    // 4. 如果有销售代码，用它创建一个有效订单
    if (salesCodeCreated) {
      console.log('\n📦 4. 使用真实销售代码创建有效订单...');
      const validOrderData = {
        ...testOrderData,
        sales_code: salesCodeCreated,
        tradingview_username: 'valid_user_' + Date.now(),
        customer_wechat: 'valid_customer_' + Date.now()
      };
      
      const validOrderResult = await makeRequest(createOptions, JSON.stringify(validOrderData));
      console.log(`   有效订单创建状态码: ${validOrderResult.status}`);
      console.log('   响应:', JSON.stringify(validOrderResult.data, null, 2));
      
      if (validOrderResult.status === 201 || validOrderResult.status === 200) {
        console.log('   ✅ 有效订单创建成功！现在数据库中应该有数据了');
      }
    }
    
    // 5. 总结
    console.log('\n📊 检查结果总结:');
    
    if (orderCreated || (primaryResult.status >= 200 && primaryResult.status < 300)) {
      console.log('✅ 数据库连接和API都工作正常');
      console.log('✅ 现在数据库中应该有数据了');
      console.log('\n🔄 建议操作:');
      console.log('   1. 立即刷新管理员后台数据概览页面');
      console.log('   2. 应该能看到新创建的订单和销售数据');
      console.log('   3. 统计数字应该不再是0');
    } else {
      console.log('❌ 仍然存在问题');
      console.log('   可能原因:');
      console.log('   - 数据库配置问题');
      console.log('   - 表结构不存在');
      console.log('   - 权限问题');
    }
    
    console.log('\n💡 验证步骤:');
    console.log('   1. 登录管理员后台');
    console.log('   2. 查看数据概览页面');
    console.log('   3. 检查订单管理页面');
    console.log('   4. 如果还是0，检查浏览器Network面板的API请求');
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

if (require.main === module) {
  checkDatabaseWithCorrectAPI();
}

module.exports = { checkDatabaseWithCorrectAPI };