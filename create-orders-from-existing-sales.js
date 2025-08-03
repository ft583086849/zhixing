#!/usr/bin/env node

/**
 * 🎯 基于现有分销商创建订单测试数据
 * 使用已存在的一级和二级分销商创建30个订单
 */

const https = require('https');

const BASE_URL = 'https://zhixing-seven.vercel.app';

// HTTP请求工具
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            json: null
          };
          
          if (body.trim()) {
            try {
              result.json = JSON.parse(body);
            } catch (e) {
              result.text = body;
            }
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function createOrdersFromExistingSales() {
  console.log('🎯 基于现有分销商创建订单测试数据');
  console.log('=' .repeat(60));

  try {
    // 1. 获取现有一级分销商
    console.log('\n📋 1. 获取现有一级分销商数据');
    const primaryOptions = {
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/primary-sales?path=list',
      method: 'GET'
    };

    const primaryResult = await makeRequest(primaryOptions);
    if (!primaryResult.json || !primaryResult.json.success) {
      throw new Error('无法获取一级分销商数据');
    }

    const primarySales = primaryResult.json.data;
    console.log(`✅ 获取到 ${primarySales.length} 个一级分销商`);

    // 2. 获取现有二级分销商（通过primary-sales API无法直接获取，我们需要通过其他方式）
    // 暂时使用一级分销商的数据创建订单

    // 时长和价格选项
    const durationOptions = [
      { value: '1month', label: '1个月', price: 188 },
      { value: '3months', label: '3个月', price: 488 },
      { value: '6months', label: '6个月', price: 688 },
      { value: '1year', label: '1年', price: 1588 }
    ];

    const createdOrders = [];

    // 3. 为每个一级分销商创建3个订单
    console.log('\n📋 2. 为一级分销商创建订单');
    
    for (let i = 0; i < Math.min(primarySales.length, 10); i++) {
      const sales = primarySales[i];
      
      // 从API响应中获取user_sales_code，如果没有则跳过
      if (!sales.user_sales_code) {
        console.log(`⚠️ ${sales.wechat_name} 没有 user_sales_code，跳过`);
        continue;
      }

      // 为每个一级分销商创建3个订单
      for (let j = 1; j <= 3; j++) {
        const orderIndex = i * 3 + j;
        const duration = durationOptions[orderIndex % durationOptions.length];
        const paymentMethod = orderIndex % 2 === 1 ? 'alipay' : 'crypto';

        const orderData = {
          link_code: sales.user_sales_code,
          wechat_name: `test_buyer_${String(orderIndex).padStart(3, '0')}`,
          real_name: `测试买家${orderIndex}`,
          tradingview_username: `test_tv_${String(orderIndex).padStart(3, '0')}`,
          phone: `138${String(10000000 + orderIndex).substring(1)}`,
          duration: duration.value,
          amount: duration.price,
          payment_method: paymentMethod,
          payment_time: new Date().toISOString()
        };

        console.log(`\n创建订单 ${orderIndex}: ${orderData.real_name}`);
        console.log(`   销售商: ${sales.wechat_name} (${sales.user_sales_code})`);
        console.log(`   金额: ${orderData.amount}元`);

        const orderOptions = {
          hostname: 'zhixing-seven.vercel.app',
          path: '/api/orders?path=create',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const result = await makeRequest(orderOptions, orderData);

        if (result.json && result.json.success) {
          createdOrders.push({
            ...result.json.data,
            sales_wechat: sales.wechat_name,
            order_amount: orderData.amount
          });
          console.log(`✅ 订单创建成功: ${orderData.real_name} - ${orderData.amount}元`);
        } else {
          console.log(`❌ 订单创建失败: ${result.json?.message || 'Unknown error'}`);
          console.log('Response:', result.json || result.text);
        }

        // 等待500ms避免频率限制
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 4. 汇总报告
    console.log('\n' + '=' .repeat(60));
    console.log('📊 订单创建完成汇总');
    console.log('=' .repeat(60));

    console.log(`\n🛒 创建的订单 (${createdOrders.length}个):`);
    let totalAmount = 0;
    createdOrders.forEach((order, index) => {
      totalAmount += order.order_amount;
      console.log(`  ${index + 1}. ${order.real_name || order.wechat_name}: ${order.order_amount}元 (${order.sales_wechat})`);
    });

    console.log(`\n💰 佣金统计:`);
    console.log(`  总订单金额: ${totalAmount}元`);
    console.log(`  一级分销商佣金 (40%): ${(totalAmount * 0.4).toFixed(2)}元`);

    return {
      success: true,
      data: {
        primarySalesCount: primarySales.length,
        createdOrdersCount: createdOrders.length,
        totalAmount: totalAmount
      }
    };

  } catch (error) {
    console.error('❌ 创建订单过程中出错:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 主执行函数
if (require.main === module) {
  createOrdersFromExistingSales()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 订单创建完成!');
        console.log(`📊 统计: ${result.data.createdOrdersCount}个订单, 总金额: ${result.data.totalAmount}元`);
      } else {
        console.log('\n❌ 订单创建失败:', result.error);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('脚本执行出错:', error);
      process.exit(1);
    });
}

module.exports = { createOrdersFromExistingSales };