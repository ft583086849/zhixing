#!/usr/bin/env node

/**
 * 创建完整测试数据验证统计功能
 * 这个脚本将创建销售记录和订单数据来验证统计功能
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

// 创建测试销售记录
async function createTestSales() {
  const baseUrl = 'zhixing-seven.vercel.app';
  
  console.log('👥 创建测试销售记录...');
  
  const testSales = [
    {
      sales_type: 'primary',
      wechat_name: 'test_primary_001',
      commission_rate: 40,
      api_path: '/api/primary-sales'
    },
    {
      sales_type: 'secondary', 
      wechat_name: 'test_secondary_001',
      commission_rate: 30,
      primary_sales_id: 1, // 假设一级销售ID为1
      api_path: '/api/secondary-sales'
    }
  ];
  
  const createdSales = [];
  
  for (let i = 0; i < testSales.length; i++) {
    const salesData = testSales[i];
    console.log(`\n创建${salesData.sales_type === 'primary' ? '一级' : '二级'}销售: ${salesData.wechat_name}`);
    
    const options = {
      hostname: baseUrl,
      port: 443,
      path: salesData.api_path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    try {
      const result = await makeRequest(options, JSON.stringify(salesData));
      console.log(`状态码: ${result.status}`);
      
      if (result.status === 201 || result.status === 200) {
        console.log('✅ 销售记录创建成功');
        createdSales.push({
          ...salesData,
          id: result.data?.data?.id || result.data?.data?.salesId,
          sales_code: result.data?.data?.sales_code || result.data?.data?.linkCode
        });
      } else {
        console.log('❌ 销售记录创建失败:', JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      console.log('❌ 请求失败:', error.message);
    }
  }
  
  return createdSales;
}

// 创建测试订单
async function createTestOrders(salesRecords) {
  const baseUrl = 'zhixing-seven.vercel.app';
  
  console.log('\n📋 创建测试订单...');
  
  const testOrders = [
    {
      sales_code: salesRecords[0]?.sales_code || 'TEST_PRIMARY_001',
      tradingview_username: 'test_user_001',
      customer_wechat: 'test_customer_001',
      duration: '1month',
      amount: 188,
      status: 'pending_payment',
      description: '待付款确认订单'
    },
    {
      sales_code: salesRecords[0]?.sales_code || 'TEST_PRIMARY_001',
      tradingview_username: 'test_user_002', 
      customer_wechat: 'test_customer_002',
      duration: '3months',
      amount: 488,
      status: 'confirmed_payment',
      description: '已付款确认订单'
    },
    {
      sales_code: salesRecords[1]?.sales_code || 'TEST_SECONDARY_001',
      tradingview_username: 'test_user_003',
      customer_wechat: 'test_customer_003', 
      duration: '1month',
      amount: 188,
      status: 'pending_config',
      description: '待配置确认订单'
    },
    {
      sales_code: salesRecords[1]?.sales_code || 'TEST_SECONDARY_001',
      tradingview_username: 'test_user_004',
      customer_wechat: 'test_customer_004',
      duration: '6months', 
      amount: 888,
      status: 'confirmed_configuration',
      description: '已配置确认订单'
    }
  ];
  
  const createdOrders = [];
  
  for (let i = 0; i < testOrders.length; i++) {
    const orderData = testOrders[i];
    console.log(`\n创建订单 ${i + 1}: ${orderData.description}`);
    
    const fullOrderData = {
      ...orderData,
      sales_type: orderData.sales_code.includes('PRIMARY') ? 'primary' : 'secondary',
      purchase_type: 'immediate',
      effective_time: new Date().toISOString(),
      payment_method: 'alipay',
      alipay_amount: orderData.amount,
      crypto_amount: 0,
      commission_rate: orderData.sales_code.includes('PRIMARY') ? 0.40 : 0.30,
      commission_amount: orderData.amount * (orderData.sales_code.includes('PRIMARY') ? 0.40 : 0.30),
      payment_time: new Date().toISOString(),
      screenshot_path: 'test_screenshot.jpg'
    };
    
    const options = {
      hostname: baseUrl,
      port: 443,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    try {
      const result = await makeRequest(options, JSON.stringify(fullOrderData));
      console.log(`状态码: ${result.status}`);
      
      if (result.status === 201 || result.status === 200) {
        console.log('✅ 订单创建成功');
        createdOrders.push({
          ...fullOrderData,
          id: result.data?.data?.orderId || result.data?.data?.id
        });
      } else {
        console.log('❌ 订单创建失败:', JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      console.log('❌ 请求失败:', error.message);
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return createdOrders;
}

// 验证统计数据
async function verifyStats() {
  console.log('\n📊 验证数据概览统计...');
  console.log('等待5秒让数据同步...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n💡 现在请手动验证以下内容:');
  console.log('1. 登录管理员后台');
  console.log('2. 查看数据概览页面，应该看到:');
  console.log('   - 待付款确认订单: 1');
  console.log('   - 已付款确认订单: 1');
  console.log('   - 待配置确认订单: 1');
  console.log('   - 已配置确认订单: 1');
  console.log('   - 总订单数: 4');
  console.log('   - 总金额应该 > 0');
  console.log('3. 查看销售管理页面，应该看到测试销售记录和相关订单');
  console.log('4. 测试订单状态更新功能');
}

async function main() {
  try {
    console.log('🧪 开始创建完整测试数据验证统计功能...\n');
    
    // 第1步：创建销售记录
    const salesRecords = await createTestSales();
    console.log(`\n✅ 创建了 ${salesRecords.length} 个销售记录`);
    
    // 第2步：创建订单数据
    const orders = await createTestOrders(salesRecords);
    console.log(`\n✅ 创建了 ${orders.length} 个测试订单`);
    
    // 第3步：验证统计
    await verifyStats();
    
    console.log('\n📋 创建的测试数据总结:');
    console.log('销售记录:');
    salesRecords.forEach((sales, index) => {
      console.log(`   ${index + 1}. ${sales.sales_type} - ${sales.wechat_name} (代码: ${sales.sales_code})`);
    });
    
    console.log('订单记录:');
    orders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.tradingview_username} - ${order.status} - $${order.amount}`);
    });
    
  } catch (error) {
    console.error('❌ 测试数据创建失败:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createTestSales, createTestOrders, verifyStats };