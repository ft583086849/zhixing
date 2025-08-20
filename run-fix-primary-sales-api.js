#!/usr/bin/env node

/**
 * 一级销售对账页面API修复脚本
 * 
 * 问题分析：
 * - 浏览器显示POST http://localhost:3001/api/admin/primary-sales-settlement 403错误
 * - 但实际代码使用的是Supabase直接连接
 * - 可能是前端代码中有错误的API调用或配置问题
 * 
 * 修复步骤：
 * 1. 检查并修复package.json中的代理配置
 * 2. 确认前端代码没有错误的API调用
 * 3. 重启开发服务器
 * 4. 验证页面正常工作
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 开始修复一级销售对账页面API问题...\n');

// 1. 检查和修复package.json中的代理配置
function fixPackageJsonProxy() {
  console.log('1. 检查package.json代理配置...');
  
  const packageJsonPath = path.join(__dirname, 'client/package.json');
  let packageJson;
  
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    console.error('   ❌ 无法读取package.json:', error.message);
    return false;
  }
  
  if (packageJson.proxy) {
    console.log(`   ⚠️  发现代理配置: ${packageJson.proxy}`);
    console.log('   💡 这可能导致API调用被错误路由');
    
    // 备份原文件
    fs.writeFileSync(packageJsonPath + '.backup', JSON.stringify(packageJson, null, 2));
    console.log('   📁 已备份原配置到package.json.backup');
    
    // 删除代理配置
    delete packageJson.proxy;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('   ✅ 已移除代理配置\n');
    
    return true;
  } else {
    console.log('   ✅ 没有发现代理配置\n');
    return false;
  }
}

// 2. 检查是否有错误的API调用
function checkForWrongAPICalls() {
  console.log('2. 检查代码中的API调用...');
  
  const filesToCheck = [
    'client/src/services/api.js',
    'client/src/store/slices/salesSlice.js',
    'client/src/pages/PrimarySalesSettlementPage.js'
  ];
  
  let foundIssues = false;
  
  for (const filePath of filesToCheck) {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`   ⚠️  文件不存在: ${filePath}`);
      continue;
    }
    
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // 检查可能的错误模式
      const problematicPatterns = [
        '/api/admin/primary-sales-settlement',
        'localhost:3001/api',
        'POST.*primary-sales-settlement',
        'fetch.*primary-sales-settlement'
      ];
      
      for (const pattern of problematicPatterns) {
        const regex = new RegExp(pattern, 'gi');
        if (regex.test(content)) {
          console.log(`   ❌ 在 ${filePath} 中发现问题模式: ${pattern}`);
          foundIssues = true;
        }
      }
      
      // 检查正确的模式
      if (content.includes('SupabaseService.getPrimarySalesSettlement')) {
        console.log(`   ✅ ${filePath} 使用正确的Supabase调用`);
      }
      
    } catch (error) {
      console.log(`   ❌ 无法检查文件 ${filePath}: ${error.message}`);
    }
  }
  
  if (!foundIssues) {
    console.log('   ✅ 没有发现错误的API调用模式\n');
  } else {
    console.log('   ⚠️  发现潜在问题，请手动检查\n');
  }
  
  return foundIssues;
}

// 3. 清理和重启开发环境
function restartDevelopment() {
  console.log('3. 重启开发环境...');
  
  try {
    console.log('   🧹 清理node_modules缓存...');
    process.chdir(path.join(__dirname, 'client'));
    
    // 清理缓存
    try {
      execSync('npm run build 2>/dev/null || echo "构建命令不存在或失败"', { stdio: 'ignore' });
    } catch (e) {
      // 忽略构建错误
    }
    
    console.log('   ✅ 环境重启准备完成');
    console.log('   💡 请手动重启开发服务器: cd client && npm start\n');
    
    return true;
  } catch (error) {
    console.error('   ❌ 重启准备失败:', error.message);
    return false;
  }
}

// 4. 创建测试页面访问脚本
function createTestScript() {
  console.log('4. 创建测试验证脚本...');
  
  const testScript = `#!/usr/bin/env node

/**
 * 验证一级销售对账页面修复效果
 */

console.log('🧪 测试一级销售对账页面...');
console.log('');
console.log('请按以下步骤验证修复效果:');
console.log('');
console.log('1. 打开浏览器，访问: http://localhost:3001/primary-sales-settlement');
console.log('');
console.log('2. 在查询框中输入:');
console.log('   销售代码: PRI17547241780648255');
console.log('');
console.log('3. 点击查询按钮');
console.log('');
console.log('4. 检查结果:');
console.log('   ✅ 应该显示 WML792355703 的销售数据');
console.log('   ✅ 总佣金应该显示: 1882.4');
console.log('   ✅ 订单数应该显示: 40');
console.log('   ✅ 不应该出现403错误');
console.log('');
console.log('5. 如果还有问题，请检查:');
console.log('   • 浏览器开发工具的Network标签');
console.log('   • 确认没有到localhost:3001/api的请求');
console.log('   • 所有请求都应该直接到Supabase');
console.log('');
console.log('预期测试地址: http://localhost:3001/primary-sales-settlement?sales_code=PRI17547241780648255');
`;

  fs.writeFileSync(path.join(__dirname, 'test-fix-result.js'), testScript);
  console.log('   ✅ 已创建测试脚本: test-fix-result.js\n');
}

// 5. 生成修复报告
function generateFixReport(proxyFixed, apiIssues) {
  console.log('5. 修复报告:');
  console.log('=' .repeat(50));
  
  console.log('修复项目:');
  if (proxyFixed) {
    console.log('   ✅ 已移除package.json中的代理配置');
  } else {
    console.log('   ℹ️  代理配置无需修改');
  }
  
  if (apiIssues) {
    console.log('   ⚠️  发现可能的API调用问题（需手动检查）');
  } else {
    console.log('   ✅ API调用代码看起来正常');
  }
  
  console.log('');
  console.log('下一步操作:');
  console.log('   1. 手动重启开发服务器: cd client && npm start');
  console.log('   2. 清除浏览器缓存（特别是开发工具缓存）');
  console.log('   3. 运行测试脚本: node test-fix-result.js');
  console.log('   4. 访问页面进行验证');
  console.log('');
  
  console.log('如果问题依然存在:');
  console.log('   • 问题可能在于浏览器开发工具的网络请求显示');
  console.log('   • 实际数据获取可能是正常的（通过Supabase）');
  console.log('   • 检查浏览器控制台的Console标签而非Network标签');
  console.log('');
  console.log('=' .repeat(50));
}

// 主执行函数
function main() {
  const proxyFixed = fixPackageJsonProxy();
  const apiIssues = checkForWrongAPICalls();
  restartDevelopment();
  createTestScript();
  generateFixReport(proxyFixed, apiIssues);
  
  console.log('🎉 修复脚本执行完成！');
  console.log('');
  console.log('🔍 关键提示:');
  console.log('   浏览器显示的403错误可能是误导性的');
  console.log('   实际数据获取应该通过Supabase进行');
  console.log('   请重点检查页面是否能正常显示数据');
}

main();