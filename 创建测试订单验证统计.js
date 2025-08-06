#!/usr/bin/env node

/**
 * 创建测试订单验证统计 - 通过API创建测试订单并验证统计
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

async function createTestOrderAndVerify() {
  const baseUrl = 'zhixing-seven.vercel.app';
  
  try {
    console.log('🧪 创建测试订单验证统计功能...');
    
    // 1. 创建一个测试订单
    console.log('\n📝 创建测试订单...');
    
    const orderData = {
      sales_code: 'TEST_STATS_' + Date.now(),
      sales_type: 'secondary',
      tradingview_username: 'test_user_stats',
      customer_wechat: 'test_wechat_stats',
      duration: '1month',
      purchase_type: 'immediate',
      effective_time: new Date().toISOString(),
      amount: 188,
      payment_method: 'alipay',
      alipay_amount: 188,
      crypto_amount: 0,
      commission_rate: 0.30,
      commission_amount: 56.4,
      status: 'pending_payment', // 开始状态
      payment_time: new Date().toISOString(),
      screenshot_path: 'test_screenshot.jpg'
    };
    
    const createOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const createResult = await makeRequest(createOptions, JSON.stringify(orderData));
    console.log(`创建订单状态码: ${createResult.status}`);
    
    if (createResult.status === 201 || createResult.status === 200) {
      console.log('✅ 测试订单创建成功');
      console.log('订单详情:', JSON.stringify(createResult.data, null, 2));
      
      const orderId = createResult.data?.data?.orderId;
      if (orderId) {
        console.log(`\n✅ 订单ID: ${orderId}`);
        
        // 等待几秒让数据同步
        console.log('⏳ 等待数据同步...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 现在验证数据概览是否更新
        console.log('\n📊 验证数据概览统计是否更新...');
        // 由于需要管理员权限，这里只能建议手动检查
        console.log('💡 请手动检查以下内容:');
        console.log('   1. 登录管理员后台');
        console.log('   2. 查看数据概览页面');
        console.log('   3. 检查"待付款确认订单"是否增加了1');
        console.log('   4. 检查"总订单数"是否增加了1');
        console.log('   5. 检查"总金额"是否增加了$188');
        
        return orderId;
      }
    } else {
      console.log('❌ 测试订单创建失败');
      console.log('错误信息:', JSON.stringify(createResult.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 还要检查订单状态更新问题
async function testOrderStatusUpdate(orderId) {
  if (!orderId) {
    console.log('⚠️  没有订单ID，跳过状态更新测试');
    return;
  }
  
  console.log(`\n🔄 测试订单状态更新... (订单ID: ${orderId})`);
  
  // 这里需要管理员权限，只能提供测试指导
  console.log('💡 请手动测试订单状态更新:');
  console.log('   1. 在订单管理页面找到刚创建的测试订单');
  console.log('   2. 点击"确认付款"按钮');
  console.log('   3. 观察是否出现"状态更新失败"错误');
  console.log('   4. 检查订单状态是否从"待付款确认"变为"已付款确认"');
  console.log('   5. 检查数据概览中的统计是否相应更新');
}

if (require.main === module) {
  createTestOrderAndVerify().then(orderId => {
    return testOrderStatusUpdate(orderId);
  });
}

module.exports = { createTestOrderAndVerify, testOrderStatusUpdate };