#!/usr/bin/env node

/**
 * 🔍 路由问题调试测试
 * 检查组件加载和路由匹配
 */

console.log('🔍 开始路由调试测试...\n');

// 1. 检查文件存在性
const fs = require('fs');
const path = require('path');

console.log('📁 检查页面文件存在性:');
const pageFiles = [
  'client/src/pages/AdminLoginPage.js',
  'client/src/pages/SalesPage.js',
  'client/src/App.js'
];

pageFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// 2. 检查AdminLoginPage内容
console.log('\n📋 检查AdminLoginPage组件内容:');
try {
  const adminLoginContent = fs.readFileSync('client/src/pages/AdminLoginPage.js', 'utf8');
  
  // 检查是否有navigate重定向
  const hasNavigate = adminLoginContent.includes('navigate(');
  const hasUseEffect = adminLoginContent.includes('useEffect');
  const hasRedirect = adminLoginContent.includes('Navigate') || adminLoginContent.includes('redirect');
  
  console.log(`   ${hasNavigate ? '⚠️' : '✅'} 包含navigate调用: ${hasNavigate}`);
  console.log(`   ${hasUseEffect ? '⚠️' : '✅'} 包含useEffect: ${hasUseEffect}`);
  console.log(`   ${hasRedirect ? '⚠️' : '✅'} 包含重定向: ${hasRedirect}`);
  
  if (hasNavigate) {
    // 提取navigate调用
    const navigateMatches = adminLoginContent.match(/navigate\([^)]+\)/g);
    if (navigateMatches) {
      console.log('   🔍 发现的navigate调用:');
      navigateMatches.forEach((match, index) => {
        console.log(`      ${index + 1}. ${match}`);
      });
    }
  }
  
} catch (error) {
  console.log(`   ❌ 无法读取AdminLoginPage: ${error.message}`);
}

// 3. 检查App.js路由配置
console.log('\n📋 检查App.js路由配置:');
try {
  const appContent = fs.readFileSync('client/src/App.js', 'utf8');
  
  // 检查/admin路由
  const adminRouteMatch = appContent.match(/path="\/admin"[^>]*element={[^}]+}/);
  if (adminRouteMatch) {
    console.log(`   ✅ 找到/admin路由: ${adminRouteMatch[0]}`);
  } else {
    console.log('   ❌ 未找到/admin路由配置');
  }
  
  // 检查懒加载import
  const adminImportMatch = appContent.match(/const AdminLoginPage = lazy\([^)]+\)/);
  if (adminImportMatch) {
    console.log(`   ✅ 找到AdminLoginPage导入: ${adminImportMatch[0]}`);
  } else {
    console.log('   ❌ 未找到AdminLoginPage懒加载导入');
  }
  
} catch (error) {
  console.log(`   ❌ 无法读取App.js: ${error.message}`);
}

// 4. 检查是否有重复的路由定义
console.log('\n📋 检查路由重复定义:');
try {
  const appContent = fs.readFileSync('client/src/App.js', 'utf8');
  const adminRoutes = appContent.match(/path="\/admin[^"]*"/g);
  if (adminRoutes) {
    console.log(`   🔍 找到 ${adminRoutes.length} 个admin相关路由:`);
    adminRoutes.forEach((route, index) => {
      console.log(`      ${index + 1}. ${route}`);
    });
  }
} catch (error) {
  console.log(`   ❌ 检查失败: ${error.message}`);
}

console.log('\n🎯 调试完成！');
console.log('\n💡 分析建议:');
console.log('1. 如果AdminLoginPage有navigate重定向，这可能是问题根源');
console.log('2. 如果路由配置正确但仍然错误，可能是部署缓存问题');
console.log('3. 检查浏览器开发者工具的Network和Console面板');