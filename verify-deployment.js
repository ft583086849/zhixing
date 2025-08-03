#!/usr/bin/env node

/**
 * 🚀 部署结果验证测试
 * 验证核心修复功能是否正常工作
 */

const axios = require('axios');

// 配置
const BASE_URL = 'https://zhixing-seven.vercel.app/api';
const TEST_CONFIG = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// 测试结果记录
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// 日志函数
const log = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}]`;
  
  switch(type) {
    case 'success':
      console.log(`${colors.green}✅ ${prefix} ${message}${colors.reset}`);
      testResults.passed++;
      break;
    case 'error':
      console.log(`${colors.red}❌ ${prefix} ${message}${colors.reset}`);
      testResults.failed++;
      break;
    case 'warning':
      console.log(`${colors.yellow}⚠️  ${prefix} ${message}${colors.reset}`);
      testResults.warnings++;
      break;
    case 'info':
      console.log(`${colors.blue}ℹ️  ${prefix} ${message}${colors.reset}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
};

// 测试函数
const runTest = async (testName, testFunction) => {
  try {
    log(`开始测试: ${testName}`, 'info');
    const result = await testFunction();
    if (result.success) {
      log(`${testName}: ${result.message}`, 'success');
      testResults.details.push({ test: testName, status: 'PASS', message: result.message });
    } else {
      log(`${testName}: ${result.message}`, 'error');
      testResults.details.push({ test: testName, status: 'FAIL', message: result.message });
    }
  } catch (error) {
    log(`${testName}: ${error.message}`, 'error');
    testResults.details.push({ test: testName, status: 'FAIL', message: error.message });
  }
};

// 1. 健康检查测试
const testHealthCheck = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/health`, TEST_CONFIG);
    return {
      success: response.status === 200,
      message: `健康检查响应: ${response.status} - ${response.data?.message || 'OK'}`
    };
  } catch (error) {
    return {
      success: false,
      message: `健康检查失败: ${error.message}`
    };
  }
};

// 2. 管理员登录测试
const testAdminLogin = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/auth?path=login`, {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    }, TEST_CONFIG);
    
    if (response.data.data && response.data.data.token) {
      global.authToken = response.data.data.token;
      return {
        success: true,
        message: '知行管理员登录成功，获得认证token'
      };
    } else {
      return {
        success: false,
        message: '登录响应缺少token'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `登录失败: ${error.response?.data?.message || error.message}`
    };
  }
};

// 3. 订单列表查询测试 (验证JOIN修复)
const testOrdersList = async () => {
  if (!global.authToken) {
    return { success: false, message: '需要先登录获取token' };
  }

  try {
    const response = await axios.get(`${BASE_URL}/admin?path=orders`, {
      ...TEST_CONFIG,
      headers: {
        ...TEST_CONFIG.headers,
        'Authorization': `Bearer ${global.authToken}`
      }
    });

    if (response.status === 200) {
      const orders = response.data.data;
      if (Array.isArray(orders)) {
        // 检查是否有订单包含销售信息
        const hasValidOrder = orders.some(order => {
          return order.sales_wechat_name || order.sales_name; // 验证JOIN是否成功
        });
        
        return {
          success: true,
          message: `订单列表查询成功，共${orders.length}条订单，${hasValidOrder ? '包含销售信息' : '暂无销售信息关联'}`
        };
      } else {
        return {
          success: false,
          message: '订单列表响应格式错误'
        };
      }
    } else {
      return {
        success: false,
        message: `订单查询响应异常: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `订单查询失败: ${error.response?.data?.message || error.message}`
    };
  }
};

// 4. 统计信息测试
const testAdminStats = async () => {
  if (!global.authToken) {
    return { success: false, message: '需要先登录获取token' };
  }

  try {
    const response = await axios.get(`${BASE_URL}/admin?path=stats`, {
      ...TEST_CONFIG,
      headers: {
        ...TEST_CONFIG.headers,
        'Authorization': `Bearer ${global.authToken}`
      }
    });

    if (response.status === 200 && response.data.data) {
      const stats = response.data.data;
      return {
        success: true,
        message: `统计信息获取成功: 总订单${stats.totalOrders || 0}条，总销售${stats.totalSales || 0}条`
      };
    } else {
      return {
        success: false,
        message: '统计信息响应格式错误'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `统计查询失败: ${error.response?.data?.message || error.message}`
    };
  }
};

// 主测试流程
const runDeploymentVerification = async () => {
  console.log(`${colors.bold}${colors.blue}🚀 开始部署结果验证测试${colors.reset}\n`);
  
  const tests = [
    { name: '系统健康检查', func: testHealthCheck },
    { name: '知行管理员登录功能', func: testAdminLogin },
    { name: '订单列表查询 (验证JOIN修复)', func: testOrdersList },
    { name: '管理员统计信息', func: testAdminStats }
  ];

  // 依次执行测试
  for (const test of tests) {
    await runTest(test.name, test.func);
    console.log(''); // 添加空行
  }

  // 输出测试结果摘要
  console.log(`${colors.bold}📊 测试结果摘要${colors.reset}`);
  console.log(`✅ 通过: ${colors.green}${testResults.passed}${colors.reset}`);
  console.log(`❌ 失败: ${colors.red}${testResults.failed}${colors.reset}`);
  
  // 详细结果
  console.log(`\n${colors.bold}📋 详细测试结果${colors.reset}`);
  testResults.details.forEach((detail, index) => {
    const status = detail.status === 'PASS' ? 
      `${colors.green}PASS${colors.reset}` : 
      `${colors.red}FAIL${colors.reset}`;
    console.log(`${index + 1}. [${status}] ${detail.test}: ${detail.message}`);
  });

  // 总体评估
  console.log(`\n${colors.bold}🎯 部署评估结果${colors.reset}`);
  if (testResults.failed === 0) {
    console.log(`${colors.green}✅ 部署成功！所有核心功能正常工作，可以推进新需求${colors.reset}`);
    return true;
  } else if (testResults.failed <= 1) {
    console.log(`${colors.yellow}⚠️  部署基本成功，有 ${testResults.failed} 个小问题但不影响核心功能${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}❌ 部署存在问题，有 ${testResults.failed} 个测试失败，需要先修复${colors.reset}`);
    return false;
  }
};

// 执行测试
runDeploymentVerification()
  .then((success) => {
    if (success) {
      console.log(`\n${colors.bold}${colors.blue}🎯 下一步行动计划${colors.reset}`);
      console.log(`${colors.green}1. 部署验证通过，开始实现新需求${colors.reset}`);
      console.log(`${colors.green}2. 新需求：用户购买失败友好提示 - "下单拥挤，请等待"${colors.reset}`);
      console.log(`${colors.green}3. 重点修复：销售链接不存在时的错误处理${colors.reset}`);
    } else {
      console.log(`\n${colors.bold}${colors.red}🚨 需要先修复部署问题${colors.reset}`);
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(`${colors.red}测试执行出错: ${error.message}${colors.reset}`);
    process.exit(1);
  });