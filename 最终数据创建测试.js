#!/usr/bin/env node

/**
 * 最终数据创建测试 - 修复所有参数问题
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

async function createTestDataCorrectly() {
  const baseUrl = 'zhixing-seven.vercel.app';
  const timestamp = Date.now();
  
  console.log('🚀 最终数据创建测试...\n');
  
  try {
    // 1. 创建一级销售（修复参数）
    console.log('👤 1. 创建一级销售（完整参数）...');
    const primarySalesData = {
      wechat_name: `test_primary_${timestamp}`,
      commission_rate: 40,
      payment_method: 'alipay',  // 添加必填的收款方式
      alipay_account: `test_${timestamp}@example.com`,
      alipay_surname: '测试用户'
    };
    
    const primaryOptions = {
      hostname: baseUrl,
      port: 443,
      path: '/api/primary-sales?path=create',
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
      console.log('   ❌ 一级销售创建失败，尝试其他参数组合...');
      
      // 尝试更完整的参数
      const fullPrimarySalesData = {
        wechat_name: `test_primary_${timestamp}`,
        commission_rate: 40,
        payment_method: 'alipay',
        alipay_account: `test${timestamp}@example.com`,
        alipay_surname: '测试用户',
        phone: '13800138000',
        real_name: '测试用户',
        id_card: '110101199001011234'
      };
      
      const fullResult = await makeRequest(primaryOptions, JSON.stringify(fullPrimarySalesData));
      console.log(`   完整参数状态码: ${fullResult.status}`);
      console.log('   完整参数响应:', JSON.stringify(fullResult.data, null, 2));
      
      if (fullResult.status === 201 || fullResult.status === 200) {
        salesCode = fullResult.data?.data?.sales_code;
        console.log(`   ✅ 完整参数创建成功！销售代码: ${salesCode}`);
      }
    }
    
    // 2. 如果销售创建成功，创建订单
    if (salesCode) {
      console.log('\n📦 2. 创建测试订单...');
      
      const orders = [
        {
          name: '待付款确认订单',
          data: {
            sales_code: salesCode,
            tradingview_username: `pending_payment_${timestamp}`,
            customer_wechat: `pending_${timestamp}`,
            duration: '1month',
            purchase_type: 'immediate',
            amount: 188,
            payment_method: 'alipay',
            alipay_amount: 188,
            crypto_amount: 0,
            payment_time: new Date().toISOString()
          }
        },
        {
          name: '已付款确认订单',
          data: {
            sales_code: salesCode,
            tradingview_username: `confirmed_payment_${timestamp}`,
            customer_wechat: `confirmed_${timestamp}`,
            duration: '3months',
            purchase_type: 'immediate',
            amount: 488,
            payment_method: 'alipay',
            alipay_amount: 488,
            crypto_amount: 0,
            payment_time: new Date().toISOString()
          }
        }
      ];
      
      const orderOptions = {
        hostname: baseUrl,
        port: 443,
        path: '/api/orders?path=create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      let orderCount = 0;
      let totalAmount = 0;
      
      for (const order of orders) {
        console.log(`\n   创建${order.name}...`);
        const orderResult = await makeRequest(orderOptions, JSON.stringify(order.data));
        console.log(`   状态码: ${orderResult.status}`);
        
        if (orderResult.status === 201 || orderResult.status === 200) {
          console.log(`   ✅ ${order.name}创建成功`);
          orderCount++;
          totalAmount += order.data.amount;
        } else {
          console.log(`   ❌ ${order.name}创建失败`);
          console.log('   响应:', JSON.stringify(orderResult.data, null, 2));
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`\n📊 创建结果总结:`);
      console.log(`   销售代码: ${salesCode}`);
      console.log(`   成功创建订单: ${orderCount}个`);
      console.log(`   总金额: $${totalAmount}`);
      
      if (orderCount > 0) {
        console.log('\n✅ 数据创建成功！现在验证:');
        console.log('   1. 登录管理员后台');
        console.log('   2. 查看数据概览页面');
        console.log('   3. 应该看到:');
        console.log(`      - 总订单数: ${orderCount}`);
        console.log(`      - 总金额: $${totalAmount}`);
        console.log('      - 各项统计不再是0');
        
        console.log('\n💡 如果数据概览仍然是0:');
        console.log('   1. 确认时间范围选择"全部数据"');
        console.log('   2. 强制刷新页面（Ctrl+F5）');
        console.log('   3. 查看浏览器Network面板的API请求');
        console.log('   4. 检查管理员权限是否正确');
      }
      
    } else {
      console.log('\n❌ 无法创建销售，可能的原因:');
      console.log('   1. 数据库表结构问题');
      console.log('   2. 必填字段不匹配');
      console.log('   3. 数据库权限问题');
      console.log('   4. 字段验证逻辑问题');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

if (require.main === module) {
  createTestDataCorrectly();
}

module.exports = { createTestDataCorrectly };