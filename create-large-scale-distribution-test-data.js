#!/usr/bin/env node

/**
 * 🎯 大规模分销体系测试数据创建脚本
 * 
 * 测试数据规模：
 * - 10个一级分销商
 * - 30个二级分销商 (每个一级分销商下挂3个)
 * - 10个通过一级分销商链接的用户订单
 * - 10个通过二级分销商链接的用户订单
 * - 10个通过二级分销商注册用户的订单
 * 
 * 要求：全部有效数据，无0数据
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

// 生成测试数据模板
function generateTestData() {
  const data = {
    primarySales: [],
    secondarySales: [],
    userOrders: []
  };
  
  // 生成10个一级分销商
  for (let i = 1; i <= 10; i++) {
    const paymentMethod = i % 2 === 1 ? 'alipay' : 'crypto';
    const primarySales = {
      wechat_name: `primary_sales_${String(i).padStart(3, '0')}`,
      payment_method: paymentMethod,
      payment_address: paymentMethod === 'alipay' ? 
        `primary${String(i).padStart(3, '0')}@example.com` : 
        `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj${i}`,
      alipay_surname: paymentMethod === 'alipay' ? `张${i}` : null,
      chain_name: paymentMethod === 'crypto' ? 'TRC20' : null
    };
    data.primarySales.push(primarySales);
    
    // 每个一级分销商下生成3个二级分销商
    for (let j = 1; j <= 3; j++) {
      const secondaryIndex = (i - 1) * 3 + j;
      const secondaryPaymentMethod = j % 2 === 1 ? 'alipay' : 'crypto';
      const secondarySales = {
        wechat_name: `secondary_sales_${String(secondaryIndex).padStart(3, '0')}`,
        payment_method: secondaryPaymentMethod,
        payment_address: secondaryPaymentMethod === 'alipay' ? 
          `secondary${String(secondaryIndex).padStart(3, '0')}@example.com` : 
          `TLsV52sRDL79HXGKw96nCFHRDJ98tnkq${secondaryIndex}`,
        alipay_surname: secondaryPaymentMethod === 'alipay' ? `王${secondaryIndex}` : null,
        chain_name: secondaryPaymentMethod === 'crypto' ? 'TRC20' : null,
        primaryIndex: i - 1 // 关联到对应的一级分销商
      };
      data.secondarySales.push(secondarySales);
    }
  }
  
  // 时长和价格选项
  const durationOptions = [
    { value: '1month', label: '1个月', price: 188 },
    { value: '3months', label: '3个月', price: 488 },
    { value: '6months', label: '6个月', price: 688 },
    { value: '1year', label: '1年', price: 1588 }
  ];
  
  // 生成10个通过一级分销商链接的用户订单
  for (let i = 1; i <= 10; i++) {
    const duration = durationOptions[i % durationOptions.length];
    const paymentMethod = i % 2 === 1 ? 'alipay' : 'crypto';
    const primaryIndex = (i - 1) % 10; // 分布到不同的一级分销商
    
    const order = {
      wechat_name: `primary_user_${String(i).padStart(3, '0')}`,
      real_name: `一级用户${i}`,
      tradingview_username: `primary_tv_user_${String(i).padStart(3, '0')}`,
      phone: `138${String(10000000 + i).substring(1)}`,
      duration: duration.value,
      amount: duration.price,
      payment_method: paymentMethod,
      salesType: 'primary',
      salesIndex: primaryIndex,
      description: `通过一级分销商 primary_sales_${String(primaryIndex + 1).padStart(3, '0')} 链接购买`
    };
    data.userOrders.push(order);
  }
  
  // 生成10个通过二级分销商链接的用户订单
  for (let i = 1; i <= 10; i++) {
    const duration = durationOptions[i % durationOptions.length];
    const paymentMethod = i % 2 === 0 ? 'alipay' : 'crypto'; // 与一级订单相反
    const secondaryIndex = (i - 1) % 30; // 分布到不同的二级分销商
    
    const order = {
      wechat_name: `secondary_user_${String(i).padStart(3, '0')}`,
      real_name: `二级用户${i}`,
      tradingview_username: `secondary_tv_user_${String(i).padStart(3, '0')}`,
      phone: `139${String(10000000 + i).substring(1)}`,
      duration: duration.value,
      amount: duration.price,
      payment_method: paymentMethod,
      salesType: 'secondary',
      salesIndex: secondaryIndex,
      description: `通过二级分销商 secondary_sales_${String(secondaryIndex + 1).padStart(3, '0')} 链接购买`
    };
    data.userOrders.push(order);
  }
  
  // 生成10个通过二级分销商注册用户的订单 (可能是指额外的订单？)
  for (let i = 1; i <= 10; i++) {
    const duration = durationOptions[i % durationOptions.length];
    const paymentMethod = i % 3 === 0 ? 'alipay' : 'crypto'; // 不同的分布
    const secondaryIndex = (i + 14) % 30; // 分布到不同的二级分销商，避免重复
    
    const order = {
      wechat_name: `registered_user_${String(i).padStart(3, '0')}`,
      real_name: `注册用户${i}`,
      tradingview_username: `registered_tv_user_${String(i).padStart(3, '0')}`,
      phone: `137${String(10000000 + i).substring(1)}`,
      duration: duration.value,
      amount: duration.price,
      payment_method: paymentMethod,
      salesType: 'secondary',
      salesIndex: secondaryIndex,
      description: `通过二级分销商注册用户 secondary_sales_${String(secondaryIndex + 1).padStart(3, '0')} 的额外订单`
    };
    data.userOrders.push(order);
  }
  
  return data;
}

// 存储创建的数据
const createdData = {
  primarySales: [],
  secondarySales: [],
  userOrders: []
};

async function createLargeScaleDistributionTestData() {
  console.log('🎯 开始创建大规模分销体系测试数据');
  console.log('📊 数据规模: 10个一级分销商 + 30个二级分销商 + 30个用户订单');
  console.log('=' .repeat(70));

  const testData = generateTestData();

  try {
    // 1. 创建10个一级分销商
    console.log('\n📋 1. 创建10个一级分销商');
    for (let i = 0; i < testData.primarySales.length; i++) {
      const salesData = testData.primarySales[i];
      
      console.log(`\n创建一级分销商 ${i + 1}/10: ${salesData.wechat_name}`);
      
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
        console.log('Response:', result.json || result.text);
      }
      
      // 等待500ms避免频率限制
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 2. 创建30个二级分销商 (每个一级分销商下3个)
    console.log('\n📋 2. 创建30个二级分销商 (每个一级分销商下3个)');
    
    if (createdData.primarySales.length > 0) {
      for (let i = 0; i < testData.secondarySales.length; i++) {
        const secondaryData = testData.secondarySales[i];
        const primaryIndex = secondaryData.primaryIndex;
        
        if (primaryIndex < createdData.primarySales.length) {
          const primaryData = createdData.primarySales[primaryIndex];
          const registrationCode = primaryData.secondary_registration_code;
          
          console.log(`\n创建二级分销商 ${i + 1}/30: ${secondaryData.wechat_name}`);
          console.log(`   推荐人: ${primaryData.wechat_name}`);
          
          const options = {
            hostname: 'zhixing-seven.vercel.app',
            path: `/api/secondary-sales?path=register`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          };

          const requestData = {
            wechat_name: secondaryData.wechat_name,
            primary_sales_id: primaryData.primary_sales_id,
            payment_method: secondaryData.payment_method,
            payment_address: secondaryData.payment_address,
            alipay_surname: secondaryData.alipay_surname,
            chain_name: secondaryData.chain_name,
            registration_code: registrationCode
          };

          const result = await makeRequest(options, requestData);
          
          if (result.json && result.json.success) {
            createdData.secondarySales.push({
              ...result.json.data,
              primary_sales_wechat: primaryData.wechat_name
            });
            console.log(`✅ 创建成功: ${result.json.data.wechat_name}`);
            console.log(`   用户销售代码: ${result.json.data.user_sales_code}`);
          } else {
            console.log(`❌ 创建失败: ${result.json?.message || 'Unknown error'}`);
            console.log('Request data:', requestData);
            console.log('Response:', result.json || result.text);
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // 3. 创建30个用户订单
    console.log('\n📋 3. 创建30个用户订单 (10个一级 + 10个二级 + 10个注册)');
    
    for (let i = 0; i < testData.userOrders.length; i++) {
      const orderData = { ...testData.userOrders[i] };
      const { salesType, salesIndex } = orderData;
      
      let salesData;
      let linkCode;
      
      if (salesType === 'primary' && salesIndex < createdData.primarySales.length) {
        salesData = createdData.primarySales[salesIndex];
        linkCode = salesData.user_sales_code;
      } else if (salesType === 'secondary' && salesIndex < createdData.secondarySales.length) {
        salesData = createdData.secondarySales[salesIndex];
        linkCode = salesData.user_sales_code;
      }
      
      if (salesData && linkCode) {
        // 清理订单数据
        delete orderData.salesType;
        delete orderData.salesIndex;
        delete orderData.description;
        
        orderData.link_code = linkCode;
        orderData.payment_time = new Date().toISOString();
        
        console.log(`\n创建用户订单 ${i + 1}/30: ${orderData.real_name}`);
        console.log(`   销售链接: ${linkCode} (${salesData.wechat_name})`);
        console.log(`   订单金额: ${orderData.amount}元`);
        
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
            sales_type: salesType,
            sales_wechat: salesData.wechat_name,
            order_amount: orderData.amount
          });
          console.log(`✅ 订单创建成功: ${orderData.real_name} - ${orderData.amount}元`);
        } else {
          console.log(`❌ 订单创建失败: ${result.json?.message || 'Unknown error'}`);
          console.log('Request data:', orderData);
          console.log('Response:', result.json || result.text);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`⚠️ 跳过订单 ${i + 1}: 找不到对应的销售数据`);
      }
    }

    // 4. 数据汇总报告
    console.log('\n' + '=' .repeat(70));
    console.log('📊 大规模分销体系测试数据创建完成汇总');
    console.log('=' .repeat(70));
    
    console.log(`\n📈 一级分销商数据 (${createdData.primarySales.length}/10):`);
    createdData.primarySales.forEach((sales, index) => {
      console.log(`  ${index + 1}. ${sales.wechat_name} (${sales.payment_method})`);
    });
    
    console.log(`\n👥 二级分销商数据 (${createdData.secondarySales.length}/30):`);
    const secondaryByPrimary = {};
    createdData.secondarySales.forEach(secondary => {
      const primary = secondary.primary_sales_wechat;
      if (!secondaryByPrimary[primary]) secondaryByPrimary[primary] = [];
      secondaryByPrimary[primary].push(secondary.wechat_name);
    });
    
    Object.entries(secondaryByPrimary).forEach(([primary, secondaries]) => {
      console.log(`  ${primary}: ${secondaries.length}个二级分销商`);
      secondaries.forEach(secondary => {
        console.log(`    - ${secondary}`);
      });
    });
    
    console.log(`\n🛒 用户订单数据 (${createdData.userOrders.length}/30):`);
    const ordersByType = {
      primary: createdData.userOrders.filter(o => o.sales_type === 'primary'),
      secondary: createdData.userOrders.filter(o => o.sales_type === 'secondary')
    };
    
    console.log(`  一级分销商订单: ${ordersByType.primary.length}个`);
    ordersByType.primary.forEach(order => {
      console.log(`    - ${order.real_name || order.wechat_name}: ${order.order_amount}元 (${order.sales_wechat})`);
    });
    
    console.log(`  二级分销商订单: ${ordersByType.secondary.length}个`);
    ordersByType.secondary.forEach(order => {
      console.log(`    - ${order.real_name || order.wechat_name}: ${order.order_amount}元 (${order.sales_wechat})`);
    });
    
    // 5. 佣金计算
    const totalAmount = createdData.userOrders.reduce((sum, order) => sum + order.order_amount, 0);
    const primaryAmount = ordersByType.primary.reduce((sum, order) => sum + order.order_amount, 0);
    const secondaryAmount = ordersByType.secondary.reduce((sum, order) => sum + order.order_amount, 0);
    
    console.log(`\n💰 佣金分配统计:`);
    console.log(`  总订单金额: ${totalAmount}元`);
    console.log(`  一级分销商直接订单: ${primaryAmount}元 (佣金: ${(primaryAmount * 0.4).toFixed(2)}元)`);
    console.log(`  二级分销商订单: ${secondaryAmount}元`);
    console.log(`    - 二级分销商佣金 (30%): ${(secondaryAmount * 0.3).toFixed(2)}元`);
    console.log(`    - 一级分销商间接佣金 (10%): ${(secondaryAmount * 0.1).toFixed(2)}元`);
    console.log(`  总佣金: ${(primaryAmount * 0.4 + secondaryAmount * 0.4).toFixed(2)}元`);

    return {
      success: true,
      data: createdData,
      summary: {
        primarySalesCount: createdData.primarySales.length,
        secondarySalesCount: createdData.secondarySales.length,
        userOrdersCount: createdData.userOrders.length,
        totalAmount: totalAmount,
        estimatedTotalCommission: primaryAmount * 0.4 + secondaryAmount * 0.4
      }
    };

  } catch (error) {
    console.error('❌ 测试数据创建过程中出错:', error);
    return {
      success: false,
      error: error.message,
      data: createdData
    };
  }
}

// 主执行函数
if (require.main === module) {
  createLargeScaleDistributionTestData()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 大规模分销体系测试数据创建完成!');
        console.log(`📊 创建统计: ${result.summary.primarySalesCount}个一级分销商, ${result.summary.secondarySalesCount}个二级分销商, ${result.summary.userOrdersCount}个订单`);
        console.log(`💰 总金额: ${result.summary.totalAmount}元, 总佣金: ${result.summary.estimatedTotalCommission.toFixed(2)}元`);
        console.log('现在可以测试前端功能和数据展示了。');
      } else {
        console.log('\n❌ 测试数据创建失败:', result.error);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('脚本执行出错:', error);
      process.exit(1);
    });
}

module.exports = { createLargeScaleDistributionTestData };