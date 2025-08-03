#!/usr/bin/env node

/**
 * 🎯 创建全新的完整测试数据
 * 10个一级分销商 + 30个二级分销商 + 30个订单
 * 使用全新的微信号避免重复问题
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

// 生成唯一微信号
function generateWechatName(prefix, index) {
  const timestamp = Date.now();
  return `${prefix}_${String(index).padStart(3, '0')}_${timestamp}`;
}

async function createFreshCompleteTestData() {
  console.log('🎯 创建全新的完整测试数据');
  console.log('📊 目标: 10个一级分销商 + 30个二级分销商 + 30个订单');
  console.log('=' .repeat(70));

  const timestamp = Date.now();
  const createdData = {
    primarySales: [],
    secondarySales: [],
    userOrders: []
  };

  try {
    // 1. 创建10个一级分销商
    console.log('\n📋 1. 创建10个全新一级分销商');
    
    for (let i = 1; i <= 10; i++) {
      const paymentMethod = i % 2 === 1 ? 'alipay' : 'crypto';
      const salesData = {
        wechat_name: generateWechatName('fresh_primary', i),
        payment_method: paymentMethod,
        payment_address: paymentMethod === 'alipay' ? 
          `fresh${i}@example.com` : 
          `TFresh${i}${timestamp.toString().slice(-8)}`,
        alipay_surname: paymentMethod === 'alipay' ? `主销${i}` : null,
        chain_name: paymentMethod === 'crypto' ? 'TRC20' : null
      };

      console.log(`\n创建一级分销商 ${i}/10: ${salesData.wechat_name}`);
      
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        path: '/api/primary-sales?path=create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const result = await makeRequest(options, salesData);
      
      if (result.json && result.json.success) {
        createdData.primarySales.push(result.json.data);
        console.log(`✅ 创建成功: ${result.json.data.wechat_name}`);
        console.log(`   用户销售代码: ${result.json.data.user_sales_code}`);
        console.log(`   二级注册代码: ${result.json.data.secondary_registration_code}`);
      } else {
        console.log(`❌ 创建失败: ${result.json?.message || 'Unknown error'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`\n✅ 一级分销商创建完成: ${createdData.primarySales.length}/10`);

    // 2. 为每个一级分销商创建3个二级分销商
    console.log('\n📋 2. 创建30个二级分销商 (每个一级下3个)');
    
    for (let i = 0; i < createdData.primarySales.length; i++) {
      const primaryData = createdData.primarySales[i];
      
      for (let j = 1; j <= 3; j++) {
        const secondaryIndex = i * 3 + j;
        const paymentMethod = j % 2 === 1 ? 'alipay' : 'crypto';
        
        const secondaryData = {
          wechat_name: generateWechatName('fresh_secondary', secondaryIndex),
          primary_sales_id: primaryData.primary_sales_id,
          payment_method: paymentMethod,
          payment_address: paymentMethod === 'alipay' ? 
            `secondary${secondaryIndex}@example.com` : 
            `TSecond${secondaryIndex}${timestamp.toString().slice(-6)}`,
          alipay_surname: paymentMethod === 'alipay' ? `二销${secondaryIndex}` : null,
          chain_name: paymentMethod === 'crypto' ? 'TRC20' : null,
          registration_code: primaryData.secondary_registration_code
        };

        console.log(`\n创建二级分销商 ${secondaryIndex}/30: ${secondaryData.wechat_name}`);
        console.log(`   推荐人: ${primaryData.wechat_name}`);
        
        const options = {
          hostname: 'zhixing-seven.vercel.app',
          path: '/api/secondary-sales?path=register',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const result = await makeRequest(options, secondaryData);
        
        if (result.json && result.json.success) {
          createdData.secondarySales.push({
            ...result.json.data,
            primary_sales_wechat: primaryData.wechat_name
          });
          console.log(`✅ 创建成功: ${result.json.data.wechat_name}`);
          console.log(`   用户销售代码: ${result.json.data.user_sales_code}`);
        } else {
          console.log(`❌ 创建失败: ${result.json?.message || 'Unknown error'}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`\n✅ 二级分销商创建完成: ${createdData.secondarySales.length}/30`);

    // 3. 创建30个订单 (10个一级 + 20个二级)
    console.log('\n📋 3. 创建30个用户订单');
    
    const durationOptions = [
      { value: '1month', label: '1个月', price: 188 },
      { value: '3months', label: '3个月', price: 488 },
      { value: '6months', label: '6个月', price: 688 },
      { value: '1year', label: '1年', price: 1588 }
    ];

    // 3.1 为一级分销商创建10个订单
    for (let i = 0; i < Math.min(10, createdData.primarySales.length); i++) {
      const salesData = createdData.primarySales[i];
      const duration = durationOptions[i % durationOptions.length];
      const paymentMethod = i % 2 === 1 ? 'alipay' : 'crypto';

      const orderData = {
        link_code: salesData.user_sales_code,
        wechat_name: generateWechatName('primary_buyer', i + 1),
        real_name: `一级买家${i + 1}`,
        tradingview_username: generateWechatName('primary_tv', i + 1),
        phone: `138${String(10000000 + i + 1).substring(1)}`,
        duration: duration.value,
        amount: duration.price,
        payment_method: paymentMethod,
        payment_time: new Date().toISOString()
      };

      console.log(`\n创建一级订单 ${i + 1}/10: ${orderData.real_name}`);
      console.log(`   销售商: ${salesData.wechat_name} (${salesData.user_sales_code})`);
      console.log(`   金额: ${orderData.amount}元`);

      const options = {
        hostname: 'zhixing-seven.vercel.app',
        path: '/api/orders?path=create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const result = await makeRequest(options, orderData);
      
      if (result.json && result.json.success) {
        createdData.userOrders.push({
          ...result.json.data,
          sales_type: 'primary',
          sales_wechat: salesData.wechat_name,
          order_amount: orderData.amount
        });
        console.log(`✅ 订单创建成功: ${orderData.real_name} - ${orderData.amount}元`);
      } else {
        console.log(`❌ 订单创建失败: ${result.json?.message || 'Unknown error'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // 3.2 为二级分销商创建20个订单
    for (let i = 0; i < Math.min(20, createdData.secondarySales.length); i++) {
      const salesData = createdData.secondarySales[i];
      const duration = durationOptions[i % durationOptions.length];
      const paymentMethod = i % 2 === 0 ? 'alipay' : 'crypto';

      const orderData = {
        link_code: salesData.user_sales_code,
        wechat_name: generateWechatName('secondary_buyer', i + 1),
        real_name: `二级买家${i + 1}`,
        tradingview_username: generateWechatName('secondary_tv', i + 1),
        phone: `139${String(10000000 + i + 1).substring(1)}`,
        duration: duration.value,
        amount: duration.price,
        payment_method: paymentMethod,
        payment_time: new Date().toISOString()
      };

      console.log(`\n创建二级订单 ${i + 1}/20: ${orderData.real_name}`);
      console.log(`   销售商: ${salesData.wechat_name} (${salesData.user_sales_code})`);
      console.log(`   金额: ${orderData.amount}元`);

      const options = {
        hostname: 'zhixing-seven.vercel.app',
        path: '/api/orders?path=create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const result = await makeRequest(options, orderData);
      
      if (result.json && result.json.success) {
        createdData.userOrders.push({
          ...result.json.data,
          sales_type: 'secondary',
          sales_wechat: salesData.wechat_name,
          order_amount: orderData.amount
        });
        console.log(`✅ 订单创建成功: ${orderData.real_name} - ${orderData.amount}元`);
      } else {
        console.log(`❌ 订单创建失败: ${result.json?.message || 'Unknown error'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // 4. 汇总报告
    console.log('\n' + '=' .repeat(70));
    console.log('📊 全新完整测试数据创建汇总');
    console.log('=' .repeat(70));
    
    console.log(`\n📈 一级分销商 (${createdData.primarySales.length}/10):`);
    createdData.primarySales.forEach((sales, index) => {
      console.log(`  ${index + 1}. ${sales.wechat_name} (${sales.payment_method})`);
    });
    
    console.log(`\n👥 二级分销商 (${createdData.secondarySales.length}/30):`);
    const secondaryByPrimary = {};
    createdData.secondarySales.forEach(secondary => {
      const primary = secondary.primary_sales_wechat;
      if (!secondaryByPrimary[primary]) secondaryByPrimary[primary] = [];
      secondaryByPrimary[primary].push(secondary.wechat_name);
    });
    
    Object.entries(secondaryByPrimary).forEach(([primary, secondaries]) => {
      console.log(`  ${primary}: ${secondaries.length}个二级分销商`);
    });
    
    const primaryOrders = createdData.userOrders.filter(o => o.sales_type === 'primary');
    const secondaryOrders = createdData.userOrders.filter(o => o.sales_type === 'secondary');
    
    console.log(`\n🛒 用户订单 (${createdData.userOrders.length}/30):`);
    console.log(`  一级分销商订单: ${primaryOrders.length}个`);
    console.log(`  二级分销商订单: ${secondaryOrders.length}个`);
    
    const totalAmount = createdData.userOrders.reduce((sum, order) => sum + order.order_amount, 0);
    const primaryAmount = primaryOrders.reduce((sum, order) => sum + order.order_amount, 0);
    const secondaryAmount = secondaryOrders.reduce((sum, order) => sum + order.order_amount, 0);
    
    console.log(`\n💰 佣金统计:`);
    console.log(`  总订单金额: ${totalAmount}元`);
    console.log(`  一级分销商直接佣金 (40%): ${(primaryAmount * 0.4).toFixed(2)}元`);
    console.log(`  二级分销商佣金 (30%): ${(secondaryAmount * 0.3).toFixed(2)}元`);
    console.log(`  一级分销商间接佣金 (10%): ${(secondaryAmount * 0.1).toFixed(2)}元`);
    console.log(`  总佣金: ${(primaryAmount * 0.4 + secondaryAmount * 0.4).toFixed(2)}元`);

    return {
      success: true,
      data: createdData,
      summary: {
        primarySalesCount: createdData.primarySales.length,
        secondarySalesCount: createdData.secondarySales.length,
        userOrdersCount: createdData.userOrders.length,
        totalAmount: totalAmount
      }
    };

  } catch (error) {
    console.error('❌ 创建过程中出错:', error);
    return {
      success: false,
      error: error.message,
      data: createdData
    };
  }
}

// 主执行函数
if (require.main === module) {
  createFreshCompleteTestData()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 全新完整测试数据创建成功!');
        console.log(`📊 最终统计: ${result.summary.primarySalesCount}个一级分销商, ${result.summary.secondarySalesCount}个二级分销商, ${result.summary.userOrdersCount}个订单`);
        console.log(`💰 总金额: ${result.summary.totalAmount}元`);
        console.log('\n🚀 现在可以测试前端功能了!');
      } else {
        console.log('\n❌ 创建失败:', result.error);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('脚本执行出错:', error);
      process.exit(1);
    });
}

module.exports = { createFreshCompleteTestData };