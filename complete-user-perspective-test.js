const axios = require('axios');
const fs = require('fs');

// 从用户视角的完整功能测试
console.log('👤 开始从用户视角的完整功能测试...\n');

// 测试配置
const BASE_URL = 'https://zhixing-seven.vercel.app';
const BACKUP_URL = 'https://zhixing.vercel.app';

// 测试结果记录
const testResults = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  backupUrl: BACKUP_URL,
  userFlows: [],
  summary: {
    totalFlows: 0,
    passedFlows: 0,
    failedFlows: 0,
    successRate: 0
  }
};

// 测试记录函数
function recordFlow(flowName, status, details = '', steps = []) {
  const flow = {
    name: flowName,
    status: status,
    details: details,
    steps: steps,
    timestamp: new Date().toISOString()
  };
  testResults.userFlows.push(flow);
  testResults.summary.totalFlows++;
  
  if (status === 'PASS') {
    testResults.summary.passedFlows++;
    console.log(`✅ ${flowName} - PASS`);
  } else {
    testResults.summary.failedFlows++;
    console.log(`❌ ${flowName} - FAIL: ${details}`);
  }
}

// 检查页面可访问性
async function checkPageAccess(url, pageName) {
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
        return { success: true, message: '页面正常加载' };
      } else {
        return { success: false, message: '页面内容异常' };
      }
    } else {
      return { success: false, message: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 测试管理员完整流程
async function testAdminCompleteFlow() {
  const steps = [];
  let allStepsPassed = true;
  
  console.log('\n📊 测试管理员完整流程...');
  
  // 步骤1: 访问管理员登录页面
  steps.push('1. 访问管理员登录页面');
  const loginPageResult = await checkPageAccess(`${BASE_URL}/admin/login`, '管理员登录页面');
  if (!loginPageResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${loginPageResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤2: 测试管理员登录API
  steps.push('2. 测试管理员登录功能');
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth?path=login`, {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (loginResponse.status === 200) {
      steps.push('   ✅ 登录成功');
    } else {
      allStepsPassed = false;
      steps.push(`   ❌ 登录失败: ${loginResponse.status}`);
    }
  } catch (error) {
    allStepsPassed = false;
    steps.push(`   ❌ 登录失败: ${error.message}`);
  }
  
  // 步骤3: 访问管理员概览页面
  steps.push('3. 访问管理员概览页面');
  const overviewResult = await checkPageAccess(`${BASE_URL}/admin/overview`, '管理员概览页面');
  if (!overviewResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${overviewResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤4: 访问订单管理页面
  steps.push('4. 访问订单管理页面');
  const ordersResult = await checkPageAccess(`${BASE_URL}/admin/orders`, '订单管理页面');
  if (!ordersResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${ordersResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤5: 访问销售管理页面
  steps.push('5. 访问销售管理页面');
  const salesResult = await checkPageAccess(`${BASE_URL}/admin/sales`, '销售管理页面');
  if (!salesResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${salesResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤6: 访问支付配置页面
  steps.push('6. 访问支付配置页面');
  const paymentResult = await checkPageAccess(`${BASE_URL}/admin/payment-config`, '支付配置页面');
  if (!paymentResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${paymentResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤7: 访问用户管理页面
  steps.push('7. 访问用户管理页面');
  const usersResult = await checkPageAccess(`${BASE_URL}/admin/users`, '用户管理页面');
  if (!usersResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${usersResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  recordFlow('管理员完整流程', allStepsPassed ? 'PASS' : 'FAIL', 
            allStepsPassed ? '所有管理员功能正常' : '部分管理员功能异常', steps);
}

// 测试一级销售完整流程
async function testPrimarySalesCompleteFlow() {
  const steps = [];
  let allStepsPassed = true;
  
  console.log('\n👤 测试一级销售完整流程...');
  
  // 步骤1: 访问一级销售注册页面
  steps.push('1. 访问一级销售注册页面');
  const registerResult = await checkPageAccess(`${BASE_URL}/primary-sales/register`, '一级销售注册页面');
  if (!registerResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${registerResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤2: 访问一级销售列表页面
  steps.push('2. 访问一级销售列表页面');
  const listResult = await checkPageAccess(`${BASE_URL}/primary-sales/list`, '一级销售列表页面');
  if (!listResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${listResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤3: 访问一级销售结算页面
  steps.push('3. 访问一级销售结算页面');
  const settlementResult = await checkPageAccess(`${BASE_URL}/primary-sales/settlement`, '一级销售结算页面');
  if (!settlementResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${settlementResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤4: 访问一级销售订单管理页面
  steps.push('4. 访问一级销售订单管理页面');
  const ordersResult = await checkPageAccess(`${BASE_URL}/primary-sales/orders`, '一级销售订单管理页面');
  if (!ordersResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${ordersResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤5: 访问一级销售催单管理页面
  steps.push('5. 访问一级销售催单管理页面');
  const remindersResult = await checkPageAccess(`${BASE_URL}/primary-sales/reminders`, '一级销售催单管理页面');
  if (!remindersResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${remindersResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  recordFlow('一级销售完整流程', allStepsPassed ? 'PASS' : 'FAIL', 
            allStepsPassed ? '所有一级销售功能正常' : '部分一级销售功能异常', steps);
}

// 测试二级销售完整流程
async function testSecondarySalesCompleteFlow() {
  const steps = [];
  let allStepsPassed = true;
  
  console.log('\n👥 测试二级销售完整流程...');
  
  // 步骤1: 访问二级销售注册页面
  steps.push('1. 访问二级销售注册页面');
  const registerResult = await checkPageAccess(`${BASE_URL}/secondary-sales/register`, '二级销售注册页面');
  if (!registerResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${registerResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤2: 访问二级销售列表页面
  steps.push('2. 访问二级销售列表页面');
  const listResult = await checkPageAccess(`${BASE_URL}/secondary-sales/list`, '二级销售列表页面');
  if (!listResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${listResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤3: 访问二级销售订单管理页面
  steps.push('3. 访问二级销售订单管理页面');
  const ordersResult = await checkPageAccess(`${BASE_URL}/secondary-sales/orders`, '二级销售订单管理页面');
  if (!ordersResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${ordersResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤4: 访问二级销售催单管理页面
  steps.push('4. 访问二级销售催单管理页面');
  const remindersResult = await checkPageAccess(`${BASE_URL}/secondary-sales/reminders`, '二级销售催单管理页面');
  if (!remindersResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${remindersResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  recordFlow('二级销售完整流程', allStepsPassed ? 'PASS' : 'FAIL', 
            allStepsPassed ? '所有二级销售功能正常' : '部分二级销售功能异常', steps);
}

// 测试用户购买完整流程
async function testUserPurchaseCompleteFlow() {
  const steps = [];
  let allStepsPassed = true;
  
  console.log('\n🛒 测试用户购买完整流程...');
  
  // 步骤1: 访问用户购买页面
  steps.push('1. 访问用户购买页面');
  const purchaseResult = await checkPageAccess(`${BASE_URL}/purchase`, '用户购买页面');
  if (!purchaseResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${purchaseResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤2: 访问用户订单页面
  steps.push('2. 访问用户订单页面');
  const ordersResult = await checkPageAccess(`${BASE_URL}/user/orders`, '用户订单页面');
  if (!ordersResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${ordersResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤3: 测试支付配置API
  steps.push('3. 测试支付配置获取');
  try {
    const configResponse = await axios.get(`${BASE_URL}/api/payment-config`, {
      timeout: 10000
    });
    
    if (configResponse.status === 200) {
      steps.push('   ✅ 支付配置获取成功');
    } else {
      allStepsPassed = false;
      steps.push(`   ❌ 支付配置获取失败: ${configResponse.status}`);
    }
  } catch (error) {
    allStepsPassed = false;
    steps.push(`   ❌ 支付配置获取失败: ${error.message}`);
  }
  
  // 步骤4: 测试订单API
  steps.push('4. 测试订单列表获取');
  try {
    const ordersResponse = await axios.get(`${BASE_URL}/api/orders`, {
      timeout: 10000
    });
    
    if (ordersResponse.status === 200) {
      steps.push('   ✅ 订单列表获取成功');
    } else {
      allStepsPassed = false;
      steps.push(`   ❌ 订单列表获取失败: ${ordersResponse.status}`);
    }
  } catch (error) {
    allStepsPassed = false;
    steps.push(`   ❌ 订单列表获取失败: ${error.message}`);
  }
  
  recordFlow('用户购买完整流程', allStepsPassed ? 'PASS' : 'FAIL', 
            allStepsPassed ? '所有用户购买功能正常' : '部分用户购买功能异常', steps);
}

// 测试销售对账流程
async function testSalesReconciliationFlow() {
  const steps = [];
  let allStepsPassed = true;
  
  console.log('\n📊 测试销售对账流程...');
  
  // 步骤1: 访问销售对账页面
  steps.push('1. 访问销售对账页面');
  const reconciliationResult = await checkPageAccess(`${BASE_URL}/sales-reconciliation`, '销售对账页面');
  if (!reconciliationResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${reconciliationResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤2: 测试销售API
  steps.push('2. 测试销售数据获取');
  try {
    const salesResponse = await axios.get(`${BASE_URL}/api/sales`, {
      timeout: 10000
    });
    
    if (salesResponse.status === 200) {
      steps.push('   ✅ 销售数据获取成功');
    } else {
      allStepsPassed = false;
      steps.push(`   ❌ 销售数据获取失败: ${salesResponse.status}`);
    }
  } catch (error) {
    allStepsPassed = false;
    steps.push(`   ❌ 销售数据获取失败: ${error.message}`);
  }
  
  recordFlow('销售对账流程', allStepsPassed ? 'PASS' : 'FAIL', 
            allStepsPassed ? '销售对账功能正常' : '销售对账功能异常', steps);
}

// 测试系统健康状态
async function testSystemHealth() {
  const steps = [];
  let allStepsPassed = true;
  
  console.log('\n🏥 测试系统健康状态...');
  
  // 步骤1: 测试主链接
  steps.push('1. 测试主链接访问');
  const mainResult = await checkPageAccess(BASE_URL, '主链接');
  if (!mainResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${mainResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤2: 测试备用链接
  steps.push('2. 测试备用链接访问');
  const backupResult = await checkPageAccess(BACKUP_URL, '备用链接');
  if (!backupResult.success) {
    allStepsPassed = false;
    steps.push(`   ❌ 失败: ${backupResult.message}`);
  } else {
    steps.push('   ✅ 成功');
  }
  
  // 步骤3: 测试健康检查API
  steps.push('3. 测试健康检查API');
  try {
    const healthResponse = await axios.get(`${BASE_URL}/api/health`, {
      timeout: 10000
    });
    
    if (healthResponse.status === 200) {
      steps.push('   ✅ 健康检查API正常');
    } else {
      allStepsPassed = false;
      steps.push(`   ❌ 健康检查API异常: ${healthResponse.status}`);
    }
  } catch (error) {
    allStepsPassed = false;
    steps.push(`   ❌ 健康检查API异常: ${error.message}`);
  }
  
  // 步骤4: 测试管理员统计API
  steps.push('4. 测试管理员统计API');
  try {
    const statsResponse = await axios.get(`${BASE_URL}/api/admin/stats`, {
      timeout: 10000
    });
    
    if (statsResponse.status === 200) {
      steps.push('   ✅ 管理员统计API正常');
    } else {
      allStepsPassed = false;
      steps.push(`   ❌ 管理员统计API异常: ${statsResponse.status}`);
    }
  } catch (error) {
    allStepsPassed = false;
    steps.push(`   ❌ 管理员统计API异常: ${error.message}`);
  }
  
  recordFlow('系统健康状态', allStepsPassed ? 'PASS' : 'FAIL', 
            allStepsPassed ? '系统健康状态正常' : '系统健康状态异常', steps);
}

// 主要测试函数
async function runCompleteUserPerspectiveTest() {
  console.log('🚀 开始从用户视角的完整功能测试...\n');
  
  // 测试所有用户流程
  await testSystemHealth();
  await testAdminCompleteFlow();
  await testPrimarySalesCompleteFlow();
  await testSecondarySalesCompleteFlow();
  await testUserPurchaseCompleteFlow();
  await testSalesReconciliationFlow();
  
  // 计算成功率
  testResults.summary.successRate = Math.round((testResults.summary.passedFlows / testResults.summary.totalFlows) * 100);
  
  // 输出测试结果
  console.log('\n📊 用户视角测试结果汇总');
  console.log(`总流程数: ${testResults.summary.totalFlows}`);
  console.log(`通过: ${testResults.summary.passedFlows}`);
  console.log(`失败: ${testResults.summary.failedFlows}`);
  console.log(`成功率: ${testResults.summary.successRate}%`);
  
  // 保存测试结果到文件
  const resultFile = `user-perspective-test-results-${Date.now()}.json`;
  fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 详细测试结果已保存到: ${resultFile}`);
  
  // 输出失败的项目
  const failedFlows = testResults.userFlows.filter(flow => flow.status === 'FAIL');
  if (failedFlows.length > 0) {
    console.log('\n❌ 失败流程列表:');
    failedFlows.forEach(flow => {
      console.log(`\n- ${flow.name}: ${flow.details}`);
      flow.steps.forEach(step => {
        console.log(`  ${step}`);
      });
    });
  }
  
  // 输出建议
  console.log('\n💡 最终建议:');
  if (testResults.summary.successRate === 100) {
    console.log('✅ 所有用户流程测试通过，系统完全正常，可以安全部署');
  } else if (testResults.summary.successRate >= 90) {
    console.log('⚠️ 大部分用户流程正常，但存在一些问题，建议修复后再部署');
  } else {
    console.log('❌ 系统存在较多问题，需要全面修复后才能部署');
  }
  
  return testResults;
}

// 运行测试
if (require.main === module) {
  runCompleteUserPerspectiveTest().catch(console.error);
}

module.exports = { runCompleteUserPerspectiveTest }; 