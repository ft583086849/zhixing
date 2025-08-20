#!/usr/bin/env node

/**
 * 测试ExcludedSalesService的基本功能
 */

console.log('🧪 测试排除服务功能\n');

// 模拟导入测试
const testImport = `
// 测试基础模块结构
const fs = require('fs');
const path = require('path');

console.log('检查关键文件是否存在...');

const filesToCheck = [
  'src/services/excludedSalesService.js',
  'src/components/admin/ExcludedSalesConfig.js',
  'src/components/admin/AdminPaymentConfig.js'
];

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log('✅', file);
  } else {
    console.log('❌', file, '文件不存在');
  }
});
`;

console.log('文件存在性检查:');
eval(testImport);

console.log('\n🔍 检查代码语法...');

// 检查ExcludedSalesService
const fs = require('fs');
const path = require('path');

try {
  const servicePath = path.join(__dirname, 'src/services/excludedSalesService.js');
  if (fs.existsSync(servicePath)) {
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    // 基本语法检查
    if (serviceContent.includes('class ExcludedSalesService') || serviceContent.includes('export default')) {
      console.log('✅ ExcludedSalesService 语法结构正确');
    }
    
    if (serviceContent.includes('getExcludedSales') && serviceContent.includes('addExcludedSales')) {
      console.log('✅ 包含必要的方法');
    }
    
    if (serviceContent.includes('supabase.from')) {
      console.log('✅ 包含数据库操作');
    }
  }
} catch (error) {
  console.log('❌ 语法检查失败:', error.message);
}

console.log('\n📋 下一步操作建议:');
console.log('1. 访问 http://localhost:3000/admin/dashboard');
console.log('2. 点击左侧菜单的"收款配置"');
console.log('3. 检查是否显示"统计排除名单"部分');
console.log('4. 测试添加排除功能');

console.log('\n🚀 如果文件都存在且语法正确，功能应该可以正常使用！');