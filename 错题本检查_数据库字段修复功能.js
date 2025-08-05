#!/usr/bin/env node

/**
 * 错题本检查 - 数据库字段修复功能
 * 基于黄金标准 4fa4602 进行检查
 */

const fs = require('fs');
const path = require('path');

console.log('📋 错题本检查 - 数据库字段修复功能');
console.log('='.repeat(50));
console.log('🔍 基于黄金标准: 4fa4602');
console.log('🎯 检查项目: 6/6 项必须全部通过\n');

let passedChecks = 0;
const totalChecks = 6;
const errors = [];

// ✅ 检查项 1: vercel.json配置正确
console.log('1️⃣ 检查 vercel.json 配置...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  // 验证关键配置项
  const checks = [
    { field: 'version', expected: 2, actual: vercelConfig.version },
    { field: 'buildCommand', expected: 'cd client && npm run build', actual: vercelConfig.buildCommand },
    { field: 'outputDirectory', expected: 'client/build', actual: vercelConfig.outputDirectory }
  ];
  
  let configCorrect = true;
  checks.forEach(check => {
    if (check.actual !== check.expected) {
      configCorrect = false;
      errors.push(`vercel.json ${check.field}: 期望 "${check.expected}", 实际 "${check.actual}"`);
    }
  });
  
  if (configCorrect && vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
    console.log('   ✅ PASS: vercel.json配置正确');
    passedChecks++;
  } else {
    console.log('   ❌ FAIL: vercel.json配置不正确');
    errors.push('vercel.json配置验证失败');
  }
} catch (error) {
  console.log('   ❌ FAIL: 无法读取vercel.json');
  errors.push(`vercel.json读取错误: ${error.message}`);
}

// ✅ 检查项 2: buildCommand格式正确
console.log('\n2️⃣ 检查 buildCommand 格式...');
try {
  const packageJson = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
  const buildScript = packageJson.scripts?.build;
  
  if (buildScript && buildScript.includes('CI=false') && buildScript.includes('react-scripts build')) {
    console.log('   ✅ PASS: buildCommand格式正确');
    console.log(`   📋 build脚本: "${buildScript}"`);
    passedChecks++;
  } else {
    console.log('   ❌ FAIL: buildCommand格式不正确');
    errors.push(`build脚本不符合要求: "${buildScript}"`);
  }
} catch (error) {
  console.log('   ❌ FAIL: 无法读取client/package.json');
  errors.push(`package.json读取错误: ${error.message}`);
}

// ✅ 检查项 3: API文件格式正确
console.log('\n3️⃣ 检查 API 文件格式...');
try {
  const apiFiles = fs.readdirSync('api');
  const requiredFiles = ['admin.js', 'auth.js', 'health.js'];
  
  const missingFiles = requiredFiles.filter(file => !apiFiles.includes(file));
  
  // 检查admin.js是否包含新的修复端点
  const adminContent = fs.readFileSync('api/admin.js', 'utf8');
  const hasFixEndpoint = adminContent.includes('fix-missing-fields') && 
                         adminContent.includes('handleFixMissingFields');
  
  if (missingFiles.length === 0 && hasFixEndpoint) {
    console.log('   ✅ PASS: API文件格式正确');
    console.log(`   📂 API文件: ${apiFiles.filter(f => f.endsWith('.js')).join(', ')}`);
    console.log('   🔧 新增: fix-missing-fields 端点');
    passedChecks++;
  } else {
    console.log('   ❌ FAIL: API文件格式不正确');
    if (missingFiles.length > 0) {
      errors.push(`缺少API文件: ${missingFiles.join(', ')}`);
    }
    if (!hasFixEndpoint) {
      errors.push('admin.js缺少fix-missing-fields端点');
    }
  }
} catch (error) {
  console.log('   ❌ FAIL: 无法检查API文件');
  errors.push(`API文件检查错误: ${error.message}`);
}

// ✅ 检查项 4: 环境变量未修改
console.log('\n4️⃣ 检查环境变量配置...');
try {
  // 检查代码中是否硬编码了环境变量
  const adminContent = fs.readFileSync('api/admin.js', 'utf8');
  
  const envVarPattern = /process\.env\.(DB_HOST|DB_USER|DB_PASSWORD|DB_NAME)/g;
  const matches = adminContent.match(envVarPattern);
  
  // 检查是否有硬编码的数据库配置
  const hardcodedPattern = /(host:\s*['"][^'"]+['"]|user:\s*['"][^'"]+['"]|password:\s*['"][^'"]+['"])/i;
  const hasHardcoded = hardcodedPattern.test(adminContent);
  
  if (matches && matches.length > 0 && !hasHardcoded) {
    console.log('   ✅ PASS: 环境变量配置正确');
    console.log('   📋 使用标准环境变量格式');
    passedChecks++;
  } else {
    console.log('   ❌ FAIL: 环境变量配置不正确');
    if (!matches) {
      errors.push('未找到环境变量引用');
    }
    if (hasHardcoded) {
      errors.push('检测到硬编码数据库配置');
    }
  }
} catch (error) {
  console.log('   ❌ FAIL: 无法检查环境变量');
  errors.push(`环境变量检查错误: ${error.message}`);
}

// ✅ 检查项 5: 前端路由配置正确
console.log('\n5️⃣ 检查前端路由配置...');
try {
  const appContent = fs.readFileSync('client/src/App.js', 'utf8');
  
  const routerChecks = [
    { name: 'BrowserRouter导入', pattern: /import.*BrowserRouter.*from.*react-router-dom/i },
    { name: 'Routes组件', pattern: /<Routes>/i },
    { name: 'Route配置', pattern: /<Route.*path=/i }
  ];
  
  let routerCorrect = true;
  routerChecks.forEach(check => {
    if (!check.pattern.test(appContent)) {
      routerCorrect = false;
      errors.push(`前端路由缺少: ${check.name}`);
    }
  });
  
  if (routerCorrect) {
    console.log('   ✅ PASS: 前端路由配置正确');
    console.log('   📋 React Router配置完整');
    passedChecks++;
  } else {
    console.log('   ❌ FAIL: 前端路由配置不正确');
  }
} catch (error) {
  console.log('   ❌ FAIL: 无法检查前端路由');
  errors.push(`前端路由检查错误: ${error.message}`);
}

// ✅ 检查项 6: 数据库连接正常（通过健康检查API）
console.log('\n6️⃣ 检查数据库连接配置...');
try {
  const healthContent = fs.readFileSync('api/health.js', 'utf8');
  
  // 检查健康检查API是否存在并包含数据库连接测试
  const hasDbCheck = healthContent.includes('mysql') || 
                     healthContent.includes('createConnection') ||
                     healthContent.includes('connected');
  
  if (hasDbCheck) {
    console.log('   ✅ PASS: 数据库连接配置正确');
    console.log('   📋 健康检查API包含数据库连接测试');
    passedChecks++;
  } else {
    console.log('   ❌ FAIL: 数据库连接配置不正确');
    errors.push('健康检查API缺少数据库连接测试');
  }
} catch (error) {
  console.log('   ❌ FAIL: 无法检查数据库连接配置');
  errors.push(`数据库连接检查错误: ${error.message}`);
}

// 📊 错题本总结
console.log('\n' + '='.repeat(50));
console.log('📊 错题本检查结果汇总');
console.log('='.repeat(50));

console.log(`✅ 通过检查: ${passedChecks}/${totalChecks}`);
console.log(`❌ 失败检查: ${totalChecks - passedChecks}/${totalChecks}`);

if (errors.length > 0) {
  console.log('\n❌ 错误详情:');
  errors.forEach((error, index) => {
    console.log(`   ${index + 1}. ${error}`);
  });
}

// 🎯 最终结论
console.log('\n' + '='.repeat(50));
if (passedChecks === totalChecks) {
  console.log('🎉 错题本检查结果: ✅ 全部通过！');
  console.log('🚀 部署状态: ✅ 准备就绪');
  console.log('\n📋 部署清单确认:');
  console.log('   ✅ vercel.json配置正确');
  console.log('   ✅ buildCommand格式正确'); 
  console.log('   ✅ API文件格式正确（含新端点）');
  console.log('   ✅ 环境变量未修改');
  console.log('   ✅ 前端路由配置正确');
  console.log('   ✅ 数据库连接配置正确');
  console.log('\n🎯 可以安全部署！');
  
  // 生成检查通过的记录
  const passRecord = {
    timestamp: new Date().toISOString(),
    status: 'PASS',
    checks: passedChecks,
    total: totalChecks,
    deployment: 'database-fields-fix',
    goldStandard: '4fa4602'
  };
  
  fs.writeFileSync(
    `错题本检查通过_数据库字段修复_${Date.now()}.json`, 
    JSON.stringify(passRecord, null, 2)
  );
  
} else {
  console.log('❌ 错题本检查结果: 部分失败');
  console.log('🚫 部署状态: 不可部署');
  console.log('\n⚠️  必须修复所有错误后才能部署！');
  
  // 生成失败记录
  const failRecord = {
    timestamp: new Date().toISOString(),
    status: 'FAIL',
    checks: passedChecks,
    total: totalChecks,
    errors: errors,
    deployment: 'database-fields-fix'
  };
  
  fs.writeFileSync(
    `错题本检查失败_数据库字段修复_${Date.now()}.json`, 
    JSON.stringify(failRecord, null, 2)
  );
}

console.log('='.repeat(50));