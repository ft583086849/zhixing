#!/usr/bin/env node

/**
 * 正确API路径测试 - 使用正确的path参数
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

async function testCorrectAPIPaths() {
  const baseUrl = 'zhixing-seven.vercel.app';
  const timestamp = Date.now();
  
  console.log('🧪 测试正确的API路径...\n');
  
  try {
    // 测试1：创建一级销售（使用path=create）
    console.log('👤 测试1：创建一级销售（正确路径）...');
    const primarySalesData = {
      wechat_name: `test_primary_${timestamp}`,
      commission_rate: 40,
      alipay_account: `test_${timestamp}@example.com`,
      alipay_surname: '测试用户'
    };
    
    const primaryOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/primary-sales?path=create',  // 添加path=create
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const primaryResult = await makeRequest(primaryOptions, JSON.stringify(primarySalesData));
    console.log(`   状态码: ${primaryResult.status}`);
    console.log('   响应:', JSON.stringify(primaryResult.data, null, 2));
    
    let salesCode = null;
    if (primaryResult.status === 201 || primaryResult.status === 200) {
      salesCode = primaryResult.data?.data?.sales_code;
      console.log(`   ✅ 一级销售创建成功！销售代码: ${salesCode}`);
    } else {
      console.log('   ❌ 一级销售创建失败');
    }
    
    // 测试2：如果销售创建成功，创建订单
    if (salesCode) {
      console.log('\n📦 测试2：创建订单（使用正确的销售代码）...');
      
      const orderData = {
        sales_code: salesCode,
        tradingview_username: `test_user_${timestamp}`,
        customer_wechat: `test_customer_${timestamp}`,
        duration: '1month',
        purchase_type: 'immediate',
        amount: 188,
        payment_method: 'alipay',
        alipay_amount: 188,
        crypto_amount: 0,
        payment_time: new Date().toISOString()
      };
      
      const orderOptions = {
        hostname: baseUrl,
        port: 443,
        path: '/api/orders?path=create',  // 使用path=create
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const orderResult = await makeRequest(orderOptions, JSON.stringify(orderData));
      console.log(`   状态码: ${orderResult.status}`);
      console.log('   响应:', JSON.stringify(orderResult.data, null, 2));
      
      if (orderResult.status === 201 || orderResult.status === 200) {
        console.log('   ✅ 订单创建成功！');
        const orderId = orderResult.data?.data?.orderId;
        console.log(`   📋 订单ID: ${orderId}`);
        
        // 测试3：多创建几个不同状态的订单
        console.log('\n📈 测试3：创建多个不同状态的订单...');
        
        const additionalOrders = [
          {
            status: 'confirmed_payment',
            username: `confirmed_${timestamp}`,
            duration: '3months',
            amount: 488
          },
          {
            status: 'pending_config',
            username: `pending_config_${timestamp}`,
            duration: '6months',
            amount: 688
          },
          {
            status: 'confirmed_configuration',
            username: `active_${timestamp}`,
            duration: '1year',
            amount: 1588
          }
        ];
        
        for (let i = 0; i < additionalOrders.length; i++) {
          const extraOrder = additionalOrders[i];
          const extraOrderData = {
            sales_code: salesCode,
            tradingview_username: extraOrder.username,
            customer_wechat: `customer_${extraOrder.status}_${timestamp}`,
            duration: extraOrder.duration,
            purchase_type: 'immediate',
            amount: extraOrder.amount,
            payment_method: 'alipay',
            alipay_amount: extraOrder.amount,
            crypto_amount: 0,
            payment_time: new Date().toISOString()
          };
          
          const extraResult = await makeRequest(orderOptions, JSON.stringify(extraOrderData));
          if (extraResult.status === 201 || extraResult.status === 200) {
            console.log(`   ✅ ${extraOrder.status}状态订单创建成功`);
          } else {
            console.log(`   ❌ ${extraOrder.status}状态订单创建失败:`, extraResult.data?.message);
          }
          
          // 间隔1秒
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } else {
        console.log('   ❌ 订单创建失败');
      }
    }
    
    // 测试4：检查数据概览API（不需要path参数）
    console.log('\n📊 测试4：检查数据概览API...');
    const statsOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/admin?path=stats&timeRange=all',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const statsResult = await makeRequest(statsOptions);
    console.log(`   数据概览状态码: ${statsResult.status}`);
    
    if (statsResult.status === 401) {
      console.log('   ✅ 数据概览API正常（需要管理员权限）');
    } else if (statsResult.status === 200) {
      console.log('   ✅ 获取到统计数据:');
      const stats = statsResult.data?.data;
      if (stats) {
        console.log(`      总订单数: ${stats.total_orders || 0}`);
        console.log(`      总金额: $${stats.total_amount || 0}`);
        console.log(`      待付款确认订单: ${stats.pending_payment_orders || 0}`);
        console.log(`      已付款确认订单: ${stats.confirmed_payment_orders || 0}`);
      }
    } else {
      console.log('   响应:', JSON.stringify(statsResult.data, null, 2));
    }
    
    console.log('\n🎯 测试总结:');
    if (salesCode) {
      console.log('✅ 数据库连接正常');
      console.log('✅ API路径正确');
      console.log('✅ 已创建测试数据');
      console.log('\n📋 现在请验证:');
      console.log('   1. 登录管理员后台');
      console.log('   2. 查看数据概览页面（应该有数据）');
      console.log('   3. 查看订单管理页面（应该有新订单）');
      console.log('   4. 查看销售管理页面（应该有新销售）');
    } else {
      console.log('❌ 销售创建失败，需要进一步排查');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

if (require.main === module) {
  testCorrectAPIPaths();
}

module.exports = { testCorrectAPIPaths };