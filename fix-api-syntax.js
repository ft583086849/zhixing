// 修复api.js语法错误
const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'client/src/services/api.js');
let content = fs.readFileSync(apiPath, 'utf8');

// 分割成行
const lines = content.split('\n');

// 找到getSales函数的正确结束位置（第733行）
// 删除从第734行（索引733）到getCustomers函数之前的所有重复代码

// 保留前733行
const correctLines = lines.slice(0, 733);

// 找到getCustomers函数的开始位置（第227行，但索引是226）
// 我们需要找到第二个getCustomers函数，因为第一个在第227行
let getCustomersIndex = -1;
for (let i = 733; i < lines.length; i++) {
  if (lines[i].includes('async getCustomers(params = {})')) {
    // 找到了getCustomers函数，向前找到注释
    for (let j = i - 1; j >= 733; j--) {
      if (lines[j].includes('* 获取客户列表')) {
        getCustomersIndex = j - 1; // 注释开始的前一行
        break;
      }
    }
    if (getCustomersIndex === -1) {
      getCustomersIndex = i - 2; // 如果没找到注释，就从函数前2行开始
    }
    break;
  }
}

// 如果没找到getCustomers，就查找文件末尾的其他标志
if (getCustomersIndex === -1) {
  // 查找AdminAPI对象的结束
  for (let i = lines.length - 1; i >= 733; i--) {
    if (lines[i].trim() === '};' || lines[i].trim() === '}') {
      // 找到了可能的结束位置
      getCustomersIndex = i;
      break;
    }
  }
}

console.log('找到的getCustomers位置索引:', getCustomersIndex);

// 保留getCustomers及之后的内容
let remainingLines = [];
if (getCustomersIndex > 733) {
  remainingLines = lines.slice(getCustomersIndex);
}

// 在getSales函数后添加一个正确的结束括号和逗号
correctLines.push('  },');
correctLines.push('');

// 合并正确的内容
const fixedContent = [...correctLines, ...remainingLines].join('\n');

// 写回文件
fs.writeFileSync(apiPath, fixedContent, 'utf8');
console.log('✅ 语法错误已修复');
console.log('删除了', getCustomersIndex - 733, '行重复代码');