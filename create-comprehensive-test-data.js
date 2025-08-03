const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'https://zhixing-seven.vercel.app';

// 测试数据配置
const TEST_CONFIG = {
  // 一级销售
  primarySales: {
    wechat_name: '测试开白01',
    sales_name: '张子俊', 
    payment_method: 'alipay',
    payment_address: '18888888888',
    alipay_surname: '张'
  },
  
  // 二级销售数据（挂在一级销售下）
  secondarySalesUnderPrimary: [
    { wechat_name: '测试二级001', sales_name: '李明', payment_method: 'alipay', payment_address: '13333333001', alipay_surname: '李' },
    { wechat_name: '测试二级002', sales_name: '王芳', payment_method: 'alipay', payment_address: '13333333002', alipay_surname: '王' },
    { wechat_name: '测试二级003', sales_name: '陈强', payment_method: 'crypto', payment_address: '0x1234567890abcdef001', chain_name: 'ETH' },
    { wechat_name: '测试二级004', sales_name: '刘丽', payment_method: 'alipay', payment_address: '13333333004', alipay_surname: '刘' },
    { wechat_name: '测试二级005', sales_name: '黄伟', payment_method: 'crypto', payment_address: '0x1234567890abcdef005', chain_name: 'BTC' },
    { wechat_name: '测试二级006', sales_name: '周敏', payment_method: 'alipay', payment_address: '13333333006', alipay_surname: '周' },
    { wechat_name: '测试二级007', sales_name: '吴勇', payment_method: 'alipay', payment_address: '13333333007', alipay_surname: '吴' },
    { wechat_name: '测试二级008', sales_name: '赵静', payment_method: 'crypto', payment_address: '0x1234567890abcdef008', chain_name: 'ETH' },
    { wechat_name: '测试二级009', sales_name: '孙杰', payment_method: 'alipay', payment_address: '13333333009', alipay_surname: '孙' },
    { wechat_name: '测试二级010', sales_name: '钱红', payment_method: 'alipay', payment_address: '13333333010', alipay_surname: '钱' }
  ],
  
  // 直接注册的二级销售
  directSecondarySales: [
    { wechat_name: '测试独立001', sales_name: '马超', payment_method: 'alipay', payment_address: '13555555001', alipay_surname: '马' },
    { wechat_name: '测试独立002', sales_name: '林娜', payment_method: 'crypto', payment_address: '0x1234567890abcdef101', chain_name: 'ETH' },
    { wechat_name: '测试独立003', sales_name: '郭磊', payment_method: 'alipay', payment_address: '13555555003', alipay_surname: '郭' }
  ]
};

// 时间工具函数
const getTimeVariations = () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  return [
    now.toISOString().slice(0, 19).replace('T', ' '),
    yesterday.toISOString().slice(0, 19).replace('T', ' '),
    threeDaysAgo.toISOString().slice(0, 19).replace('T', ' '),
    oneWeekAgo.toISOString().slice(0, 19).replace('T', ' '),
    oneMonthAgo.toISOString().slice(0, 19).replace('T', ' '),
    twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')
  ];
};

// 随机选择时间
const getRandomTime = () => {
  const times = getTimeVariations();
  return times[Math.floor(Math.random() * times.length)];
};

// 随机选择时长和价格
const getRandomDurationAndPrice = () => {
  const options = [
    { duration: '7days', price: 0 },
    { duration: '1month', price: 188 },
    { duration: '3months', price: 488 },
    { duration: '6months', price: 688 },
    { duration: '1year', price: 1588 }
  ];
  return options[Math.floor(Math.random() * options.length)];
};

// API调用函数
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ API调用失败 ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// 1. 创建一级销售
const createPrimarySales = async () => {
  console.log('🚀 创建一级销售: 张子俊...');
  
  try {
    const response = await apiCall('POST', '/api/primary-sales?path=create', {
      ...TEST_CONFIG.primarySales,
      path: 'create'
    });
    
    if (response.success) {
      console.log('✅ 一级销售创建成功');
      console.log(`📋 销售代码: ${response.data.user_sales_code}`);
      console.log(`🔗 用户购买链接: ${response.data.user_sales_link}`);
      console.log(`👥 二级销售注册链接: ${response.data.secondary_registration_link}`);
      
      return {
        salesId: response.data.primary_sales_id,
        salesCode: response.data.user_sales_code,
        userSalesLink: response.data.user_sales_link,
        secondaryRegistrationLink: response.data.secondary_registration_link,
        secondaryRegistrationCode: response.data.secondary_registration_code
      };
    } else {
      throw new Error(response.message || '创建失败');
    }
  } catch (error) {
    console.error('❌ 一级销售创建失败:', error.message);
    throw error;
  }
};

// 2. 创建二级销售（挂在一级销售下）
const createSecondaryUnderPrimary = async (registrationCode, primarySalesId) => {
  console.log('🚀 创建10个二级销售（挂在一级销售下）...');
  
  const secondarySalesList = [];
  
  for (let i = 0; i < TEST_CONFIG.secondarySalesUnderPrimary.length; i++) {
    const salesData = TEST_CONFIG.secondarySalesUnderPrimary[i];
    
    try {
      const response = await apiCall('POST', '/api/secondary-sales?path=register', {
        ...salesData,
        registration_code: registrationCode,
        primary_sales_id: primarySalesId,
        path: 'register'
      });
      
      if (response.success) {
        console.log(`✅ 二级销售 ${i + 1}/10 创建成功: ${salesData.sales_name}`);
        secondarySalesList.push({
          salesId: response.data.secondary_sales_id,
          salesCode: response.data.user_sales_code,
          salesName: salesData.sales_name,
          wechatName: salesData.wechat_name
        });
      } else {
        console.error(`❌ 二级销售 ${i + 1} 创建失败:`, response.message);
      }
    } catch (error) {
      console.error(`❌ 二级销售 ${i + 1} 创建失败:`, error.message);
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return secondarySalesList;
};

// 3. 创建直接注册的二级销售
const createDirectSecondarySales = async () => {
  console.log('🚀 创建3个直接注册的二级销售...');
  
  const directSecondaryList = [];
  
  for (let i = 0; i < TEST_CONFIG.directSecondarySales.length; i++) {
    const salesData = TEST_CONFIG.directSecondarySales[i];
    
    try {
      // 先创建一级销售（作为独立的二级销售的基础）
      const primaryResponse = await apiCall('POST', '/api/primary-sales?path=create', {
        ...salesData,
        path: 'create'
      });
      
      if (primaryResponse.success) {
        console.log(`✅ 直接注册二级销售 ${i + 1}/3 创建成功: ${salesData.sales_name}`);
        directSecondaryList.push({
          salesId: primaryResponse.data.primary_sales_id,
          salesCode: primaryResponse.data.user_sales_code,
          salesName: salesData.sales_name,
          wechatName: salesData.wechat_name
        });
      } else {
        console.error(`❌ 直接注册二级销售 ${i + 1} 创建失败:`, primaryResponse.message);
      }
    } catch (error) {
      console.error(`❌ 直接注册二级销售 ${i + 1} 创建失败:`, error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return directSecondaryList;
};

// 4. 创建订单
const createOrders = async (salesCode, orderCount, customerPrefix) => {
  console.log(`🚀 为销售代码 ${salesCode} 创建 ${orderCount} 个订单...`);
  
  const createdOrders = [];
  
  for (let i = 1; i <= orderCount; i++) {
    const { duration, price } = getRandomDurationAndPrice();
    const paymentTime = getRandomTime();
    
    const orderData = {
      sales_code: salesCode,
      link_code: salesCode,
      tradingview_username: `${customerPrefix}_tv_${i.toString().padStart(3, '0')}`,
      customer_wechat: `${customerPrefix}_${i.toString().padStart(3, '0')}`,
      duration: duration,
      amount: price,
      payment_method: price === 0 ? 'free' : (Math.random() > 0.5 ? 'alipay' : 'crypto'),
      payment_time: paymentTime,
      purchase_type: 'immediate',
      effective_time: null,
      screenshot_data: null,
      alipay_amount: price === 0 ? null : price,
      crypto_amount: null
    };
    
    try {
      const response = await apiCall('POST', '/api/orders?path=create', orderData);
      
      if (response.success) {
        console.log(`✅ 订单 ${i}/${orderCount} 创建成功: ${orderData.customer_wechat}`);
        createdOrders.push(response.data);
      } else {
        console.error(`❌ 订单 ${i} 创建失败:`, response.message);
      }
    } catch (error) {
      console.error(`❌ 订单 ${i} 创建失败:`, error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return createdOrders;
};

// 主函数
const main = async () => {
  console.log('🎯 开始创建综合测试数据...\n');
  
  try {
    // 1. 创建一级销售
    const primarySales = await createPrimarySales();
    console.log('\n');
    
    // 2. 创建二级销售（挂在一级销售下）
    const secondaryUnderPrimary = await createSecondaryUnderPrimary(primarySales.secondaryRegistrationCode, primarySales.salesId);
    console.log('\n');
    
    // 3. 创建直接注册的二级销售
    const directSecondarySales = await createDirectSecondarySales();
    console.log('\n');
    
    // 4. 为一级销售创建10个用户订单
    console.log('📦 创建一级销售的用户订单...');
    await createOrders(primarySales.salesCode, 10, '一级用户');
    console.log('\n');
    
    // 5. 为一级销售下的每个二级销售创建3个订单
    console.log('📦 创建一级销售下二级销售的订单...');
    for (const secondary of secondaryUnderPrimary) {
      await createOrders(secondary.salesCode, 3, `二级${secondary.salesName}用户`);
    }
    console.log('\n');
    
    // 6. 为直接注册的每个二级销售创建5个订单
    console.log('📦 创建直接注册二级销售的订单...');
    for (const directSecondary of directSecondarySales) {
      await createOrders(directSecondary.salesCode, 5, `独立${directSecondary.salesName}用户`);
    }
    
    console.log('\n🎉 测试数据创建完成！');
    console.log('\n📊 数据汇总:');
    console.log(`✅ 一级销售: 1个 (${primarySales.salesCode})`);
    console.log(`✅ 二级销售(挂在一级下): ${secondaryUnderPrimary.length}个`);
    console.log(`✅ 直接注册二级销售: ${directSecondarySales.length}个`);
    console.log(`✅ 一级销售订单: 10个`);
    console.log(`✅ 一级下二级销售订单: ${secondaryUnderPrimary.length * 3}个`);
    console.log(`✅ 直接注册二级销售订单: ${directSecondarySales.length * 5}个`);
    console.log(`✅ 总订单数: ${10 + (secondaryUnderPrimary.length * 3) + (directSecondarySales.length * 5)}个`);
    
    console.log('\n🔗 重要链接:');
    console.log(`📱 用户购买链接: ${primarySales.userSalesLink}`);
    console.log(`👥 二级销售注册链接: ${primarySales.secondaryRegistrationLink}`);
    
  } catch (error) {
    console.error('\n❌ 测试数据创建失败:', error.message);
    process.exit(1);
  }
};

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = { main };