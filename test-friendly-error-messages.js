#!/usr/bin/env node

/**
 * 🧪 测试友好错误提示功能
 * 验证用户购买失败时的友好提示
 */

const axios = require('axios');

const BASE_URL = 'https://zhixing-seven.vercel.app/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}]`;
  
  switch(type) {
    case 'success':
      console.log(`${colors.green}✅ ${prefix} ${message}${colors.reset}`);
      break;
    case 'error':
      console.log(`${colors.red}❌ ${prefix} ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}⚠️  ${prefix} ${message}${colors.reset}`);
      break;
    case 'info':
      console.log(`${colors.blue}ℹ️  ${prefix} ${message}${colors.reset}`);
      break;
  }
};

async function testFriendlyErrorMessages() {
  console.log(`${colors.blue}🧪 开始测试友好错误提示功能${colors.reset}\n`);

  // 1. 测试销售链接不存在的友好提示
  log('测试销售链接不存在的友好提示...', 'info');
  try {
    const response = await axios.get(`${BASE_URL}/sales?path=link&linkCode=invalid_link_code_test`);
    log('预期应该返回404错误', 'warning');
  } catch (error) {
    if (error.response?.status === 404) {
      const message = error.response.data?.message;
      if (message === '下单拥挤，请等待') {
        log('销售链接不存在 → 返回友好提示: "下单拥挤，请等待"', 'success');
      } else {
        log(`销售链接不存在 → 返回: "${message}" (期望: "下单拥挤，请等待")`, 'warning');
      }
    } else {
      log(`销售链接测试失败: ${error.message}`, 'error');
    }
  }

  // 2. 测试订单创建时销售链接不存在的友好提示
  log('测试订单创建时销售链接不存在的友好提示...', 'info');
  try {
    const orderData = {
      sales_code: 'invalid_sales_code_test',
      tradingview_username: 'test_user',
      customer_wechat: 'test_wechat',
      duration: '7days',
      amount: 0,
      payment_method: 'alipay'
    };

    const response = await axios.post(`${BASE_URL}/orders?path=create`, orderData);
    log('预期应该返回404错误', 'warning');
  } catch (error) {
    if (error.response?.status === 404) {
      const message = error.response.data?.message;
      if (message === '下单拥挤，请等待') {
        log('订单创建失败 → 返回友好提示: "下单拥挤，请等待"', 'success');
      } else {
        log(`订单创建失败 → 返回: "${message}" (期望: "下单拥挤，请等待")`, 'warning');
      }
    } else {
      log(`订单创建测试失败: ${error.message}`, 'error');
    }
  }

  console.log(`\n${colors.green}🎯 友好错误提示测试完成！${colors.reset}`);
}

testFriendlyErrorMessages().catch(console.error);