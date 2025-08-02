const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试配置
const BASE_URL = 'https://zhixing-seven.vercel.app';
const BACKUP_URL = 'https://zhixing.vercel.app';

// 测试结果记录
const testResults = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  backupUrl: BACKUP_URL,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    successRate: 0
  }
};

// 测试记录函数
function recordTest(testName, status, details = '', url = '') {
  const test = {
    name: testName,
    status: status,
    details: details,
    url: url,
    timestamp: new Date().toISOString()
  };
  testResults.tests.push(test);
  testResults.summary.total++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ ${testName} - PASS`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${testName} - FAIL: ${details}`);
  }
}

// 检查URL可访问性
async function checkUrlAccess(url, testName) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: (status) => status < 500 // 接受2xx, 3xx, 4xx状态码
    });
    
    if (response.status === 200) {
      recordTest(testName, 'PASS', `Status: ${response.status}`, url);
      return true;
    } else if (response.status >= 300 && response.status < 400) {
      recordTest(testName, 'PASS', `Redirect: ${response.status}`, url);
      return true;
    } else {
      recordTest(testName, 'FAIL', `HTTP ${response.status}`, url);
      return false;
    }
  } catch (error) {
    const errorMsg = error.code === 'ECONNABORTED' ? 'Timeout' : error.message;
    recordTest(testName, 'FAIL', errorMsg, url);
    return false;
  }
}

// 检查API端点
async function checkAPIEndpoint(endpoint, testName) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      timeout: 10000
    });
    
    if (response.status === 200) {
      recordTest(testName, 'PASS', `API响应正常`, `${BASE_URL}${endpoint}`);
      return true;
    } else {
      recordTest(testName, 'FAIL', `HTTP ${response.status}`, `${BASE_URL}${endpoint}`);
      return false;
    }
  } catch (error) {
    recordTest(testName, 'FAIL', error.message, `${BASE_URL}${endpoint}`);
    return false;
  }
}

// 检查页面内容
async function checkPageContent(url, testName, expectedContent = '') {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.status === 200) {
      const content = response.data;
      
      // 检查是否包含React应用的基本特征
      const hasReactApp = content.includes('react') || content.includes('React') || 
                         content.includes('root') || content.includes('app');
      
      if (hasReactApp) {
        recordTest(testName, 'PASS', '页面内容正常', url);
        return true;
      } else {
        recordTest(testName, 'FAIL', '页面内容异常', url);
        return false;
      }
    } else {
      recordTest(testName, 'FAIL', `HTTP ${response.status}`, url);
      return false;
    }
  } catch (error) {
    recordTest(testName, 'FAIL', error.message, url);
    return false;
  }
}

// 主要测试函数
async function runComprehensiveTest() {
  console.log('🚀 开始全面用户测试检查...\n');
  
  // 1. 基础链接测试
  console.log('📋 1. 基础链接测试');
  await checkUrlAccess(BASE_URL, '主链接访问');
  await checkUrlAccess(BACKUP_URL, '备用链接访问');
  
  // 2. 管理员页面测试
  console.log('\n📊 2. 管理员页面测试');
  await checkPageContent(`${BASE_URL}/admin/login`, '管理员登录页面');
  await checkPageContent(`${BASE_URL}/admin/overview`, '管理员概览页面');
  await checkPageContent(`${BASE_URL}/admin/payment-config`, '支付配置页面');
  await checkPageContent(`${BASE_URL}/admin/users`, '用户管理页面');
  await checkPageContent(`${BASE_URL}/admin/orders`, '订单管理页面');
  await checkPageContent(`${BASE_URL}/admin/sales`, '销售管理页面');
  await checkPageContent(`${BASE_URL}/admin/export`, '数据导出页面');
  
  // 3. 一级销售页面测试
  console.log('\n👤 3. 一级销售页面测试');
  await checkPageContent(`${BASE_URL}/primary-sales/register`, '一级销售注册页面');
  await checkPageContent(`${BASE_URL}/primary-sales/list`, '一级销售列表页面');
  await checkPageContent(`${BASE_URL}/primary-sales/settlement`, '一级销售结算页面');
  await checkPageContent(`${BASE_URL}/primary-sales/orders`, '一级销售订单管理页面');
  await checkPageContent(`${BASE_URL}/primary-sales/reminders`, '一级销售催单管理页面');
  
  // 4. 二级销售页面测试
  console.log('\n👥 4. 二级销售页面测试');
  await checkPageContent(`${BASE_URL}/secondary-sales/register`, '二级销售注册页面');
  await checkPageContent(`${BASE_URL}/secondary-sales/list`, '二级销售列表页面');
  await checkPageContent(`${BASE_URL}/secondary-sales/orders`, '二级销售订单管理页面');
  await checkPageContent(`${BASE_URL}/secondary-sales/reminders`, '二级销售催单管理页面');
  
  // 5. 用户购买页面测试
  console.log('\n🛒 5. 用户购买页面测试');
  await checkPageContent(`${BASE_URL}/purchase`, '用户购买页面');
  await checkPageContent(`${BASE_URL}/user/orders`, '用户订单页面');
  
  // 6. API端点测试
  console.log('\n🔌 6. API端点测试');
  await checkAPIEndpoint('/api/health', '健康检查API');
  await checkAPIEndpoint('/api/auth/login', '登录API');
  await checkAPIEndpoint('/api/admin/stats', '管理员统计API');
  await checkAPIEndpoint('/api/orders', '订单API');
  await checkAPIEndpoint('/api/sales', '销售API');
  await checkAPIEndpoint('/api/payment-config', '支付配置API');
  
  // 7. 功能测试（模拟用户操作）
  console.log('\n🔧 7. 功能测试');
  
  // 测试管理员登录功能
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (loginResponse.status === 200) {
      recordTest('管理员登录功能', 'PASS', '登录成功');
    } else {
      recordTest('管理员登录功能', 'FAIL', `登录失败: ${loginResponse.status}`);
    }
  } catch (error) {
    recordTest('管理员登录功能', 'FAIL', error.message);
  }
  
  // 测试获取支付配置
  try {
    const configResponse = await axios.get(`${BASE_URL}/api/payment-config`, {
      timeout: 10000
    });
    
    if (configResponse.status === 200) {
      recordTest('支付配置获取', 'PASS', '配置获取成功');
    } else {
      recordTest('支付配置获取', 'FAIL', `获取失败: ${configResponse.status}`);
    }
  } catch (error) {
    recordTest('支付配置获取', 'FAIL', error.message);
  }
  
  // 测试获取订单列表
  try {
    const ordersResponse = await axios.get(`${BASE_URL}/api/orders`, {
      timeout: 10000
    });
    
    if (ordersResponse.status === 200) {
      recordTest('订单列表获取', 'PASS', '订单列表获取成功');
    } else {
      recordTest('订单列表获取', 'FAIL', `获取失败: ${ordersResponse.status}`);
    }
  } catch (error) {
    recordTest('订单列表获取', 'FAIL', error.message);
  }
  
  // 8. 性能测试
  console.log('\n⚡ 8. 性能测试');
  
  // 测试页面加载速度
  const startTime = Date.now();
  try {
    await axios.get(BASE_URL, { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    if (loadTime < 5000) {
      recordTest('主页面加载速度', 'PASS', `${loadTime}ms`);
    } else {
      recordTest('主页面加载速度', 'FAIL', `${loadTime}ms (超过5秒)`);
    }
  } catch (error) {
    recordTest('主页面加载速度', 'FAIL', error.message);
  }
  
  // 计算成功率
  testResults.summary.successRate = Math.round((testResults.summary.passed / testResults.summary.total) * 100);
  
  // 输出测试结果
  console.log('\n📊 测试结果汇总');
  console.log(`总测试项: ${testResults.summary.total}`);
  console.log(`通过: ${testResults.summary.passed}`);
  console.log(`失败: ${testResults.summary.failed}`);
  console.log(`成功率: ${testResults.summary.successRate}%`);
  
  // 保存测试结果到文件
  const resultFile = `comprehensive-test-results-${Date.now()}.json`;
  fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 详细测试结果已保存到: ${resultFile}`);
  
  // 输出失败的项目
  const failedTests = testResults.tests.filter(test => test.status === 'FAIL');
  if (failedTests.length > 0) {
    console.log('\n❌ 失败项目列表:');
    failedTests.forEach(test => {
      console.log(`- ${test.name}: ${test.details}`);
    });
  }
  
  // 输出建议
  console.log('\n💡 修复建议:');
  if (testResults.summary.successRate >= 90) {
    console.log('✅ 系统状态良好，可以进行线上部署');
  } else if (testResults.summary.successRate >= 70) {
    console.log('⚠️ 系统存在一些问题，建议先进行线下修复');
  } else {
    console.log('❌ 系统存在严重问题，需要全面修复后才能部署');
  }
  
  return testResults;
}

// 运行测试
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

module.exports = { runComprehensiveTest }; 