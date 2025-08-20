// 删除getSales函数后的多余代码
const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'client/src/services/api.js');
let content = fs.readFileSync(apiPath, 'utf8');

// 分割成行
const lines = content.split('\n');

// 找到要删除的部分（第733行到第1251行）
// 第733行索引是732，第1251行索引是1250
const startDelete = 732;
const endDelete = 1250;

console.log(`删除第${startDelete + 1}行到第${endDelete + 1}行的多余代码`);

// 删除多余的行
const newLines = [
  ...lines.slice(0, startDelete),
  '',  // 添加一个空行
  ...lines.slice(endDelete + 1)
];

// 合并内容
const newContent = newLines.join('\n');

// 写回文件
fs.writeFileSync(apiPath, newContent, 'utf8');
console.log('✅ 多余代码已删除');