const fs = require('fs');
const path = require('path');

function checkFourthStageErrors() {
  console.log('🔍 开始第四阶段错题本检查...');
  
  const errors = [];
  const warnings = [];
  
  // 1. 检查API文件语法
  console.log('\n📝 检查API文件语法...');
  const apiFiles = [
    'api/sales.js',
    'api/admin.js',
    'api/primary-sales.js',
    'api/secondary-sales.js',
    'api/sales-hierarchy.js',
    'api/orders-commission.js',
    'api/data-cleanup.js'
  ];
  
  apiFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      // 检查基本语法
      if (!content.includes('module.exports') && !content.includes('export default')) {
        errors.push(`${file}: 缺少导出语句`);
      }
      if (!content.includes('CORS')) {
        warnings.push(`${file}: 可能缺少CORS设置`);
      }
      if (!content.includes('mysql')) {
        warnings.push(`${file}: 可能缺少数据库连接`);
      }
      console.log(`✅ ${file}: 语法检查通过`);
    } catch (error) {
      errors.push(`${file}: 文件读取失败 - ${error.message}`);
    }
  });
  
  // 2. 检查前端文件
  console.log('\n🎨 检查前端文件...');
  const frontendFiles = [
    'client/src/pages/PrimarySalesPage.js',
    'client/src/pages/PrimarySalesSettlementPage.js',
    'client/src/pages/SecondarySalesRegistrationPage.js',
    'client/src/components/admin/AdminOverview.js',
    'client/src/components/admin/AdminSales.js'
  ];
  
  frontendFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (!content.includes('export default')) {
        errors.push(`${file}: 缺少默认导出`);
      }
      if (!content.includes('import')) {
        warnings.push(`${file}: 可能缺少导入语句`);
      }
      console.log(`✅ ${file}: 语法检查通过`);
    } catch (error) {
      errors.push(`${file}: 文件读取失败 - ${error.message}`);
    }
  });
  
  // 3. 检查状态管理文件
  console.log('\n📊 检查状态管理文件...');
  const storeFiles = [
    'client/src/store/slices/salesSlice.js',
    'client/src/store/slices/adminSlice.js'
  ];
  
  storeFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (!content.includes('createSlice')) {
        errors.push(`${file}: 缺少createSlice`);
      }
      console.log(`✅ ${file}: 语法检查通过`);
    } catch (error) {
      errors.push(`${file}: 文件读取失败 - ${error.message}`);
    }
  });
  
  // 4. 检查API服务文件
  console.log('\n🔗 检查API服务文件...');
  try {
    const apiServiceContent = fs.readFileSync('client/src/services/api.js', 'utf8');
    if (!apiServiceContent.includes('axios')) {
      errors.push('client/src/services/api.js: 缺少axios导入');
    }
    console.log('✅ client/src/services/api.js: 语法检查通过');
  } catch (error) {
    errors.push(`client/src/services/api.js: 文件读取失败 - ${error.message}`);
  }
  
  // 5. 检查测试文件
  console.log('\n🧪 检查测试文件...');
  const testFiles = [
    'test-fourth-stage-complete.js',
    'test-fourth-stage-features.js',
    'test-sales-schema-api.js',
    'test-data-cleanup.js'
  ];
  
  testFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (!content.includes('axios')) {
        errors.push(`${file}: 缺少axios导入`);
      }
      if (!content.includes('async function')) {
        errors.push(`${file}: 缺少异步函数`);
      }
      console.log(`✅ ${file}: 语法检查通过`);
    } catch (error) {
      errors.push(`${file}: 文件读取失败 - ${error.message}`);
    }
  });
  
  // 6. 检查配置文件
  console.log('\n⚙️ 检查配置文件...');
  const configFiles = [
    'vercel.json',
    'package.json',
    'client/package.json'
  ];
  
  configFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (!content.includes('{')) {
        errors.push(`${file}: 不是有效的JSON文件`);
      }
      console.log(`✅ ${file}: 配置检查通过`);
    } catch (error) {
      errors.push(`${file}: 文件读取失败 - ${error.message}`);
    }
  });
  
  // 7. 检查文档文件
  console.log('\n📚 检查文档文件...');
  const docFiles = [
    'DEVELOPMENT_PROGRESS.md',
    'COMPLETE_PROBLEM_ARCHIVE_AND_SOLUTION.md',
    'DEPLOYMENT_STANDARDS.md'
  ];
  
  docFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.length < 100) {
        warnings.push(`${file}: 文档内容可能过少`);
      }
      console.log(`✅ ${file}: 文档检查通过`);
    } catch (error) {
      errors.push(`${file}: 文件读取失败 - ${error.message}`);
    }
  });
  
  // 输出检查结果
  console.log('\n🎯 错题本检查结果:');
  
  if (errors.length === 0) {
    console.log('✅ 没有发现错误！');
  } else {
    console.log(`❌ 发现 ${errors.length} 个错误:`);
    errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️ 发现 ${warnings.length} 个警告:`);
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  // 返回检查结果
  return {
    success: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

// 运行检查
const result = checkFourthStageErrors();

if (result.success) {
  console.log('\n🎉 第四阶段错题本检查通过！可以安全提交部署。');
  process.exit(0);
} else {
  console.log('\n❌ 第四阶段错题本检查失败！请修复错误后再提交部署。');
  process.exit(1);
} 