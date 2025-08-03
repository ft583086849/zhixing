#!/usr/bin/env node

/**
 * 🎯 完整分销体系测试数据创建脚本
 * 
 * 测试场景：
 * 1. 创建一级分销商数据
 * 2. 一级分销商推荐二级分销商数据
 * 3. 一级分销商下直接产生的用户购买数据
 * 4. 二级分销商下产生的用户购买数据
 * 5. 验证分销关系和佣金计算
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

// 生成测试数据
const testData = {
  // 一级分销商数据
  primarySales: [
    {
      wechat_name: 'primary_sales_001',
      payment_method: 'alipay',
      payment_address: 'primary001@example.com',
      alipay_surname: '张三'
    },
    {
      wechat_name: 'primary_sales_002', 
      payment_method: 'crypto',
      payment_address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      chain_name: 'TRC20'
    }
  ],
  
  // 二级分销商数据（通过一级分销商的链接注册）
  secondarySales: [
    {
      wechat_name: 'secondary_sales_001',
      payment_method: 'alipay',
      payment_address: 'secondary001@example.com',
      alipay_surname: '王五'
    },
    {
      wechat_name: 'secondary_sales_002',
      payment_method: 'crypto',
      payment_address: 'TLsV52sRDL79HXGKw96nCFHRDJ98tnkqaA',
      chain_name: 'TRC20'
    },
    {
      wechat_name: 'secondary_sales_003',
      payment_method: 'alipay',
      payment_address: 'secondary003@example.com',
      alipay_surname: '赵六'
    }
  ],
  
  // 用户购买数据
  userOrders: [
    // 一级分销商直接推荐的用户订单
    {
      link_code: null, // 一级分销商的用户销售链接
      wechat_name: 'user_001',
      real_name: '李四',
      tradingview_username: 'user001_tv',
      phone: '13800000001',
      duration: '1month',
      amount: 188,
      payment_method: 'alipay'
    },
    {
      link_code: null, // 一级分销商的用户销售链接
      wechat_name: 'user_002', 
      real_name: '王五',
      tradingview_username: 'user002_tv',
      phone: '13800000002',
      duration: '3months',
      amount: 488,
      payment_method: 'crypto'
    },
    
    // 二级分销商推荐的用户订单
    {
      link_code: null, // 二级分销商的用户销售链接
      wechat_name: 'user_003',
      real_name: '赵六',
      tradingview_username: 'user003_tv', 
      phone: '13800000003',
      duration: '6months',
      amount: 688,
      payment_method: 'alipay'
    },
    {
      link_code: null, // 二级分销商的用户销售链接
      wechat_name: 'user_004',
      real_name: '钱七',
      tradingview_username: 'user004_tv',
      phone: '13800000004', 
      duration: '1year',
      amount: 1588,
      payment_method: 'crypto'
    }
  ]
};

// 存储创建的数据
const createdData = {
  primarySales: [],
  secondarySales: [],
  userOrders: []
};

async function createCompletedistributionTestData() {
  console.log('🎯 开始创建完整分销体系测试数据');
  console.log('=' .repeat(60));

  try {
    // 1. 创建一级分销商
    console.log('\n📋 1. 创建一级分销商数据');
    for (let i = 0; i < testData.primarySales.length; i++) {
      const salesData = testData.primarySales[i];
      
      console.log(`\n创建一级分销商 ${i + 1}: ${salesData.wechat_name}`);
      
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
        console.log(`✅ 一级分销商创建成功:`);
        console.log(`  - 微信号: ${result.json.data.wechat_name}`);
        console.log(`  - 用户销售链接: ${result.json.data.user_sales_link}`);
        console.log(`  - 二级分销商注册链接: ${result.json.data.secondary_registration_link}`);
        console.log(`  - 用户销售代码: ${result.json.data.user_sales_code}`);
        console.log(`  - 二级分销商注册代码: ${result.json.data.secondary_registration_code}`);
      } else {
        console.log(`❌ 一级分销商创建失败: ${result.json?.message || 'Unknown error'}`);
        console.log('Response:', result.json || result.text);
      }
      
      // 等待1秒避免重复
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 2. 通过一级分销商的链接创建二级分销商
    console.log('\n📋 2. 通过一级分销商推荐创建二级分销商');
    
    if (createdData.primarySales.length > 0) {
      // 前两个二级分销商由第一个一级分销商推荐
      // 第三个二级分销商由第二个一级分销商推荐
      const distributionPlan = [
        { secondaryIndex: 0, primaryIndex: 0 }, // secondary_001 由 primary_001 推荐
        { secondaryIndex: 1, primaryIndex: 0 }, // secondary_002 由 primary_001 推荐  
        { secondaryIndex: 2, primaryIndex: 1 }  // secondary_003 由 primary_002 推荐
      ];
      
      for (const plan of distributionPlan) {
        const { secondaryIndex, primaryIndex } = plan;
        
        if (secondaryIndex < testData.secondarySales.length && 
            primaryIndex < createdData.primarySales.length) {
          
          const secondaryData = testData.secondarySales[secondaryIndex];
          const primaryData = createdData.primarySales[primaryIndex];
          const registrationCode = primaryData.secondary_registration_code;
          
          console.log(`\n创建二级分销商: ${secondaryData.wechat_name} (由 ${primaryData.wechat_name} 推荐)`);
          
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
            alipay_surname: secondaryData.alipay_surname || null,
            chain_name: secondaryData.chain_name || null,
            registration_code: registrationCode
          };

          const result = await makeRequest(options, requestData);
          
          if (result.json && result.json.success) {
            createdData.secondarySales.push({
              ...result.json.data,
              primary_sales_wechat: primaryData.wechat_name
            });
            console.log(`✅ 二级分销商创建成功:`);
            console.log(`  - 微信号: ${result.json.data.wechat_name}`);
            console.log(`  - 推荐人: ${primaryData.wechat_name}`);
            console.log(`  - 用户销售链接: ${result.json.data.user_sales_link}`);
            console.log(`  - 用户销售代码: ${result.json.data.user_sales_code}`);
          } else {
            console.log(`❌ 二级分销商创建失败: ${result.json?.message || 'Unknown error'}`);
            console.log('Response:', result.json || result.text);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // 3. 创建用户订单数据
    console.log('\n📋 3. 创建用户购买订单数据');
    
    // 准备订单数据
    const orderPlans = [
      // 一级分销商直接推荐的订单
      { 
        orderIndex: 0, 
        salesType: 'primary', 
        salesIndex: 0,
        description: '一级分销商 primary_001 直接推荐'
      },
      { 
        orderIndex: 1, 
        salesType: 'primary', 
        salesIndex: 1,
        description: '一级分销商 primary_002 直接推荐'
      },
      
      // 二级分销商推荐的订单  
      { 
        orderIndex: 2, 
        salesType: 'secondary', 
        salesIndex: 0,
        description: '二级分销商 secondary_001 推荐 (primary_001下级)'
      },
      { 
        orderIndex: 3, 
        salesType: 'secondary', 
        salesIndex: 1,
        description: '二级分销商 secondary_002 推荐 (primary_001下级)'
      }
    ];
    
    for (const plan of orderPlans) {
      const { orderIndex, salesType, salesIndex, description } = plan;
      
      if (orderIndex < testData.userOrders.length) {
        const orderData = { ...testData.userOrders[orderIndex] };
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
          orderData.link_code = linkCode;
          orderData.payment_time = new Date().toISOString();
          
          console.log(`\n创建用户订单: ${orderData.real_name} (${description})`);
          console.log(`  - 销售链接代码: ${linkCode}`);
          console.log(`  - 订单金额: ${orderData.amount}元`);
          
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
              description: description
            });
            console.log(`✅ 用户订单创建成功:`);
            console.log(`  - 订单ID: ${result.json.data.order_id || result.json.data.id}`);
            console.log(`  - 用户: ${orderData.real_name}`);
            console.log(`  - 金额: ${orderData.amount}元`);
          } else {
            console.log(`❌ 用户订单创建失败: ${result.json?.message || 'Unknown error'}`);
            console.log('Request data:', orderData);
            console.log('Response:', result.json || result.text);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`⚠️ 跳过订单 ${orderIndex}: 找不到对应的销售数据`);
        }
      }
    }

    // 4. 数据汇总报告
    console.log('\n' + '=' .repeat(60));
    console.log('📊 分销体系测试数据创建完成汇总');
    console.log('=' .repeat(60));
    
    console.log(`\n📈 一级分销商数据 (${createdData.primarySales.length}个):`);
    createdData.primarySales.forEach((sales, index) => {
      console.log(`  ${index + 1}. ${sales.wechat_name}`);
      console.log(`     - 用户销售代码: ${sales.user_sales_code}`);
      console.log(`     - 二级分销商注册代码: ${sales.secondary_registration_code}`);
    });
    
    console.log(`\n👥 二级分销商数据 (${createdData.secondarySales.length}个):`);
    createdData.secondarySales.forEach((sales, index) => {
      console.log(`  ${index + 1}. ${sales.wechat_name} (推荐人: ${sales.primary_sales_wechat})`);
      console.log(`     - 用户销售代码: ${sales.user_sales_code}`);
    });
    
    console.log(`\n🛒 用户订单数据 (${createdData.userOrders.length}个):`);
    createdData.userOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.real_name || order.wechat_name} - ${order.amount}元`);
      console.log(`     - ${order.description}`);
      console.log(`     - 销售人员: ${order.sales_wechat}`);
    });
    
    // 5. 分销关系验证
    console.log(`\n🔗 分销关系验证:`);
    const primaryDirectOrders = createdData.userOrders.filter(order => order.sales_type === 'primary');
    const secondaryOrders = createdData.userOrders.filter(order => order.sales_type === 'secondary');
    
    console.log(`  - 一级分销商直接订单: ${primaryDirectOrders.length}个`);
    console.log(`  - 二级分销商订单: ${secondaryOrders.length}个`);
    
    const totalAmount = createdData.userOrders.reduce((sum, order) => sum + order.amount, 0);
    console.log(`  - 总订单金额: ${totalAmount}元`);
    
    // 估算佣金
    const primaryDirectCommission = primaryDirectOrders.reduce((sum, order) => sum + (order.amount * 0.4), 0);
    const secondaryCommissionToSecondary = secondaryOrders.reduce((sum, order) => sum + (order.amount * 0.3), 0);
    const secondaryCommissionToPrimary = secondaryOrders.reduce((sum, order) => sum + (order.amount * 0.1), 0);
    
    console.log(`\n💰 预估佣金分配:`);
    console.log(`  - 一级分销商直接佣金: ${primaryDirectCommission}元`);
    console.log(`  - 二级分销商佣金: ${secondaryCommissionToSecondary}元`);
    console.log(`  - 一级分销商从二级获得佣金: ${secondaryCommissionToPrimary}元`);
    console.log(`  - 总佣金: ${primaryDirectCommission + secondaryCommissionToSecondary + secondaryCommissionToPrimary}元`);

    return {
      success: true,
      data: createdData,
      summary: {
        primarySalesCount: createdData.primarySales.length,
        secondarySalesCount: createdData.secondarySales.length,
        userOrdersCount: createdData.userOrders.length,
        totalAmount: totalAmount,
        estimatedCommission: primaryDirectCommission + secondaryCommissionToSecondary + secondaryCommissionToPrimary
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
  createCompletedistributionTestData()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 分销体系测试数据创建完成!');
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

module.exports = { createCompletedistributionTestData };