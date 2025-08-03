#!/usr/bin/env node

/**
 * 🎯 前端UI需求文档验证脚本
 * 详细验证前端页面字段、布局、逻辑是否符合需求文档
 */

const https = require('https');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

const validationResults = {
  issues: [],
  passed: [],
  warnings: []
};

function reportIssue(category, page, expected, actual, severity = 'error') {
  const item = {
    category,
    page,
    expected,
    actual,
    severity
  };
  
  if (severity === 'error') {
    validationResults.issues.push(item);
  } else if (severity === 'warning') {
    validationResults.warnings.push(item);
  } else {
    validationResults.passed.push(item);
  }
}

async function validateFrontendUI() {
  console.log('🎯 前端UI需求文档验证');
  console.log('🔍 详细检查页面字段、布局、逻辑是否符合需求文档');
  console.log('=' .repeat(70));

  try {
    // 获取基础HTML页面用于分析
    console.log('\n📋 获取前端应用基础信息...');
    const baseResult = await makeRequest('https://zhixing-seven.vercel.app/');
    
    if (baseResult.statusCode !== 200) {
      reportIssue('访问', '基础页面', '200 OK', `${baseResult.statusCode}`, 'error');
      console.log('❌ 无法访问前端应用');
      return;
    }
    
    console.log('✅ 前端应用可正常访问');
    
    // 分析HTML结构
    const html = baseResult.body;
    
    // 1. 验证应用基础结构
    await validateBasicStructure(html);
    
    // 2. 验证路由配置（通过分析代码）
    await validateRouteConfiguration();
    
    // 3. 验证页面字段和组件（需要具体测试）
    await validatePageFields();
    
    // 4. 验证API集成
    await validateAPIIntegration();
    
    // 5. 验证业务逻辑
    await validateBusinessLogic();

  } catch (error) {
    console.error('❌ 验证过程出错:', error);
    reportIssue('系统', '验证脚本', '正常执行', error.message, 'error');
  }
  
  generateUIValidationReport();
}

async function validateBasicStructure(html) {
  console.log('\n📋 1. 验证应用基础结构');
  
  // 检查React应用根元素
  if (html.includes('<div id="root">')) {
    console.log('  ✅ React应用根元素存在');
    reportIssue('结构', '基础', 'React根元素存在', '存在', 'success');
  } else {
    console.log('  ❌ React应用根元素缺失');
    reportIssue('结构', '基础', 'React根元素存在', '缺失', 'error');
  }
  
  // 检查应用标题
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const actualTitle = titleMatch ? titleMatch[1] : '无标题';
  
  console.log(`  📝 应用标题: ${actualTitle}`);
  if (actualTitle.includes('知行财库') || actualTitle.includes('Zhixing')) {
    reportIssue('内容', '基础', '包含项目名称', actualTitle, 'success');
  } else {
    reportIssue('内容', '基础', '包含项目名称', actualTitle, 'warning');
  }
  
  // 检查构建资源
  if (html.includes('/static/js/') && html.includes('/static/css/')) {
    console.log('  ✅ 构建资源文件存在');
    reportIssue('结构', '基础', '构建资源存在', '存在', 'success');
  } else {
    console.log('  ❌ 构建资源文件缺失');
    reportIssue('结构', '基础', '构建资源存在', '缺失', 'error');
  }
}

async function validateRouteConfiguration() {
  console.log('\n📋 2. 验证路由配置');
  
  // 需求文档中的路由要求
  const requiredRoutes = {
    '/sales': '高阶销售注册页面',
    '/sales/commission': '一级销售订单结算页面',
    '/sales/settlement': '二级销售对账页面',
    '/secondary-registration/:linkCode': '二级销售注册页面',
    '/purchase/:linkCode': '用户购买页面',
    '/admin': '管理员登录页面',
    '/admin/dashboard': '管理员后台页面'
  };
  
  console.log('  📝 需求文档要求的路由:');
  Object.entries(requiredRoutes).forEach(([route, description]) => {
    console.log(`    ${route} → ${description}`);
    reportIssue('路由', '配置', `${route}存在`, '待前端验证', 'warning');
  });
}

async function validatePageFields() {
  console.log('\n📋 3. 验证页面字段和组件');
  
  // 3.1 验证一级销售注册页面字段
  console.log('\n  📝 一级销售注册页面（/sales）字段要求:');
  const primarySalesFields = {
    'wechat_name': { label: '微信号', required: true, validation: '去重校验' },
    'payment_method': { label: '收款方式', required: true, options: ['支付宝', '线上地址码'] },
    'alipay_account': { label: '支付宝账号', required: true, condition: '当选择支付宝时' },
    'alipay_surname': { label: '收款人姓名', required: true, condition: '当选择支付宝时' },
    'chain_name': { label: '链名', required: true, condition: '当选择线上地址码时' },
    'payment_address': { label: '线上地址码', required: true, condition: '当选择线上地址码时' }
  };
  
  Object.entries(primarySalesFields).forEach(([field, config]) => {
    console.log(`    ${field}: ${config.label} (${config.required ? '必填' : '可选'})`);
    if (config.condition) console.log(`      条件: ${config.condition}`);
    if (config.options) console.log(`      选项: ${config.options.join(', ')}`);
    if (config.validation) console.log(`      验证: ${config.validation}`);
    
    reportIssue('字段', '一级销售注册', `${field}字段存在`, '待前端验证', 'warning');
  });
  
  // 验证链接生成功能
  console.log('\n  📝 一级销售注册页面链接生成要求:');
  const linkGenerationRequirements = [
    '生成二级销售下挂链接（用于二级销售注册）',
    '生成面向用户的销售链接（用于一级销售直接销售）',
    '显示用户购买链接和代码',
    '显示二级销售注册链接和代码',
    '提供复制功能',
    '提供生成新链接功能'
  ];
  
  linkGenerationRequirements.forEach((requirement, index) => {
    console.log(`    ${index + 1}. ${requirement}`);
    reportIssue('功能', '一级销售注册', requirement, '待前端验证', 'warning');
  });
  
  // 3.2 验证用户购买页面字段
  console.log('\n  📝 用户购买页面（/purchase/:linkCode）字段要求:');
  const purchaseFields = {
    'tradingview_username': { label: 'TradingView用户名', required: true, validation: '唯一性校验' },
    'customer_wechat': { label: '微信号', required: true },
    'duration': { 
      label: '购买时长', 
      required: true, 
      options: ['7天免费(0元)', '1个月(188元)', '3个月(488元)', '6个月(688元)', '1年(1588元)']
    },
    'purchase_type': { 
      label: '购买方式', 
      required: true, 
      options: ['即时购买', '提前购买']
    },
    'payment_method': { 
      label: '付款方式', 
      required: true, 
      options: ['支付宝', '线上地址码']
    },
    'payment_time': { label: '付款时间', required: true, validation: '不能晚于当前时间' },
    'screenshot_data': { label: '付款截图', required: true, validation: '图片格式，10MB以内' }
  };
  
  Object.entries(purchaseFields).forEach(([field, config]) => {
    console.log(`    ${field}: ${config.label} (${config.required ? '必填' : '可选'})`);
    if (config.options) console.log(`      选项: ${config.options.join(', ')}`);
    if (config.validation) console.log(`      验证: ${config.validation}`);
    
    reportIssue('字段', '用户购买', `${field}字段存在`, '待前端验证', 'warning');
  });
  
  // 验证收款信息显示
  console.log('\n  📝 用户购买页面收款信息显示要求:');
  const paymentInfoRequirements = {
    alipay: {
      account: '752304285@qq.com',
      surname: '梁',
      display: '显示支付宝账号和收款人姓氏'
    },
    crypto: {
      chain: 'TRC10/TRC20',
      address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
      display: '显示QR码和收款地址'
    }
  };
  
  Object.entries(paymentInfoRequirements).forEach(([method, config]) => {
    console.log(`    ${method}: ${config.display}`);
    if (config.account) console.log(`      账号: ${config.account}`);
    if (config.surname) console.log(`      姓氏: ${config.surname}`);
    if (config.chain) console.log(`      链名: ${config.chain}`);
    if (config.address) console.log(`      地址: ${config.address}`);
    
    reportIssue('功能', '用户购买', `${method}收款信息显示`, '待前端验证', 'warning');
  });
}

async function validateAPIIntegration() {
  console.log('\n📋 4. 验证API集成');
  
  // 测试关键API的调用和响应
  const criticalAPIs = [
    {
      name: '一级销售创建',
      method: 'POST',
      path: '/api/primary-sales?path=create',
      expectedResponse: ['primary_sales_id', 'user_sales_link', 'secondary_registration_link']
    },
    {
      name: '一级销售列表',
      method: 'GET', 
      path: '/api/primary-sales?path=list',
      expectedResponse: ['data', 'success']
    },
    {
      name: '订单创建',
      method: 'POST',
      path: '/api/orders?path=create',
      expectedResponse: ['success', 'message']
    }
  ];
  
  for (const api of criticalAPIs) {
    console.log(`  📝 ${api.name} API (${api.method} ${api.path})`);
    console.log(`    期望响应字段: ${api.expectedResponse.join(', ')}`);
    reportIssue('API', api.name, `响应包含${api.expectedResponse.join(',')}`, '待API测试', 'warning');
  }
}

async function validateBusinessLogic() {
  console.log('\n📋 5. 验证业务逻辑');
  
  // 5.1 验证分佣计算逻辑
  console.log('\n  📝 分佣计算逻辑验证:');
  const commissionLogic = [
    '一级销售直接销售: 订单金额 × 40%',
    '二级销售销售: 订单金额 × 一级销售设定的比率',
    '一级销售总佣金: 40%总额 - 二级销售佣金',
    '一级销售整体佣金比率: 40% - 二级销售分佣比率平均值'
  ];
  
  commissionLogic.forEach((logic, index) => {
    console.log(`    ${index + 1}. ${logic}`);
    reportIssue('逻辑', '分佣计算', logic, '待业务验证', 'warning');
  });
  
  // 5.2 验证数据验证逻辑
  console.log('\n  📝 数据验证逻辑:');
  const validationLogic = [
    '微信号全局去重（一级销售+二级销售）',
    'TradingView用户名唯一性校验',
    '付款时间不能晚于当前时间',
    '付款截图必填且格式正确',
    '链接代码唯一性保证'
  ];
  
  validationLogic.forEach((logic, index) => {
    console.log(`    ${index + 1}. ${logic}`);
    reportIssue('逻辑', '数据验证', logic, '待前端验证', 'warning');
  });
  
  // 5.3 验证订单状态流程
  console.log('\n  📝 订单状态流程:');
  const orderStatusFlow = [
    '7天免费用户: 只需配置确认',
    '付费用户: 付款确认 → 配置确认（两个步骤）',
    '状态包括: 待付款确认、待配置确认、已确认'
  ];
  
  orderStatusFlow.forEach((flow, index) => {
    console.log(`    ${index + 1}. ${flow}`);
    reportIssue('逻辑', '订单状态', flow, '待系统验证', 'warning');
  });
}

function generateUIValidationReport() {
  console.log('\n' + '=' .repeat(70));
  console.log('📊 前端UI需求文档验证报告');
  console.log('=' .repeat(70));
  
  const totalIssues = validationResults.issues.length;
  const totalWarnings = validationResults.warnings.length;
  const totalPassed = validationResults.passed.length;
  const totalTests = totalIssues + totalWarnings + totalPassed;
  
  console.log(`\n🎯 验证统计:`);
  console.log(`   总验证项: ${totalTests}`);
  console.log(`   通过项目: ${totalPassed}`);
  console.log(`   警告项目: ${totalWarnings} (需要手动验证)`);
  console.log(`   错误项目: ${totalIssues}`);
  
  if (totalIssues > 0) {
    console.log(`\n❌ 发现的错误 (${totalIssues}个):`);
    validationResults.issues.forEach((issue, index) => {
      console.log(`\n   ${index + 1}. [${issue.category}] ${issue.page}`);
      console.log(`      期望: ${issue.expected}`);
      console.log(`      实际: ${issue.actual}`);
    });
  }
  
  if (totalWarnings > 0) {
    console.log(`\n⚠️ 需要手动验证的项目 (${totalWarnings}个):`);
    
    // 按类别分组显示
    const warningsByCategory = {};
    validationResults.warnings.forEach(warning => {
      if (!warningsByCategory[warning.category]) {
        warningsByCategory[warning.category] = [];
      }
      warningsByCategory[warning.category].push(warning);
    });
    
    Object.entries(warningsByCategory).forEach(([category, warnings]) => {
      console.log(`\n   📋 ${category.toUpperCase()} (${warnings.length}项):`);
      warnings.forEach((warning, index) => {
        console.log(`     ${index + 1}. ${warning.page}: ${warning.expected}`);
      });
    });
  }
  
  console.log('\n🔍 详细前端验证清单:');
  
  console.log('\n   📱 一级销售注册页面 (/sales):');
  console.log('     □ 页面标题显示"高阶销售注册"');
  console.log('     □ 微信号输入框存在且有去重验证');
  console.log('     □ 收款方式选择（支付宝/线上地址码）');
  console.log('     □ 支付宝字段：账号、收款人姓名（条件显示）');
  console.log('     □ 线上地址码字段：链名、地址（条件显示）');
  console.log('     □ 生成链接后显示两个卡片：');
  console.log('       □ 💰 用户购买链接（绿色卡片）');
  console.log('       □ 👥 二级销售注册链接（橙色卡片）');
  console.log('     □ 每个卡片包含链接、代码、复制按钮');
  console.log('     □ 生成新链接按钮存在');
  
  console.log('\n   📱 一级销售订单结算页面 (/sales/commission):');
  console.log('     □ 页面标题显示"一级销售订单结算"');
  console.log('     □ 二级销售分佣设置版块');
  console.log('     □ 我的佣金统计版块');
  console.log('     □ 我名下销售的订单版块');
  console.log('     □ 催单功能版块');
  console.log('     □ 移除二级销售功能');
  
  console.log('\n   📱 二级销售对账页面 (/sales/settlement):');
  console.log('     □ 页面标题显示"二级销售对账"');
  console.log('     □ 只能通过输入微信号或链接代码访问');
  console.log('     □ 搜索功能完整（时间、状态、金额、用户、时长）');
  console.log('     □ 显示该销售的所有订单信息');
  
  console.log('\n   📱 用户购买页面 (/purchase/:linkCode):');
  console.log('     □ TradingView用户名输入框（必填）');
  console.log('     □ 微信号输入框（必填）');
  console.log('     □ 时长选择（7天免费、1月188、3月488、6月688、1年1588）');
  console.log('     □ 购买方式选择（即时购买、提前购买）');
  console.log('     □ 付款方式选择（支付宝、线上地址码）');
  console.log('     □ 付款时间选择器（必填）');
  console.log('     □ 付款截图上传（必填，10MB限制）');
  console.log('     □ 收款信息正确显示：');
  console.log('       □ 支付宝：752304285@qq.com，收款人：梁');
  console.log('       □ 链上：TRC10/TRC20，TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo');
  
  console.log('\n   📱 管理员页面 (/admin):');
  console.log('     □ 登录页面存在且功能正常');
  console.log('     □ 数据概览功能');
  console.log('     □ 订单管理功能');
  console.log('     □ 销售管理功能');
  console.log('     □ 客户管理功能');
  console.log('     □ 佣金档次系统');
  console.log('     □ 收款配置功能');
  
  console.log('\n💡 验证建议:');
  console.log('   1. 🖱️ 手动访问每个页面验证UI布局');
  console.log('   2. 📝 测试所有表单字段和验证逻辑');
  console.log('   3. 🔗 测试链接生成和复制功能');
  console.log('   4. 🧮 验证价格计算和时间计算');
  console.log('   5. 📊 测试数据展示和搜索功能');
  console.log('   6. 🔐 验证权限控制和访问限制');
  
  console.log('\n🚀 下一步行动:');
  if (totalIssues > 0) {
    console.log('   ❗ 优先修复发现的错误问题');
  }
  console.log('   📋 使用上述清单进行系统的手动验证');
  console.log('   🧪 进行完整的用户购买流程测试');
  console.log('   📊 验证分销商管理功能的完整性');
  console.log('   ✅ 确认所有需求文档要求都已实现');
}

// 主执行函数
if (require.main === module) {
  validateFrontendUI()
    .then(() => {
      console.log('\n🎉 前端UI需求文档验证完成!');
    })
    .catch(error => {
      console.error('验证脚本执行出错:', error);
      process.exit(1);
    });
}

module.exports = { validateFrontendUI };