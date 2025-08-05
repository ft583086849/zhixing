#!/usr/bin/env node

const https = require('https');

// 通过API添加orders表销售身份字段
async function addOrdersSalesFields() {
  console.log('🗄️ 通过API添加orders表销售身份字段');
  console.log('='.repeat(50));
  
  // 通过API添加orders表销售身份字段
  console.log(`📊 调用API添加orders表销售身份字段`);
  
  try {
    const result = await makeRequest({
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/database-schema',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      action: 'add_orders_sales_fields'
    }));
    
    console.log(`✅ HTTP状态: ${result.statusCode}`);
    if (result.statusCode === 200) {
      const data = JSON.parse(result.data);
      console.log(`✅ 成功: ${data.success}`);
      console.log(`✅ 消息: ${data.message}`);
      if (data.data && data.data.results) {
        console.log('📋 详细结果:');
        data.data.results.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.field}: ${result.status}`);
        });
        console.log(`📊 汇总: ${data.data.summary.successful}/${data.data.summary.total_operations} 成功`);
      }
    } else {
      console.log(`❌ 失败: ${result.data}`);
    }
  } catch (error) {
    console.log(`❌ 请求异常: ${error.message}`);
  }
  
  // 验证字段添加结果
  console.log('\n📊 验证orders表字段添加结果...');
  try {
    const result = await makeRequest({
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/database-schema',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      action: 'check_orders_schema'
    }));
    
    console.log(`✅ 验证状态: ${result.statusCode}`);
    if (result.statusCode === 200) {
      const data = JSON.parse(result.data);
      console.log('✅ orders表结构验证结果:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ 验证失败: ${result.data}`);
    }
  } catch (error) {
    console.log(`❌ 验证异常: ${error.message}`);
  }
  
  // 测试修复后的订单创建
  console.log('\n🛒 测试修复后的订单创建...');
  try {
    const orderData = {
      sales_code: 'ps_95',
      link_code: 'ps_95',
      tradingview_username: 'test_fixed_' + Date.now(),
      customer_wechat: 'test_wechat_' + Date.now(),
      duration: '7days',
      amount: 0,
      payment_method: 'free',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate'
    };
    
    const result = await makeRequest({
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/orders?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(orderData));
    
    console.log(`✅ 订单创建状态: ${result.statusCode}`);
    if (result.statusCode === 200) {
      const data = JSON.parse(result.data);
      console.log(`🎉 订单创建成功！`);
      console.log(`✅ 订单ID: ${data.data?.orderId || '未知'}`);
      console.log(`✅ 销售类型归类: 应为primary类型`);
    } else {
      console.log(`❌ 订单创建失败: ${result.data}`);
    }
  } catch (error) {
    console.log(`❌ 订单测试异常: ${error.message}`);
  }
}

// HTTP请求封装
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ 
        statusCode: res.statusCode, 
        data: data,
        headers: res.headers 
      }));
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// 运行修复
addOrdersSalesFields().catch(console.error);