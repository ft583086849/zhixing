#!/usr/bin/env node

/**
 * 错题本检查 - 二级销售注册页面专项验证
 * 确保新的统一二级销售注册页面符合用户要求
 */

const fs = require('fs');
const path = require('path');

// 错题本记录
const errorBook = {
  timestamp: new Date().toISOString(),
  feature: '二级销售注册页面重构',
  checkpoints: [],
  metrics: {
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0
  }
};

function logCheckpoint(name, status, details, solution = '') {
  const checkpoint = {
    name,
    status, // 'correct' | 'incorrect'
    details,
    solution,
    timestamp: new Date().toISOString()
  };
  
  errorBook.checkpoints.push(checkpoint);
  errorBook.metrics.totalChecks++;
  
  const icon = status === 'correct' ? '✅' : '❌';
  console.log(`${icon} [${name}] ${details}`);
  if (solution) console.log(`   解决方案: ${solution}`);
  
  if (status === 'correct') {
    errorBook.metrics.passedChecks++;
  } else {
    errorBook.metrics.failedChecks++;
  }
}

function checkFileExists(filePath, purpose) {
  try {
    fs.statSync(filePath);
    logCheckpoint(
      `文件存在: ${filePath}`,
      'correct',
      `${purpose} - 文件存在`
    );
    return true;
  } catch (error) {
    logCheckpoint(
      `文件存在: ${filePath}`,
      'incorrect',
      `${purpose} - 文件不存在`,
      `请检查文件路径和文件名是否正确`
    );
    return false;
  }
}

function checkCodePattern(filePath, pattern, description, shouldExist = true) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let found = false;
    
    if (pattern instanceof RegExp) {
      found = pattern.test(content);
    } else {
      found = content.includes(pattern);
    }
    
    if (found === shouldExist) {
      logCheckpoint(
        `代码检查: ${path.basename(filePath)}`,
        'correct',
        `${description} - ${shouldExist ? '找到' : '未找到'}预期内容`
      );
      return true;
    } else {
      logCheckpoint(
        `代码检查: ${path.basename(filePath)}`,
        'incorrect',
        `${description} - ${shouldExist ? '缺少' : '意外包含'}内容`,
        shouldExist ? `请添加: ${pattern}` : `请删除: ${pattern}`
      );
      return false;
    }
  } catch (error) {
    logCheckpoint(
      `代码检查: ${path.basename(filePath)}`,
      'incorrect',
      `${description} - 检查失败: ${error.message}`,
      '请检查文件是否存在且可读'
    );
    return false;
  }
}

async function checkpoint1_PageStructure() {
  console.log('🔍 检查点1: 页面结构检查\n');
  
  // 检查旧页面已删除
  const oldPageExists = fs.existsSync('client/src/pages/SecondarySalesRegistrationPage.js');
  logCheckpoint(
    '旧页面删除',
    oldPageExists ? 'incorrect' : 'correct',
    oldPageExists ? '旧的SecondarySalesRegistrationPage.js仍存在' : '旧页面已成功删除',
    oldPageExists ? '删除client/src/pages/SecondarySalesRegistrationPage.js' : ''
  );
  
  // 检查新页面存在
  const newPageExists = checkFileExists(
    'client/src/pages/UnifiedSecondarySalesPage.js',
    '新的统一二级销售注册页面'
  );
  
  // 检查路由配置
  const routeUpdated = checkCodePattern(
    'client/src/App.js',
    'UnifiedSecondarySalesPage',
    '路由配置已更新为使用新页面'
  );
  
  return newPageExists && routeUpdated && !oldPageExists;
}

async function checkpoint2_PageContent() {
  console.log('\n🔍 检查点2: 页面内容检查\n');
  
  const filePath = 'client/src/pages/UnifiedSecondarySalesPage.js';
  if (!fs.existsSync(filePath)) {
    logCheckpoint('页面内容检查', 'incorrect', '新页面文件不存在', '请先创建新页面文件');
    return false;
  }
  
  let passed = 0;
  const checks = [
    // 1. 标题检查
    ['销售注册', '页面标题必须是"销售注册"'],
    ["document.title = '销售注册'", '页面标题设置正确'],
    
    // 2. 表单结构检查（与SalesPage.js一致）
    ['wechat_name', '包含微信号字段'],
    ['payment_method', '包含收款方式字段'],
    ['payment_address', '包含收款地址字段'],
    ['alipay_surname', '包含支付宝姓氏字段'],
    ['chain_name', '包含链名字段'],
    
    // 3. 功能检查
    ['handleCopyUserLink', '包含复制用户购买链接功能'],
    ['handleCopyUserCode', '包含复制用户购买代码功能'],
    ['clearLink', '包含生成新链接功能'],
    
    // 4. 模式检查
    ['isLinkedMode', '支持关联模式识别'],
    ['validateRegistrationCode', '支持注册码验证'],
    ['register-independent', '支持独立注册'],
    
    // 5. 删除检查
    ['二级销售注册链接', '不应包含二级销售注册链接文字', false],
    ['handleCopySecondaryLink', '不应包含复制二级销售链接功能', false],
    ['secondary_registration_link', '不应显示二级销售注册链接', false]
  ];
  
  for (const [pattern, desc, shouldExist = true] of checks) {
    if (checkCodePattern(filePath, pattern, desc, shouldExist)) passed++;
  }
  
  return passed === checks.length;
}

async function checkpoint3_BackendAPI() {
  console.log('\n🔍 检查点3: 后端API检查\n');
  
  const filePath = 'api/secondary-sales.js';
  if (!fs.existsSync(filePath)) {
    logCheckpoint('后端API检查', 'incorrect', 'secondary-sales.js文件不存在', '请检查API文件');
    return false;
  }
  
  let passed = 0;
  const checks = [
    // 1. 独立注册支持
    ['register-independent', '支持独立注册路由'],
    ['req.body.independent = true', '独立注册标志设置'],
    
    // 2. 验证逻辑
    ["link_code.startsWith('SR')", '支持SR开头的注册码验证'],
    ['secondary_registration_code = ?', '使用secondary_registration_code字段查询'],
    
    // 3. 兼容性
    ["link_code.startsWith('reg_')", '保持旧格式兼容性'],
    
    // 4. API导出 (支持ES6和CommonJS格式)
    [/module\.exports|export\s+default/, 'API正确导出']
  ];
  
  for (const [pattern, desc] of checks) {
    if (checkCodePattern(filePath, pattern, desc)) passed++;
  }
  
  return passed === checks.length;
}

async function checkpoint4_UserRequirements() {
  console.log('\n🔍 检查点4: 用户需求符合性检查\n');
  
  let passed = 0;
  
  // 检查标题要求
  const titleCorrect = checkCodePattern(
    'client/src/pages/UnifiedSecondarySalesPage.js',
    '销售注册',
    '页面标题改为"销售注册"（不是"二级销售注册"）'
  );
  if (titleCorrect) passed++;
  
  // 检查删除二级销售注册链接板块
  const noSecondaryLinks = checkCodePattern(
    'client/src/pages/UnifiedSecondarySalesPage.js',
    '二级销售注册链接',
    '确认删除了二级销售注册链接板块',
    false
  );
  
  const noSecondaryCard = checkCodePattern(
    'client/src/pages/UnifiedSecondarySalesPage.js',
    '👥 二级销售注册链接',
    '确认删除了二级销售注册链接Card组件',
    false
  );
  
  if (noSecondaryLinks && noSecondaryCard) {
    logCheckpoint(
      '删除二级销售注册板块',
      'correct',
      '已成功删除二级销售注册链接相关内容'
    );
    passed++;
  } else {
    logCheckpoint(
      '删除二级销售注册板块',
      'incorrect',
      '仍包含二级销售注册链接相关内容',
      '请删除所有二级销售注册链接相关的UI组件'
    );
  }
  
  // 检查保留用户购买功能
  const userLinkKept = checkCodePattern(
    'client/src/pages/UnifiedSecondarySalesPage.js',
    '💰 用户购买链接',
    '保留了用户购买链接功能'
  );
  if (userLinkKept) passed++;
  
  // 检查两种访问方式
  const routeIndependent = checkCodePattern(
    'client/src/App.js',
    '/secondary-sales',
    '支持独立二级销售注册路径'
  );
  if (routeIndependent) passed++;
  
  const routeLinked = checkCodePattern(
    'client/src/pages/UnifiedSecondarySalesPage.js',
    'searchParams.get(\'sales_code\')',
    '支持关联二级销售注册（带sales_code参数）'
  );
  if (routeLinked) passed++;
  
  return passed === 5;
}

async function generateReport() {
  console.log('\n📊 生成检查报告...\n');
  
  const successRate = (errorBook.metrics.passedChecks / errorBook.metrics.totalChecks * 100).toFixed(1);
  
  console.log('='.repeat(60));
  console.log('📋 二级销售注册页面检查总结:');
  console.log(`📊 总检查项: ${errorBook.metrics.totalChecks}`);
  console.log(`✅ 通过检查: ${errorBook.metrics.passedChecks}`);
  console.log(`❌ 失败检查: ${errorBook.metrics.failedChecks}`);
  console.log(`📈 成功率: ${successRate}%`);
  console.log('='.repeat(60));
  
  if (errorBook.metrics.failedChecks === 0) {
    console.log('🎉 所有检查通过！符合用户要求。');
    console.log('✅ 建议进行部署。');
    errorBook.deploymentRecommendation = 'PROCEED';
  } else {
    console.log('⚠️ 存在问题，建议修复后再部署。');
    errorBook.deploymentRecommendation = 'FIX_REQUIRED';
    
    console.log('\n❌ 失败的检查项:');
    errorBook.checkpoints
      .filter(cp => cp.status === 'incorrect')
      .forEach(cp => {
        console.log(`  - ${cp.name}: ${cp.details}`);
        if (cp.solution) console.log(`    解决方案: ${cp.solution}`);
      });
  }
  
  const reportPath = `错题本检查结果_二级销售注册页面_${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(errorBook, null, 2));
  console.log(`\n📝 检查报告已保存: ${reportPath}`);
  
  return errorBook;
}

async function main() {
  console.log('📚 开始二级销售注册页面专项检查\n');
  console.log('='.repeat(60));
  
  await checkpoint1_PageStructure();
  await checkpoint2_PageContent();
  await checkpoint3_BackendAPI();
  await checkpoint4_UserRequirements();
  
  await generateReport();
}

if (require.main === module) {
  main();
}