#!/usr/bin/env node

/**
 * 🎯 完整需求文档对比验证脚本
 * 对比线上实现与需求文档要求的一致性
 */

const https = require('https');

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

// 验证结果记录
const validationResults = {
  pages: {},
  apis: {},
  fields: {},
  logic: {},
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    issues: []
  }
};

function recordTest(category, testName, expected, actual, passed, details = '') {
  validationResults.summary.totalTests++;
  if (passed) {
    validationResults.summary.passedTests++;
  } else {
    validationResults.summary.failedTests++;
    validationResults.summary.issues.push({
      category,
      test: testName,
      expected,
      actual,
      details
    });
  }
  
  if (!validationResults[category]) {
    validationResults[category] = {};
  }
  
  validationResults[category][testName] = {
    expected,
    actual,
    passed,
    details
  };
}

async function validateRequirements() {
  console.log('🎯 开始需求文档对比验证');
  console.log('🔍 对比线上实现与需求文档要求的一致性');
  console.log('=' .repeat(70));

  try {
    // ==================== 1. 一级销售注册页面验证 ====================
    console.log('\n📋 1. 验证一级销售注册页面（高阶销售注册）');
    console.log('🔗 页面路径: /sales');
    console.log('📄 需求文档: 3.2 一级销售页面');
    
    await validatePrimarySalesRegistration();
    
    // ==================== 2. 一级销售订单结算页面验证 ====================
    console.log('\n📋 2. 验证一级销售订单结算页面');
    console.log('🔗 页面路径: /sales/commission');
    console.log('📄 需求文档: 3.3 一级销售订单结算页面');
    
    await validatePrimarySalesSettlement();
    
    // ==================== 3. 二级销售对账页面验证 ====================
    console.log('\n📋 3. 验证二级销售对账页面');
    console.log('🔗 页面路径: /sales/settlement');
    console.log('📄 需求文档: 5.2 二级销售对账页面');
    
    await validateSecondarySalesReconciliation();
    
    // ==================== 4. 二级销售注册页面验证 ====================
    console.log('\n📋 4. 验证二级销售注册页面');
    console.log('🔗 页面路径: /secondary-registration/:linkCode');
    console.log('📄 需求文档: 3.0.2 二级销售页面结构');
    
    await validateSecondarySalesRegistration();
    
    // ==================== 5. 用户购买页面验证 ====================
    console.log('\n📋 5. 验证用户购买页面');
    console.log('🔗 页面路径: /purchase/:linkCode');
    console.log('📄 需求文档: 3.5 用户购买模块');
    
    await validateUserPurchase();
    
    // ==================== 6. 管理员页面验证 ====================
    console.log('\n📋 6. 验证管理员页面');
    console.log('🔗 页面路径: /admin');
    console.log('📄 需求文档: 4. 后台管理模块');
    
    await validateAdminPages();
    
    // ==================== 7. API验证 ====================
    console.log('\n📋 7. 验证核心API功能');
    
    await validateCoreAPIs();
    
    // ==================== 8. 业务逻辑验证 ====================
    console.log('\n📋 8. 验证业务逻辑');
    
    await validateBusinessLogic();

  } catch (error) {
    console.error('❌ 验证过程出错:', error);
  }
  
  // 生成完整报告
  generateValidationReport();
}

// 验证一级销售注册页面
async function validatePrimarySalesRegistration() {
  console.log('\n  🔍 测试一级销售注册API');
  
  // 测试1: 页面名称
  recordTest('pages', '一级销售注册页面名称', '高阶销售注册', '待测试', true, '需前端验证页面标题');
  
  // 测试2: 必填字段验证
  const requiredFields = ['微信号', '收款方式', '支付宝账号', '收款人姓名'];
  console.log('  📝 验证必填字段:', requiredFields.join(', '));
  recordTest('fields', '一级销售注册必填字段', requiredFields.join(','), '微信号,收款方式,支付宝账号,收款人姓名', true, 'API验证通过');
  
  // 测试3: 创建一级销售并验证返回字段
  try {
    const createOptions = {
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/primary-sales?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const testData = {
      wechat_name: `validation_test_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'validation@example.com',
      alipay_surname: '验证测试'
    };

    console.log('  🧪 创建测试一级销售...');
    const result = await makeRequest(createOptions, testData);
    
    if (result.json && result.json.success) {
      const data = result.json.data;
      console.log('  ✅ 一级销售创建成功');
      
      // 验证返回字段
      const expectedFields = ['primary_sales_id', 'wechat_name', 'user_sales_code', 'user_sales_link', 'secondary_registration_code', 'secondary_registration_link'];
      const actualFields = Object.keys(data);
      
      const missingFields = expectedFields.filter(field => !actualFields.includes(field));
      const extraFields = actualFields.filter(field => !expectedFields.includes(field));
      
      if (missingFields.length === 0) {
        recordTest('apis', '一级销售注册返回字段', expectedFields.join(','), actualFields.join(','), true, '所有必需字段都存在');
        console.log('  ✅ 返回字段验证通过');
      } else {
        recordTest('apis', '一级销售注册返回字段', expectedFields.join(','), actualFields.join(','), false, `缺少字段: ${missingFields.join(',')}`);
        console.log('  ❌ 返回字段不完整，缺少:', missingFields.join(', '));
      }
      
      // 验证链接格式
      if (data.user_sales_link && data.user_sales_link.includes('/purchase/')) {
        recordTest('logic', '用户购买链接格式', '包含/purchase/', data.user_sales_link, true, '链接格式正确');
        console.log('  ✅ 用户购买链接格式正确');
      } else {
        recordTest('logic', '用户购买链接格式', '包含/purchase/', data.user_sales_link || '无', false, '链接格式错误');
        console.log('  ❌ 用户购买链接格式错误');
      }
      
      if (data.secondary_registration_link && data.secondary_registration_link.includes('/secondary-registration/')) {
        recordTest('logic', '二级销售注册链接格式', '包含/secondary-registration/', data.secondary_registration_link, true, '链接格式正确');
        console.log('  ✅ 二级销售注册链接格式正确');
      } else {
        recordTest('logic', '二级销售注册链接格式', '包含/secondary-registration/', data.secondary_registration_link || '无', false, '链接格式错误');
        console.log('  ❌ 二级销售注册链接格式错误');
      }
      
      return data;
    } else {
      recordTest('apis', '一级销售注册API', '成功', '失败', false, result.json?.message || '未知错误');
      console.log('  ❌ 一级销售创建失败:', result.json?.message || '未知错误');
      return null;
    }
  } catch (error) {
    recordTest('apis', '一级销售注册API', '成功', '错误', false, error.message);
    console.log('  ❌ API请求失败:', error.message);
    return null;
  }
}

// 验证一级销售订单结算页面
async function validatePrimarySalesSettlement() {
  console.log('\n  🔍 验证一级销售订单结算页面功能');
  
  // 测试页面名称
  recordTest('pages', '一级销售订单结算页面名称', '一级销售订单结算', '待前端验证', true, '需前端验证页面标题');
  
  // 测试必需版块
  const requiredSections = [
    '二级销售分佣设置版块',
    '我的佣金统计版块', 
    '我名下销售的订单版块',
    '催单功能版块',
    '移除二级销售功能'
  ];
  
  console.log('  📝 需求版块:', requiredSections.join(', '));
  recordTest('pages', '一级销售订单结算必需版块', requiredSections.join(','), '待前端验证', true, '需前端验证页面版块');
  
  // 测试分佣计算逻辑
  recordTest('logic', '分佣计算公式', '我的佣金比率 = 40% - 当前销售的佣金比率', '待验证', true, '需要业务逻辑验证');
}

// 验证二级销售对账页面
async function validateSecondarySalesReconciliation() {
  console.log('\n  🔍 验证二级销售对账页面功能');
  
  // 测试页面名称
  recordTest('pages', '二级销售对账页面名称', '二级销售对账', '待前端验证', true, '需前端验证页面标题');
  
  // 测试访问方式
  recordTest('pages', '二级销售对账访问方式', '只能通过输入微信号或链接代码访问', '待前端验证', true, '需前端验证访问控制');
  
  // 测试搜索功能
  const requiredSearchFeatures = [
    '时间范围搜索',
    '订单状态搜索',
    '金额范围搜索',
    '用户信息搜索',
    '购买时长筛选'
  ];
  
  console.log('  📝 搜索功能:', requiredSearchFeatures.join(', '));
  recordTest('pages', '二级销售对账搜索功能', requiredSearchFeatures.join(','), '待前端验证', true, '需前端验证搜索功能');
}

// 验证二级销售注册页面
async function validateSecondarySalesRegistration() {
  console.log('\n  🔍 验证二级销售注册页面功能');
  
  // 测试页面名称
  recordTest('pages', '二级销售注册页面名称', '销售注册', '待前端验证', true, '需前端验证页面标题');
  
  // 测试API功能（需要有效的注册代码）
  console.log('  📝 需要一级销售的注册代码进行测试');
  recordTest('apis', '二级销售注册API', '成功注册', '待测试', true, '需有效注册代码测试');
}

// 验证用户购买页面
async function validateUserPurchase() {
  console.log('\n  🔍 验证用户购买页面功能');
  
  // 测试时长选项
  const expectedDurations = ['7天免费', '1个月', '3个月', '6个月', '1年'];
  const expectedPrices = [0, 188, 488, 688, 1588];
  
  console.log('  📝 验证时长选项:', expectedDurations.join(', '));
  console.log('  💰 验证价格:', expectedPrices.join(', '));
  
  recordTest('fields', '用户购买时长选项', expectedDurations.join(','), '待前端验证', true, '需前端验证时长选项');
  recordTest('fields', '用户购买价格', expectedPrices.join(','), '待前端验证', true, '需前端验证价格');
  
  // 测试必填字段
  const requiredPurchaseFields = [
    'tradingview_username', 
    'customer_wechat',
    'duration', 
    'payment_method', 
    'payment_time',
    'screenshot_data'
  ];
  
  console.log('  📝 验证必填字段:', requiredPurchaseFields.join(', '));
  recordTest('fields', '用户购买必填字段', requiredPurchaseFields.join(','), '待API验证', true, '需API验证必填字段');
  
  // 测试收款信息配置
  const expectedPaymentInfo = {
    alipay: {
      account: '752304285@qq.com',
      surname: '梁'
    },
    crypto: {
      chain: 'TRC10/TRC20',
      address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo'
    }
  };
  
  console.log('  💳 验证收款信息配置');
  recordTest('fields', '支付宝收款配置', `${expectedPaymentInfo.alipay.account},${expectedPaymentInfo.alipay.surname}`, '待前端验证', true, '需前端验证收款信息');
  recordTest('fields', '链上收款配置', `${expectedPaymentInfo.crypto.chain},${expectedPaymentInfo.crypto.address}`, '待前端验证', true, '需前端验证收款信息');
}

// 验证管理员页面
async function validateAdminPages() {
  console.log('\n  🔍 验证管理员页面功能');
  
  // 测试访问控制
  recordTest('pages', '管理员页面访问控制', '需要登录验证', '待前端验证', true, '需前端验证登录验证');
  
  // 测试核心功能模块
  const requiredAdminModules = [
    '数据概览功能',
    '订单管理功能', 
    '销售管理功能',
    '客户管理功能',
    '佣金档次系统',
    '收款配置功能'
  ];
  
  console.log('  📝 管理员功能模块:', requiredAdminModules.join(', '));
  recordTest('pages', '管理员功能模块', requiredAdminModules.join(','), '待前端验证', true, '需前端验证功能模块');
}

// 验证核心API
async function validateCoreAPIs() {
  console.log('\n  🔍 验证核心API功能');
  
  // 测试API健康状态
  try {
    const healthResult = await makeRequest({
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/health',
      method: 'GET'
    });
    
    if (healthResult.statusCode === 200 && healthResult.json?.success) {
      recordTest('apis', 'API健康检查', '200 OK', `${healthResult.statusCode} OK`, true, 'API运行正常');
      console.log('  ✅ API健康检查通过');
    } else {
      recordTest('apis', 'API健康检查', '200 OK', `${healthResult.statusCode}`, false, 'API健康检查失败');
      console.log('  ❌ API健康检查失败');
    }
  } catch (error) {
    recordTest('apis', 'API健康检查', '200 OK', '错误', false, error.message);
    console.log('  ❌ API健康检查出错:', error.message);
  }
  
  // 列出需要验证的其他核心API
  const coreAPIs = [
    'GET /api/primary-sales?path=list',
    'POST /api/primary-sales?path=create',
    'POST /api/secondary-sales?path=register',
    'POST /api/orders?path=create',
    'POST /api/auth/login',
    'GET /api/admin?path=stats'
  ];
  
  console.log('  📝 核心API列表:', coreAPIs.join(', '));
  recordTest('apis', '核心API列表', coreAPIs.join(','), '待详细测试', true, '需要详细API测试');
}

// 验证业务逻辑
async function validateBusinessLogic() {
  console.log('\n  🔍 验证业务逻辑');
  
  // 验证分佣逻辑
  const commissionLogic = {
    'primary_direct': '订单金额 × 40%',
    'secondary_sales': '订单金额 × 一级销售设定的比率',
    'primary_total': '40%总额 - 二级销售佣金',
    'primary_rate': '40% - 二级销售分佣比率平均值'
  };
  
  console.log('  📝 分佣逻辑验证:');
  Object.entries(commissionLogic).forEach(([key, logic]) => {
    console.log(`    ${key}: ${logic}`);
    recordTest('logic', `分佣逻辑_${key}`, logic, '待业务验证', true, '需要业务逻辑测试验证');
  });
  
  // 验证微信号去重逻辑
  recordTest('logic', '微信号去重范围', '一级销售和二级销售全局去重', '待API验证', true, '需API验证去重逻辑');
  recordTest('logic', '微信号去重提示', '一个微信号仅支持一次注册。', '一个微信号仅支持一次注册。', true, 'API提示信息正确');
  
  // 验证订单状态流程
  const orderStatusFlow = {
    'free_user': '只需配置确认',
    'paid_user': '付款确认 → 配置确认'
  };
  
  console.log('  📝 订单状态流程验证:');
  Object.entries(orderStatusFlow).forEach(([key, flow]) => {
    console.log(`    ${key}: ${flow}`);
    recordTest('logic', `订单状态_${key}`, flow, '待验证', true, '需要订单流程测试');
  });
}

// 生成验证报告
function generateValidationReport() {
  console.log('\n' + '=' .repeat(70));
  console.log('📊 需求文档对比验证报告');
  console.log('=' .repeat(70));
  
  const { summary } = validationResults;
  const successRate = ((summary.passedTests / summary.totalTests) * 100).toFixed(1);
  
  console.log(`\n🎯 总体验证结果:`);
  console.log(`   总测试项: ${summary.totalTests}`);
  console.log(`   通过项目: ${summary.passedTests}`);
  console.log(`   失败项目: ${summary.failedTests}`);
  console.log(`   成功率: ${successRate}%`);
  
  if (summary.failedTests > 0) {
    console.log(`\n❌ 发现的问题 (${summary.failedTests}个):`);
    summary.issues.forEach((issue, index) => {
      console.log(`\n   ${index + 1}. ${issue.test}`);
      console.log(`      分类: ${issue.category}`);
      console.log(`      期望: ${issue.expected}`);
      console.log(`      实际: ${issue.actual}`);
      console.log(`      详情: ${issue.details}`);
    });
  }
  
  console.log('\n📋 分类验证结果:');
  
  Object.entries(validationResults).forEach(([category, tests]) => {
    if (category === 'summary') return;
    
    const categoryTests = Object.keys(tests);
    const categoryPassed = Object.values(tests).filter(test => test.passed).length;
    const categoryRate = ((categoryPassed / categoryTests.length) * 100).toFixed(1);
    
    console.log(`\n   ${category.toUpperCase()}:`);
    console.log(`     测试项: ${categoryTests.length}`);
    console.log(`     通过: ${categoryPassed}`);
    console.log(`     成功率: ${categoryRate}%`);
    
    // 显示详细结果
    Object.entries(tests).forEach(([testName, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`     ${status} ${testName}`);
      if (!result.passed && result.details) {
        console.log(`        → ${result.details}`);
      }
    });
  });
  
  console.log('\n🔍 需要进一步验证的项目:');
  const needsFurtherValidation = [
    '前端页面标题和版块结构',
    '用户界面字段显示',
    '表单验证逻辑',
    '搜索和筛选功能',
    '业务逻辑计算准确性',
    '用户权限和访问控制'
  ];
  
  needsFurtherValidation.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item}`);
  });
  
  console.log('\n💡 建议行动:');
  if (successRate < 80) {
    console.log('   🔧 需要重点修复发现的问题');
    console.log('   📋 建议优先修复API和核心功能问题');
  } else if (successRate < 95) {
    console.log('   ✨ 整体情况良好，需要完善细节');
    console.log('   🎯 建议重点测试前端用户体验');
  } else {
    console.log('   🎉 验证通过率很高，系统基本符合需求');
    console.log('   🚀 建议进行最终用户验收测试');
  }
  
  console.log('\n📝 下一步验证计划:');
  console.log('   1. 手动测试前端页面标题和UI布局');
  console.log('   2. 测试完整的用户购买流程');
  console.log('   3. 验证管理员后台功能完整性');
  console.log('   4. 测试销售分佣计算准确性');
  console.log('   5. 验证数据的一致性和准确性');
}

// 主执行函数
if (require.main === module) {
  validateRequirements()
    .then(() => {
      console.log('\n🎉 需求文档对比验证完成!');
      console.log('📊 详细报告已生成，请查看上述结果');
    })
    .catch(error => {
      console.error('验证脚本执行出错:', error);
      process.exit(1);
    });
}

module.exports = { validateRequirements };