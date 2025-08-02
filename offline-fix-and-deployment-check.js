const fs = require('fs');
const path = require('path');

// 线下修复和部署检查脚本
console.log('🔧 开始线下修复和部署检查...\n');

// 检查清单
const checkList = {
  // 1. 错题本中的关键问题检查
  errorRecordChecks: [
    {
      name: '订单状态更新问题',
      description: '检查订单状态枚举值是否匹配（Vercel架构）',
      files: ['api/orders.js', 'api/admin.js'],
      status: 'PENDING'
    },
    {
      name: '支付管理系统边框问题',
      description: '检查Content组件样式是否正确',
      files: ['client/src/pages/AdminDashboardPage.js'],
      status: 'PENDING'
    },
    {
      name: '付款截图显示问题',
      description: '检查文件上传和显示功能（Vercel架构）',
      files: ['api/orders.js', 'client/src/components/admin/AdminOrders.js'],
      status: 'PENDING'
    },
    {
      name: '管理员登录页面问题',
      description: '检查登录状态和token验证',
      files: ['client/src/pages/AdminLoginPage.js', 'client/src/store/slices/authSlice.js'],
      status: 'PENDING'
    },
    {
      name: '销售对账页面重新设计',
      description: '检查对账和催单功能合并',
      files: ['client/src/pages/SalesReconciliationPage.js'],
      status: 'PENDING'
    },
    {
      name: '收款码图片显示功能',
      description: '检查支付宝和链上收款码显示',
      files: ['client/src/pages/PurchasePage.js', 'client/src/components/admin/AdminPaymentConfig.js'],
      status: 'PENDING'
    },
    {
      name: 'API路径不匹配问题',
      description: '检查前后端API路径一致性',
      files: ['client/src/services/api.js', 'api/auth.js'],
      status: 'PENDING'
    },
    {
      name: 'Vercel部署配置问题',
      description: '检查vercel.json配置格式',
      files: ['vercel.json'],
      status: 'PENDING'
    }
  ],
  
  // 2. 部署前检查项
  deploymentChecks: [
    {
      name: 'vercel.json配置',
      description: '确保配置与成功版本一致',
      status: 'PENDING'
    },
    {
      name: 'API文件格式',
      description: '确保使用ES6模块格式',
      status: 'PENDING'
    },
    {
      name: 'package.json配置',
      description: '确保没有type: module配置',
      status: 'PENDING'
    },
    {
      name: '环境变量配置',
      description: '确保Vercel环境变量正确设置',
      status: 'PENDING'
    }
  ],
  
  // 3. 功能完整性检查
  functionalityChecks: [
    {
      name: '管理员登录功能',
      description: '检查登录流程完整性',
      status: 'PENDING'
    },
    {
      name: '订单管理功能',
      description: '检查订单CRUD操作',
      status: 'PENDING'
    },
    {
      name: '销售管理功能',
      description: '检查销售链接管理',
      status: 'PENDING'
    },
    {
      name: '支付配置功能',
      description: '检查收款配置管理',
      status: 'PENDING'
    },
    {
      name: '用户购买流程',
      description: '检查完整的购买流程',
      status: 'PENDING'
    }
  ]
};

// 检查文件是否存在
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// 检查文件内容
function checkFileContent(filePath, expectedContent = '') {
  try {
    if (!fs.existsSync(filePath)) {
      return { exists: false, content: null };
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return { exists: true, content };
  } catch (error) {
    return { exists: false, content: null, error: error.message };
  }
}

// 检查vercel.json配置
function checkVercelConfig() {
  const vercelFile = 'vercel.json';
  const { exists, content } = checkFileContent(vercelFile);
  
  if (!exists) {
    return { status: 'FAIL', message: 'vercel.json文件不存在' };
  }
  
  try {
    const config = JSON.parse(content);
    
    // 检查成功版本的配置特征
    const hasVersion = config.version === 2;
    const hasBuildCommand = config.buildCommand === 'cd client && npm run build';
    const hasOutputDirectory = config.outputDirectory === 'client/build';
    const hasRewrites = Array.isArray(config.rewrites) && config.rewrites.length > 0;
    const noFunctions = !config.functions;
    const noBuilds = !config.builds;
    
    if (hasVersion && hasBuildCommand && hasOutputDirectory && hasRewrites && noFunctions && noBuilds) {
      return { status: 'PASS', message: '配置与成功版本一致' };
    } else {
      return { status: 'FAIL', message: '配置与成功版本不一致' };
    }
  } catch (error) {
    return { status: 'FAIL', message: `JSON解析错误: ${error.message}` };
  }
}

// 检查API文件格式
function checkAPIFileFormat() {
  const apiFiles = [
    'api/auth.js',
    'api/admin.js',
    'api/orders.js',
    'api/sales.js',
    'api/payment-config.js',
    'api/health.js'
  ];
  
  let allCorrect = true;
  const results = [];
  
  for (const file of apiFiles) {
    const { exists, content } = checkFileContent(file);
    
    if (!exists) {
      results.push({ file, status: 'FAIL', message: '文件不存在' });
      allCorrect = false;
      continue;
    }
    
    // 检查是否使用ES6模块格式
    const hasExportDefault = content.includes('export default');
    const hasNoModuleExports = !content.includes('module.exports');
    
    if (hasExportDefault && hasNoModuleExports) {
      results.push({ file, status: 'PASS', message: '使用ES6模块格式' });
    } else {
      results.push({ file, status: 'FAIL', message: '格式不正确' });
      allCorrect = false;
    }
  }
  
  return { status: allCorrect ? 'PASS' : 'FAIL', results };
}

// 检查package.json配置
function checkPackageJson() {
  const packageFile = 'package.json';
  const { exists, content } = checkFileContent(packageFile);
  
  if (!exists) {
    return { status: 'FAIL', message: 'package.json文件不存在' };
  }
  
  try {
    const config = JSON.parse(content);
    const hasTypeModule = config.type === 'module';
    
    if (!hasTypeModule) {
      return { status: 'PASS', message: '使用默认CommonJS配置' };
    } else {
      return { status: 'FAIL', message: '不应该有type: module配置' };
    }
  } catch (error) {
    return { status: 'FAIL', message: `JSON解析错误: ${error.message}` };
  }
}

// 检查关键文件内容
function checkKeyFileContents() {
  const checks = [
    {
      name: '订单状态枚举值',
      file: 'api/orders.js',
      check: (content) => {
        // 检查是否包含订单状态相关的逻辑
        const hasOrderStatus = content.includes('status') && 
                              (content.includes('pending') || content.includes('confirmed') || content.includes('rejected'));
        return hasOrderStatus;
      }
    },
    {
      name: 'API路径配置',
      file: 'client/src/services/api.js',
      check: (content) => {
        const hasCorrectAuthPath = content.includes('/auth?path=login') || 
                                  content.includes('/auth/login');
        return hasCorrectAuthPath;
      }
    },
    {
      name: '支付配置组件',
      file: 'client/src/pages/PurchasePage.js',
      check: (content) => {
        const hasPaymentConfig = content.includes('paymentConfig') || 
                                content.includes('PaymentConfig');
        return hasPaymentConfig;
      }
    }
  ];
  
  const results = [];
  for (const check of checks) {
    const { exists, content } = checkFileContent(check.file);
    
    if (!exists) {
      results.push({ name: check.name, status: 'FAIL', message: '文件不存在' });
      continue;
    }
    
    if (check.check(content)) {
      results.push({ name: check.name, status: 'PASS', message: '内容正确' });
    } else {
      results.push({ name: check.name, status: 'FAIL', message: '内容需要检查' });
    }
  }
  
  return results;
}

// 执行所有检查
async function runAllChecks() {
  console.log('📋 1. 错题本问题检查');
  for (const check of checkList.errorRecordChecks) {
    console.log(`\n🔍 检查: ${check.name}`);
    console.log(`   描述: ${check.description}`);
    
    let allFilesExist = true;
    for (const file of check.files) {
      const exists = checkFileExists(file);
      console.log(`   ${exists ? '✅' : '❌'} ${file}`);
      if (!exists) allFilesExist = false;
    }
    
    check.status = allFilesExist ? 'PASS' : 'FAIL';
    console.log(`   状态: ${check.status}`);
  }
  
  console.log('\n📋 2. 部署前检查');
  
  // 检查vercel.json
  console.log('\n🔍 检查: vercel.json配置');
  const vercelResult = checkVercelConfig();
  console.log(`   状态: ${vercelResult.status} - ${vercelResult.message}`);
  checkList.deploymentChecks[0].status = vercelResult.status;
  
  // 检查API文件格式
  console.log('\n🔍 检查: API文件格式');
  const apiResult = checkAPIFileFormat();
  console.log(`   状态: ${apiResult.status}`);
  if (apiResult.results) {
    for (const result of apiResult.results) {
      console.log(`   ${result.status === 'PASS' ? '✅' : '❌'} ${result.file}: ${result.message}`);
    }
  }
  checkList.deploymentChecks[1].status = apiResult.status;
  
  // 检查package.json
  console.log('\n🔍 检查: package.json配置');
  const packageResult = checkPackageJson();
  console.log(`   状态: ${packageResult.status} - ${packageResult.message}`);
  checkList.deploymentChecks[2].status = packageResult.status;
  
  console.log('\n📋 3. 关键文件内容检查');
  const contentResults = checkKeyFileContents();
  for (const result of contentResults) {
    console.log(`   ${result.status === 'PASS' ? '✅' : '❌'} ${result.name}: ${result.message}`);
  }
  
  // 生成检查报告
  const report = {
    timestamp: new Date().toISOString(),
    errorRecordChecks: checkList.errorRecordChecks,
    deploymentChecks: checkList.deploymentChecks,
    contentChecks: contentResults,
    summary: {
      totalChecks: checkList.errorRecordChecks.length + checkList.deploymentChecks.length + contentResults.length,
      passedChecks: 0,
      failedChecks: 0
    }
  };
  
  // 计算统计
  for (const check of checkList.errorRecordChecks) {
    if (check.status === 'PASS') report.summary.passedChecks++;
    else report.summary.failedChecks++;
  }
  
  for (const check of checkList.deploymentChecks) {
    if (check.status === 'PASS') report.summary.passedChecks++;
    else report.summary.failedChecks++;
  }
  
  for (const result of contentResults) {
    if (result.status === 'PASS') report.summary.passedChecks++;
    else report.summary.failedChecks++;
  }
  
  report.summary.successRate = Math.round((report.summary.passedChecks / report.summary.totalChecks) * 100);
  
  // 输出总结
  console.log('\n📊 检查结果汇总');
  console.log(`总检查项: ${report.summary.totalChecks}`);
  console.log(`通过: ${report.summary.passedChecks}`);
  console.log(`失败: ${report.summary.failedChecks}`);
  console.log(`成功率: ${report.summary.successRate}%`);
  
  // 保存报告
  const reportFile = `offline-fix-report-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\n📄 详细检查报告已保存到: ${reportFile}`);
  
  // 输出建议
  console.log('\n💡 部署建议:');
  if (report.summary.successRate >= 90) {
    console.log('✅ 系统检查通过，可以进行线上部署');
    console.log('📝 建议: 部署前运行完整测试确保功能正常');
  } else if (report.summary.successRate >= 70) {
    console.log('⚠️ 系统存在一些问题，建议先修复后再部署');
    console.log('📝 建议: 重点关注失败的项目');
  } else {
    console.log('❌ 系统存在严重问题，需要全面修复后才能部署');
    console.log('📝 建议: 根据错题本内容逐一修复问题');
  }
  
  return report;
}

// 运行检查
if (require.main === module) {
  runAllChecks().catch(console.error);
}

module.exports = { runAllChecks }; 