#!/usr/bin/env node

/**
 * 创建完整数据流程 - 先创建销售，再创建订单，最后验证统计
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

async function createCompleteDataFlow() {
  const baseUrl = 'zhixing-seven.vercel.app';
  const timestamp = Date.now();
  
  console.log('🚀 开始创建完整数据流程...\n');
  
  try {
    // 步骤1：创建一级销售
    console.log('👤 步骤1：创建一级销售...');
    const primarySalesData = {
      wechat_name: `primary_${timestamp}`,
      commission_rate: 40,
      alipay_account: `test_${timestamp}@example.com`,
      alipay_surname: '测试用户',
      payment_method: 'alipay'
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
    console.log(`   状态码: ${primaryResult.status}`);
    console.log('   响应:', JSON.stringify(primaryResult.data, null, 2));
    
    let primarySalesCode = null;
    if (primaryResult.status === 201 || primaryResult.status === 200) {
      primarySalesCode = primaryResult.data?.data?.sales_code;
      console.log(`   ✅ 一级销售创建成功！销售代码: ${primarySalesCode}`);
    } else {
      console.log('   ❌ 一级销售创建失败');
      return;
    }
    
    // 等待1秒确保数据写入
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 步骤2：使用销售代码创建多个不同状态的订单
    console.log('\n📦 步骤2：创建多个测试订单...');
    
    const orders = [
      {
        name: '待付款确认订单',
        data: {
          sales_code: primarySalesCode,
          tradingview_username: `pending_payment_${timestamp}`,
          customer_wechat: `pending_${timestamp}`,
          duration: '1month',
          purchase_type: 'immediate',
          amount: 188,
          payment_method: 'alipay',
          alipay_amount: 188,
          crypto_amount: 0,
          status: 'pending_payment',
          payment_time: new Date().toISOString()
        }
      },
      {
        name: '已付款确认订单',
        data: {
          sales_code: primarySalesCode,
          tradingview_username: `confirmed_payment_${timestamp}`,
          customer_wechat: `confirmed_${timestamp}`,
          duration: '3months',
          purchase_type: 'immediate',
          amount: 488,
          payment_method: 'alipay',
          alipay_amount: 488,
          crypto_amount: 0,
          status: 'confirmed_payment',
          payment_time: new Date().toISOString()
        }
      },
      {
        name: '待配置确认订单',
        data: {
          sales_code: primarySalesCode,
          tradingview_username: `pending_config_${timestamp}`,
          customer_wechat: `config_${timestamp}`,
          duration: '6months',
          purchase_type: 'immediate',
          amount: 688,
          payment_method: 'crypto',
          alipay_amount: 0,
          crypto_amount: 688,
          status: 'pending_config',
          payment_time: new Date().toISOString()
        }
      },
      {
        name: '已配置确认订单',
        data: {
          sales_code: primarySalesCode,
          tradingview_username: `confirmed_config_${timestamp}`,
          customer_wechat: `active_${timestamp}`,
          duration: '1year',
          purchase_type: 'immediate',
          amount: 1588,
          payment_method: 'alipay',
          alipay_amount: 1588,
          crypto_amount: 0,
          status: 'confirmed_configuration',
          payment_time: new Date().toISOString()
        }
      }
    ];
    
    const createOrderOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/orders?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const createdOrders = [];
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      console.log(`\n   创建${order.name}...`);
      
      const orderResult = await makeRequest(createOrderOptions, JSON.stringify(order.data));
      console.log(`   状态码: ${orderResult.status}`);
      
      if (orderResult.status === 201 || orderResult.status === 200) {
        console.log(`   ✅ ${order.name}创建成功`);
        createdOrders.push({
          name: order.name,
          id: orderResult.data?.data?.orderId,
          status: order.data.status,
          amount: order.data.amount
        });
      } else {
        console.log(`   ❌ ${order.name}创建失败`);
        console.log('   响应:', JSON.stringify(orderResult.data, null, 2));
      }
      
      // 间隔1秒避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 步骤3：验证数据统计
    console.log('\n📊 步骤3：验证数据创建结果...');
    console.log(`创建的订单总数: ${createdOrders.length}`);
    
    let totalAmount = 0;
    const statusCounts = {};
    
    createdOrders.forEach(order => {
      totalAmount += order.amount;
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    console.log('\n📈 预期统计结果:');
    console.log(`   总订单数: ${createdOrders.length}`);
    console.log(`   总金额: $${totalAmount}`);
    console.log('   订单状态分布:');
    Object.keys(statusCounts).forEach(status => {
      const statusMap = {
        'pending_payment': '待付款确认订单',
        'confirmed_payment': '已付款确认订单',
        'pending_config': '待配置确认订单',
        'confirmed_configuration': '已配置确认订单'
      };
      console.log(`     ${statusMap[status] || status}: ${statusCounts[status]}`);
    });
    
    // 步骤4：提供验证指导
    console.log('\n🎯 现在请验证管理员后台:');
    console.log('   1. 登录管理员后台');
    console.log('   2. 查看数据概览页面，应该看到:');
    console.log(`      - 总订单数: ${createdOrders.length}`);
    console.log(`      - 总金额: $${totalAmount}`);
    console.log('      - 各状态订单数量 > 0');
    console.log('   3. 查看订单管理页面，应该看到新创建的订单');
    console.log('   4. 查看销售管理页面，应该看到新创建的销售记录');
    
    console.log('\n💡 如果数据概览仍然显示0:');
    console.log('   1. 强制刷新页面（Ctrl+F5）');
    console.log('   2. 检查时间范围是否选择"全部数据"');
    console.log('   3. 查看浏览器Network面板的API请求');
    console.log('   4. 检查是否有JavaScript错误');
    
    console.log('\n✅ 数据创建流程完成！');
    
  } catch (error) {
    console.error('❌ 数据创建流程失败:', error.message);
  }
}

if (require.main === module) {
  createCompleteDataFlow();
}

module.exports = { createCompleteDataFlow };