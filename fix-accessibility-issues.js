#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const files = [
  'client/src/pages/SalesPage.js',
  'client/src/pages/SalesReconciliationPage.js'
];

// 修复函数
function fixAccessibilityIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 修复 Form 组件的 role 和 aria-invalid 属性
    content = content.replace(/role="form" aria-invalid="false">/g, '>');
    content = content.replace(/role="form" aria-invalid="false"\s*>/g, '>');
    
    // 修复 Form.Item 的 role 和 aria-invalid 属性
    content = content.replace(/<Form\.Item([^>]*?)role="form" aria-invalid="false">/g, '<Form.Item$1>');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 修复完成: ${filePath}`);
  } catch (error) {
    console.error(`❌ 修复失败: ${filePath}`, error.message);
  }
}

// 执行修复
console.log('🔧 开始修复可访问性问题...\n');

files.forEach(file => {
  if (fs.existsSync(file)) {
    fixAccessibilityIssues(file);
  } else {
    console.log(`⚠️  文件不存在: ${file}`);
  }
});

console.log('\n🎉 可访问性问题修复完成！'); 