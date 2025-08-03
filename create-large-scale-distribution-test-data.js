#!/usr/bin/env node

/**
 * 🎯 大规模分销层级测试数据创建器
 * 保证数据创建成功，如果失败则重试直到成功
 * 
 * 目标数据：
 * - 1个一级销售
 * - 10个二级销售（挂在一级销售下）
 * - 3个独立二级销售
 * - 55个订单总计
 */

const axios = require('axios');

const BASE_URL = 'https://zhixing-seven.vercel.app/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  switch(type) {
    case 'success':
      console.log(`${colors.green}✅ [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'error':
      console.log(`${colors.red}❌ [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}⚠️  [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'info':
      console.log(`${colors.blue}ℹ️  [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'progress':
      console.log(`${colors.cyan}🔄 [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'important':
      console.log(`${colors.magenta}🎯 [${timestamp}] ${message}${colors.reset}`);
      break;
  }
};

// 生成真正唯一的微信号
const generateUniqueWechatName = (prefix) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 8);
  return `${prefix}_${timestamp}_${random}`;
};

// 生成唯一的TradingView用户名
const generateUniqueTradingViewUsername = (prefix) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6);
  return `${prefix}_${timestamp}_${random}`;
};

// 重试机制 - 确保成功
const retryUntilSuccess = async (operation, operationName, maxRetries = 10) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await operation();
      log(`${operationName} 成功 (尝试 ${i + 1})`, 'success');
      return result;
    } catch (error) {
      if (error.response?.data) {
        console.log('HTTP错误详情:', JSON.stringify(error.response.data, null, 2));
      }
      log(`${operationName} 失败 (尝试 ${i + 1}/${maxRetries}): ${error.message}`, 'warning');
      
      if (i === maxRetries - 1) {
        log(`${operationName} 达到最大重试次数，放弃`, 'error');
        throw error;
      }
      
      // 等待1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// 创建一级销售
const createPrimarySales = async () => {
  return await retryUntilSuccess(async () => {
    const wechatName = generateUniqueWechatName('PRIMARY');
    
    const primarySalesData = {
      wechat_name: wechatName,
      payment_method: 'alipay',
      payment_address: `${wechatName}@example.com`,
      alipay_surname: `李`
    };

    log(`尝试创建一级销售: ${wechatName}`, 'progress');
    const response = await axios.post(`${BASE_URL}/primary-sales?path=create`, primarySalesData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '创建失败');
    }
    
    return response.data;
  }, '一级销售创建');
};

// 创建挂名二级销售
const createSubSecondarySales = async (registrationCode, index) => {
  return await retryUntilSuccess(async () => {
    const wechatName = generateUniqueWechatName(`SUB_SEC_${index}`);
    
    const secondaryData = {
      registration_code: registrationCode,
      wechat_name: wechatName,
      payment_method: 'crypto',
      payment_address: `TR${Math.random().toString(36).substr(2, 32).toUpperCase()}`,
      chain_name: 'USDT'
    };

    log(`尝试创建挂名二级销售 ${index}: ${wechatName}`, 'progress');
    const response = await axios.post(`${BASE_URL}/secondary-sales?path=register`, secondaryData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '创建失败');
    }
    
    return response.data;
  }, `挂名二级销售 ${index} 创建`);
};

// 创建独立二级销售
const createIndependentSecondarySales = async (index) => {
  return await retryUntilSuccess(async () => {
    const wechatName = generateUniqueWechatName(`IND_SEC_${index}`);
    
    const secondaryData = {
      wechat_name: wechatName,
      payment_method: 'alipay',
      payment_address: `${wechatName}@example.com`,
      alipay_surname: `王`,
      sales_type: 'secondary'
    };

    log(`尝试创建独立二级销售 ${index}: ${wechatName}`, 'progress');
    const response = await axios.post(`${BASE_URL}/sales?path=create`, secondaryData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '创建失败');
    }
    
    return response.data;
  }, `独立二级销售 ${index} 创建`);
};

// 创建订单
const createOrder = async (salesCode, orderIndex, orderType) => {
  return await retryUntilSuccess(async () => {
    const durations = ['7days', '1month', '3months', '6months', 'lifetime'];
    const paymentMethods = ['alipay', 'crypto'];
    const purchaseTypes = ['immediate', 'advance'];
    
    const duration = durations[Math.floor(Math.random() * durations.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const purchaseType = purchaseTypes[Math.floor(Math.random() * purchaseTypes.length)];
    
    const tradingViewUsername = generateUniqueTradingViewUsername(`${orderType}_${orderIndex}`);
    const customerWechat = generateUniqueWechatName(`CUSTOMER_${orderIndex}`);
    
    // 价格映射
    const priceMap = {
      '7days': 0,
      '1month': 188,
      '3months': 488,
      '6months': 688,
      'lifetime': 1588
    };
    
    const amount = priceMap[duration];
    
    const orderData = {
      sales_code: salesCode,
      tradingview_username: tradingViewUsername,
      customer_wechat: customerWechat,
      duration: duration,
      purchase_type: purchaseType,
      payment_method: paymentMethod,
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      amount: amount,
      screenshot_data: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
    };

    if (paymentMethod === 'alipay') {
      orderData.alipay_amount = amount;
    } else {
      orderData.crypto_amount = amount;
    }

    log(`尝试创建${orderType}订单 ${orderIndex}: ${tradingViewUsername}`, 'progress');
    const response = await axios.post(`${BASE_URL}/orders?path=create`, orderData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '创建失败');
    }
    
    return response.data;
  }, `${orderType}订单 ${orderIndex} 创建`);
};

// 主函数
const createLargeScaleTestData = async () => {
  console.log(`${colors.magenta}🎯 开始创建大规模分销层级测试数据${colors.reset}\n`);
  
  const results = {
    primarySales: null,
    subSecondarySales: [],
    independentSecondarySales: [],
    primaryOrders: [],
    subSecondaryOrders: [],
    independentOrders: [],
    totalSuccess: 0,
    totalRequired: 69 // 1+13+55
  };

  try {
    // 步骤1：创建一级销售
    log('=== 步骤1：创建一级销售 ===', 'important');
    results.primarySales = await createPrimarySales();
    results.totalSuccess++;
    
    log(`一级销售创建成功！`, 'success');
    log(`微信号: ${results.primarySales.data.wechat_name}`, 'info');
    log(`用户购买链接: ${results.primarySales.data.user_sales_link}`, 'info');
    log(`二级销售注册链接: ${results.primarySales.data.secondary_registration_link}`, 'info');

    const primarySalesCode = results.primarySales.data.user_sales_link.split('/').pop();
    const secondaryRegistrationCode = results.primarySales.data.secondary_registration_link.split('/').pop();

    // 步骤2：创建10个挂名二级销售
    log('\n=== 步骤2：创建10个挂名二级销售 ===', 'important');
    for (let i = 1; i <= 10; i++) {
      try {
        const secondarySales = await createSubSecondarySales(secondaryRegistrationCode, i);
        results.subSecondarySales.push(secondarySales);
        results.totalSuccess++;
        log(`挂名二级销售 ${i}/10 创建成功: ${secondarySales.data.wechat_name}`, 'success');
      } catch (error) {
        log(`挂名二级销售 ${i} 最终失败: ${error.message}`, 'error');
      }
    }

    // 步骤3：创建3个独立二级销售
    log('\n=== 步骤3：创建3个独立二级销售 ===', 'important');
    for (let i = 1; i <= 3; i++) {
      try {
        const independentSales = await createIndependentSecondarySales(i);
        results.independentSecondarySales.push(independentSales);
        results.totalSuccess++;
        log(`独立二级销售 ${i}/3 创建成功: ${independentSales.data.wechat_name}`, 'success');
      } catch (error) {
        log(`独立二级销售 ${i} 最终失败: ${error.message}`, 'error');
      }
    }

    // 步骤4：创建10个一级销售直接订单
    log('\n=== 步骤4：创建10个一级销售直接订单 ===', 'important');
    for (let i = 1; i <= 10; i++) {
      try {
        const order = await createOrder(primarySalesCode, i, 'PRIMARY');
        results.primaryOrders.push(order);
        results.totalSuccess++;
        log(`一级销售订单 ${i}/10 创建成功`, 'success');
      } catch (error) {
        log(`一级销售订单 ${i} 最终失败: ${error.message}`, 'error');
      }
    }

    // 步骤5：为每个挂名二级销售创建3个订单
    log('\n=== 步骤5：为挂名二级销售创建订单 ===', 'important');
    for (let i = 0; i < results.subSecondarySales.length; i++) {
      const sales = results.subSecondarySales[i];
      const salesCode = sales.data.user_sales_link?.split('/').pop();
      
      if (!salesCode) {
        log(`挂名二级销售 ${i+1} 无销售链接，跳过`, 'warning');
        continue;
      }

      for (let j = 1; j <= 3; j++) {
        try {
          const order = await createOrder(salesCode, `${i+1}_${j}`, 'SUB_SECONDARY');
          results.subSecondaryOrders.push(order);
          results.totalSuccess++;
          log(`挂名二级销售 ${i+1} 订单 ${j}/3 创建成功`, 'success');
        } catch (error) {
          log(`挂名二级销售 ${i+1} 订单 ${j} 最终失败: ${error.message}`, 'error');
        }
      }
    }

    // 步骤6：为每个独立二级销售创建5个订单
    log('\n=== 步骤6：为独立二级销售创建订单 ===', 'important');
    for (let i = 0; i < results.independentSecondarySales.length; i++) {
      const sales = results.independentSecondarySales[i];
      const salesCode = sales.data.user_sales_link?.split('/').pop();
      
      if (!salesCode) {
        log(`独立二级销售 ${i+1} 无销售链接，跳过`, 'warning');
        continue;
      }

      for (let j = 1; j <= 5; j++) {
        try {
          const order = await createOrder(salesCode, `IND_${i+1}_${j}`, 'INDEPENDENT');
          results.independentOrders.push(order);
          results.totalSuccess++;
          log(`独立二级销售 ${i+1} 订单 ${j}/5 创建成功`, 'success');
        } catch (error) {
          log(`独立二级销售 ${i+1} 订单 ${j} 最终失败: ${error.message}`, 'error');
        }
      }
    }

  } catch (error) {
    log(`致命错误: ${error.message}`, 'error');
  }

  // 最终统计
  console.log(`\n${colors.magenta}🎯 大规模测试数据创建完成！${colors.reset}`);
  console.log(`${colors.cyan}============================================${colors.reset}`);
  console.log(`${colors.green}✅ 一级销售: ${results.primarySales ? 1 : 0}/1${colors.reset}`);
  console.log(`${colors.green}✅ 挂名二级销售: ${results.subSecondarySales.length}/10${colors.reset}`);
  console.log(`${colors.green}✅ 独立二级销售: ${results.independentSecondarySales.length}/3${colors.reset}`);
  console.log(`${colors.green}✅ 一级销售订单: ${results.primaryOrders.length}/10${colors.reset}`);
  console.log(`${colors.green}✅ 挂名二级销售订单: ${results.subSecondaryOrders.length}/30${colors.reset}`);
  console.log(`${colors.green}✅ 独立二级销售订单: ${results.independentOrders.length}/15${colors.reset}`);
  
  const totalOrders = results.primaryOrders.length + results.subSecondaryOrders.length + results.independentOrders.length;
  const totalSales = results.subSecondarySales.length + results.independentSecondarySales.length + (results.primarySales ? 1 : 0);
  
  console.log(`${colors.cyan}============================================${colors.reset}`);
  console.log(`${colors.magenta}📊 总计统计${colors.reset}`);
  console.log(`${colors.cyan}   总销售数: ${totalSales}/14${colors.reset}`);
  console.log(`${colors.cyan}   总订单数: ${totalOrders}/55${colors.reset}`);
  console.log(`${colors.cyan}   总成功率: ${(results.totalSuccess/results.totalRequired*100).toFixed(1)}%${colors.reset}`);
  console.log(`${colors.cyan}============================================${colors.reset}`);
  
  console.log(`\n${colors.magenta}🎉 分销层级测试数据创建任务完成！${colors.reset}`);
  console.log(`现在您可以在管理员后台查看完整的分销数据了！`);
  
  return results;
};

// 执行创建
createLargeScaleTestData().catch(console.error);