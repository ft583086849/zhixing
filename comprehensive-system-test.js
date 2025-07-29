const axios = require('axios');

console.log('🧪 知行财库系统全面功能测试\n');

// 测试配置
const BASE_URL = 'http://localhost:5000/api';
const TEST_CONFIG = {
  adminCredentials: {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  },
  testOrder: {
    link_code: 'abc12345',
    tradingview_username: 'testuser_comprehensive',
    customer_wechat: 'test_wechat_comprehensive',
    duration: '1month',
    payment_method: 'alipay',
    payment_time: new Date().toISOString(),
    purchase_type: 'immediate'
  }
};

// 测试结果统计
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
  testResults.details.push({ name, passed, details });
}

async function testAdminAuthentication() {
  console.log('\n🔐 1. 管理员认证测试');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_CONFIG.adminCredentials);
    const success = response.data.success && response.data.data && response.data.data.token;
    logTest('管理员登录', success, success ? '登录成功' : '登录失败');
    return success ? response.data.data.token : null;
  } catch (error) {
    logTest('管理员登录', false, error.message);
    return null;
  }
}

async function testSalesLinksAPI(token) {
  console.log('\n🔗 2. 销售链接API测试');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/links`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const success = response.data.success && Array.isArray(response.data.data);
    logTest('获取销售链接', success, `获取到 ${response.data.data?.length || 0} 个链接`);
    return success;
  } catch (error) {
    logTest('获取销售链接', false, error.message);
    return false;
  }
}

async function testOrdersAPI(token) {
  console.log('\n📦 3. 订单API测试');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const success = response.data.success && response.data.data && Array.isArray(response.data.data.orders);
    logTest('获取订单列表', success, `获取到 ${response.data.data?.orders?.length || 0} 个订单`);
    return success;
  } catch (error) {
    logTest('获取订单列表', false, error.message);
    return false;
  }
}

async function testCustomersAPI(token) {
  console.log('\n👥 4. 客户管理API测试');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const success = response.data.success && Array.isArray(response.data.data.customers);
    logTest('获取客户列表', success, `获取到 ${response.data.data?.customers?.length || 0} 个客户`);
    return success;
  } catch (error) {
    logTest('获取客户列表', false, error.message);
    return false;
  }
}

async function testSalesAPI(token) {
  console.log('\n💰 5. 销售管理API测试');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/links`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const success = response.data.success && Array.isArray(response.data.data);
    logTest('获取销售数据', success, `获取到 ${response.data.data?.length || 0} 个销售`);
    return success;
  } catch (error) {
    logTest('获取销售数据', false, error.message);
    return false;
  }
}

async function testPaymentConfigAPI(token) {
  console.log('\n⚙️  6. 收款配置API测试');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/payment-config`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const success = response.data.success;
    logTest('获取收款配置', success, success ? '配置获取成功' : '配置获取失败');
    return success;
  } catch (error) {
    logTest('获取收款配置', false, error.message);
    return false;
  }
}

async function testOrderCreation() {
  console.log('\n📝 7. 订单创建测试');
  
  try {
    const response = await axios.post(`${BASE_URL}/orders/create`, TEST_CONFIG.testOrder);
    const success = response.data.success && response.data.data;
    logTest('创建测试订单', success, success ? `订单ID: ${response.data.data.order_id}` : '订单创建失败');
    return success;
  } catch (error) {
    logTest('创建测试订单', false, error.message);
    return false;
  }
}

async function testStatisticsAPI(token) {
  console.log('\n📊 8. 统计数据API测试');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const success = response.data.success && response.data.data;
    logTest('获取统计数据', success, success ? '统计数据获取成功' : '统计数据获取失败');
    return success;
  } catch (error) {
    logTest('获取统计数据', false, error.message);
    return false;
  }
}

async function testSearchFunctionality(token) {
  console.log('\n🔍 9. 搜索功能测试');
  
  try {
    // 测试订单搜索
    const orderSearchResponse = await axios.get(`${BASE_URL}/admin/orders?tradingview_username=test`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orderSearchSuccess = orderSearchResponse.data.success;
    logTest('订单搜索功能', orderSearchSuccess, orderSearchSuccess ? '搜索功能正常' : '搜索功能异常');
    
    // 测试客户搜索
    const customerSearchResponse = await axios.get(`${BASE_URL}/admin/customers?customer_wechat=test`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const customerSearchSuccess = customerSearchResponse.data.success;
    logTest('客户搜索功能', customerSearchSuccess, customerSearchSuccess ? '搜索功能正常' : '搜索功能异常');
    
    return orderSearchSuccess && customerSearchSuccess;
  } catch (error) {
    logTest('搜索功能', false, error.message);
    return false;
  }
}

async function testFrontendRoutes() {
  console.log('\n🌐 10. 前端路由测试');
  
  const routes = [
    '/#/admin/login',
    '/#/admin/dashboard',
    '/#/admin/orders',
    '/#/admin/sales',
    '/#/admin/customers',
    '/#/admin/payment-config',
    '/#/sales',
    '/#/purchase/abc12345'
  ];
  
  let allRoutesValid = true;
  
  for (const route of routes) {
    try {
      const response = await axios.get(`http://localhost:3000${route}`, {
        timeout: 5000,
        validateStatus: () => true // 接受所有状态码
      });
      const isValid = response.status !== 404;
      logTest(`路由 ${route}`, isValid, `状态码: ${response.status}`);
      if (!isValid) allRoutesValid = false;
    } catch (error) {
      logTest(`路由 ${route}`, false, error.message);
      allRoutesValid = false;
    }
  }
  
  return allRoutesValid;
}

async function runAllTests() {
  console.log('🚀 开始全面系统测试...\n');
  
  // 1. 管理员认证
  const token = await testAdminAuthentication();
  
  if (token) {
    // 2-6. 后台API测试
    await testSalesLinksAPI(token);
    await testOrdersAPI(token);
    await testCustomersAPI(token);
    await testSalesAPI(token);
    await testPaymentConfigAPI(token);
    
    // 7. 统计数据
    await testStatisticsAPI(token);
    
    // 8. 搜索功能
    await testSearchFunctionality(token);
  }
  
  // 9. 订单创建（不需要token）
  await testOrderCreation();
  
  // 10. 前端路由
  await testFrontendRoutes();
  
  // 输出测试结果
  console.log('\n📊 测试结果汇总');
  console.log('================================================================================');
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过: ${testResults.passed} ✅`);
  console.log(`失败: ${testResults.failed} ❌`);
  console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.name}: ${test.details}`);
      });
  }
  
  console.log('\n🎯 系统状态评估:');
  if (testResults.passed / testResults.total >= 0.9) {
    console.log('🟢 系统状态: 优秀 - 可以准备部署');
  } else if (testResults.passed / testResults.total >= 0.8) {
    console.log('🟡 系统状态: 良好 - 需要少量修复');
  } else if (testResults.passed / testResults.total >= 0.7) {
    console.log('🟠 系统状态: 一般 - 需要较多修复');
  } else {
    console.log('🔴 系统状态: 较差 - 需要大量修复');
  }
  
  console.log('\n💡 建议下一步:');
  if (testResults.failed === 0) {
    console.log('   1. 准备生产环境部署');
    console.log('   2. 配置域名和SSL证书');
    console.log('   3. 设置监控和日志系统');
  } else {
    console.log('   1. 修复失败的测试项');
    console.log('   2. 重新运行测试');
    console.log('   3. 确保所有功能正常后再部署');
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试执行失败:', error.message);
}); 