#!/usr/bin/env node

/**
 * 部署前检查脚本
 * 验证排除功能相关文件是否准备就绪
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 部署前检查开始...\n');

let checksPassed = 0;
let checksFailed = 0;

// 检查函数
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    console.log(`✅ ${description}`);
    console.log(`   文件路径: ${filePath}`);
    checksPassed++;
  } else {
    console.log(`❌ ${description}`);
    console.log(`   缺失文件: ${filePath}`);
    checksFailed++;
  }
  return exists;
}

// 检查内容包含
function checkFileContains(filePath, searchText, description) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    checksFailed++;
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const contains = content.includes(searchText);
  
  if (contains) {
    console.log(`✅ ${description}`);
    checksPassed++;
  } else {
    console.log(`❌ ${description}`);
    console.log(`   未找到: "${searchText}"`);
    checksFailed++;
  }
  return contains;
}

console.log('1️⃣ 检查核心服务文件：');
console.log('-------------------');

// 检查排除服务文件
checkFile(
  path.join(__dirname, 'src/services/excludedSalesService.js'),
  'excludedSalesService.js 存在'
);

// 检查API文件
checkFile(
  path.join(__dirname, 'src/services/api.js'),
  'api.js 存在'
);

console.log('\n2️⃣ 检查代码关键功能：');
console.log('-------------------');

// 检查excludedSalesService.js中的关键方法
const excludedServicePath = path.join(__dirname, 'src/services/excludedSalesService.js');
if (fs.existsSync(excludedServicePath)) {
  checkFileContains(excludedServicePath, 'getExcludedSalesCodes', 'getExcludedSalesCodes方法存在');
  checkFileContains(excludedServicePath, 'is_active: true', 'addExcludedSales设置is_active为true');
  checkFileContains(excludedServicePath, 'excluded_at: new Date()', '记录排除时间');
}

// 检查api.js中的排除逻辑
const apiPath = path.join(__dirname, 'src/services/api.js');
if (fs.existsSync(apiPath)) {
  checkFileContains(apiPath, 'ExcludedSalesService', '引入ExcludedSalesService');
  checkFileContains(apiPath, 'getExcludedSalesCodes', '调用排除代码获取方法');
  checkFileContains(apiPath, 'skipExclusion', '支持skipExclusion参数');
}

console.log('\n3️⃣ 检查修改的影响范围：');
console.log('-------------------');

// 列出受影响的API方法
const affectedMethods = [
  'getStats',
  'getSales', 
  'getOrders',
  'getSalesConversionStats',
  'getTopSales',
  'getOrderStatusDistribution'
];

console.log('受影响的API方法：');
affectedMethods.forEach(method => {
  if (fs.existsSync(apiPath)) {
    const content = fs.readFileSync(apiPath, 'utf8');
    // 简单检查方法是否存在
    if (content.includes(`${method}(`)) {
      console.log(`  • ${method} ✓`);
    }
  }
});

console.log('\n4️⃣ 检查数据库相关SQL：');
console.log('-------------------');

// 检查是否有数据库创建脚本
const sqlFiles = [
  'create-excluded-sales-config.sql',
  'excluded_sales_config.sql',
  'deploy-database.sql'
];

let foundSQL = false;
sqlFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ 找到SQL文件: ${file}`);
    foundSQL = true;
  }
});

if (!foundSQL) {
  console.log('⚠️ 未找到数据库创建脚本，需要手动在Supabase创建表');
}

console.log('\n5️⃣ 检查测试脚本：');
console.log('-------------------');

// 检查测试相关脚本
const testFiles = [
  'test-api-exclusion.js',
  'test-complete-exclusion.js',
  'test-verification-page.html'
];

testFiles.forEach(file => {
  checkFile(path.join(__dirname, file), `测试文件: ${file}`);
});

console.log('\n📊 检查结果汇总：');
console.log('================');
console.log(`✅ 通过: ${checksPassed} 项`);
console.log(`❌ 失败: ${checksFailed} 项`);

if (checksFailed === 0) {
  console.log('\n🎉 所有检查通过！可以进行部署');
  console.log('\n📝 下一步操作：');
  console.log('1. 确认线上数据库表结构');
  console.log('2. 执行: npm run build');
  console.log('3. 提交代码到Git');
  console.log('4. 部署到Vercel');
} else {
  console.log('\n⚠️ 有检查项未通过，请先修复问题');
  console.log('注意：某些测试文件缺失不影响功能部署');
}

console.log('\n🔧 修改的文件列表（需要部署）：');
console.log('1. src/services/excludedSalesService.js');
console.log('2. src/services/api.js');
console.log('\n⚠️ 不要部署的文件：');
console.log('• src/services/statsUpdater.js（待返佣金修复）');
console.log('• 其他任何未列出的文件');

process.exit(checksFailed > 0 ? 1 : 0);