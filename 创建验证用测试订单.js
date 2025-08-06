#!/usr/bin/env node

/**
 * 创建不同状态的测试订单用于验证操作按钮功能
 * 包含：待付款确认、已付款确认、待配置确认、已配置确认等状态
 * 包含：7天免费订单和付费订单
 */

const https = require('https');

const baseUrl = 'https://zhixing-seven.vercel.app';

// 管理员登录获取token
async function getAdminToken() {
  const credentials = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };
  const loginData = JSON.stringify(credentials);
  console.log('   📤 发送登录数据:', credentials);

  const options = {
    hostname: 'zhixing-seven.vercel.app',
    port: 443,
    path: '/api/auth?path=login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData, 'utf8')
    }
  };
  
  console.log('   📏 Content-Length:', Buffer.byteLength(loginData, 'utf8'));
  console.log('   📄 登录数据JSON:', loginData);

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          console.log('   🔍 登录API响应:', data.substring(0, 200));
          const result = JSON.parse(data);
          if (result.success && result.data && result.data.token) {
            resolve(result.data.token);
          } else {
            reject(new Error(`登录失败: ${result.message || '未知错误'}`));
          }
        } catch (e) {
          reject(new Error(`JSON解析错误: ${e.message}, 响应: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// 创建一级销售
async function createPrimarySales() {
  const salesData = JSON.stringify({
    wechat_name: '验证用一级销售',
    payment_method: 'alipay',
    payment_address: '验证用支付宝账号',
    alipay_surname: '验证'
  });

  const options = {
    hostname: 'zhixing-seven.vercel.app',
    port: 443,
    path: '/api/primary-sales?path=create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': salesData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          console.log('   🔍 创建销售API完整响应:', data);
          console.log('   📊 响应状态码:', res.statusCode);
          console.log('   📋 响应头:', res.headers);
          
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP错误: ${res.statusCode}, 响应: ${data}`));
            return;
          }
          
          const result = JSON.parse(data);
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(`创建销售失败: ${result.message || '未知错误'}`));
          }
        } catch (e) {
          reject(new Error(`JSON解析错误: ${e.message}, 响应: ${data.substring(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(salesData);
    req.end();
  });
}

// 创建订单
async function createOrder(salesCode, orderData) {
  const postData = JSON.stringify({
    ...orderData,
    sales_code: salesCode
  });

  const options = {
    hostname: 'zhixing-seven.vercel.app',
    port: 443,
    path: '/api/orders?path=create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 更新订单状态
async function updateOrderStatus(token, orderId, status) {
  const postData = JSON.stringify({ status });

  const options = {
    hostname: 'zhixing-seven.vercel.app',
    port: 443,
    path: `/api/admin?path=update-order-status&orderId=${orderId}`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 主函数
async function main() {
  console.log('🔧 创建验证用测试订单');
  console.log('========================================');
  
  try {
    // 1. 获取管理员token
    console.log('🔐 步骤1: 获取管理员token...');
    const token = await getAdminToken();
    console.log('   ✅ 管理员登录成功');

    // 2. 创建一级销售
    console.log('\n👤 步骤2: 创建验证用一级销售...');
    const salesResult = await createPrimarySales();
    if (!salesResult.success) {
      throw new Error('创建销售失败');
    }
    const salesCode = salesResult.data.sales_code;
    console.log(`   ✅ 一级销售创建成功，sales_code: ${salesCode}`);

    // 3. 创建不同状态的测试订单
    console.log('\n📋 步骤3: 创建不同状态的测试订单...');
    
    const testOrders = [
      {
        name: '7天免费订单-待付款确认',
        data: {
          tradingview_username: '验证用户_7天免费_待付款',
          duration: '7days',
          purchase_type: 'immediate',
          amount: 0,
          payment_method: 'alipay',
          payment_time: new Date().toISOString()
        },
        finalStatus: 'pending_payment',
        expectedButton: '进入配置确认'
      },
      {
        name: '付费订单-待付款确认',
        data: {
          tradingview_username: '验证用户_1月付费_待付款',
          duration: '1month',
          purchase_type: 'immediate',
          amount: 188,
          payment_method: 'alipay',
          alipay_amount: 188,
          payment_time: new Date().toISOString()
        },
        finalStatus: 'pending_payment',
        expectedButton: '确认付款'
      },
      {
        name: '付费订单-已付款确认',
        data: {
          tradingview_username: '验证用户_3月付费_已付款',
          duration: '3months',
          purchase_type: 'immediate',
          amount: 488,
          payment_method: 'alipay',
          alipay_amount: 488,
          payment_time: new Date().toISOString()
        },
        finalStatus: 'confirmed_payment',
        expectedButton: '进入配置确认'
      },
      {
        name: '付费订单-待配置确认',
        data: {
          tradingview_username: '验证用户_6月付费_待配置',
          duration: '6months',
          purchase_type: 'immediate',
          amount: 688,
          payment_method: 'alipay',
          alipay_amount: 688,
          payment_time: new Date().toISOString()
        },
        finalStatus: 'pending_config',
        expectedButton: '确认配置完成'
      },
      {
        name: '付费订单-已配置确认',
        data: {
          tradingview_username: '验证用户_1年付费_已配置',
          duration: '1year',
          purchase_type: 'immediate',
          amount: 1588,
          payment_method: 'alipay',
          alipay_amount: 1588,
          payment_time: new Date().toISOString()
        },
        finalStatus: 'confirmed_configuration',
        expectedButton: '已完成'
      }
    ];

    const createdOrders = [];

    for (let i = 0; i < testOrders.length; i++) {
      const testOrder = testOrders[i];
      console.log(`\n   📝 创建订单 ${i + 1}/5: ${testOrder.name}`);
      
      // 创建订单
      const orderResult = await createOrder(salesCode, testOrder.data);
      if (!orderResult.success) {
        console.log(`   ❌ 创建失败: ${orderResult.message}`);
        continue;
      }
      
      const orderId = orderResult.data.id;
      console.log(`   ✅ 订单创建成功，ID: ${orderId}`);
      
      // 更新到目标状态
      if (testOrder.finalStatus !== 'pending_payment') {
        console.log(`   🔄 更新订单状态到: ${testOrder.finalStatus}`);
        const updateResult = await updateOrderStatus(token, orderId, testOrder.finalStatus);
        if (updateResult.success) {
          console.log(`   ✅ 状态更新成功`);
        } else {
          console.log(`   ⚠️  状态更新失败，但订单已创建`);
        }
      }
      
      createdOrders.push({
        ...testOrder,
        orderId,
        salesCode
      });
      
      // 避免请求太快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 4. 输出验证指南
    console.log('\n========================================');
    console.log('🎯 订单操作按钮验证指南');
    console.log('========================================');
    console.log(`\n📋 验证地址: ${baseUrl}/admin/orders`);
    console.log(`🔑 管理员账户: 知行 / Zhixing Universal Trading Signal`);
    
    console.log('\n📊 创建的测试订单：');
    createdOrders.forEach((order, index) => {
      console.log(`\n${index + 1}. ${order.name}`);
      console.log(`   订单ID: ${order.orderId}`);
      console.log(`   当前状态: ${order.finalStatus}`);
      console.log(`   预期按钮: ${order.expectedButton}`);
      console.log(`   验证用户: ${order.data.tradingview_username}`);
    });

    console.log('\n🔍 验证要点：');
    console.log('1. 7天免费订单的"待付款确认"状态应显示"进入配置确认"按钮');
    console.log('2. 付费订单的"待付款确认"状态应显示"确认付款"按钮');  
    console.log('3. "已付款确认"状态应显示"进入配置确认"按钮');
    console.log('4. "待配置确认"状态应显示"确认配置完成"按钮');
    console.log('5. 所有状态都应该有"拒绝订单"按钮');
    console.log('6. "已配置确认"状态应显示"已完成"');

    console.log('\n🎉 验证用测试订单创建完成！');

  } catch (error) {
    console.error(`❌ 创建过程出错: ${error.message}`);
    process.exit(1);
  }
}

main();