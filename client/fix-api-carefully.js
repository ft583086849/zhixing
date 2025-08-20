/**
 * 精确修复api.js中的duration判断
 * 避免语法错误
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/api.js');

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');

// 定义精确的替换规则
const replacements = [
  // 修复 order.duration 的判断
  {
    pattern: /order\.duration === '7days'/g,
    replacement: "(order.duration === '7天' || order.duration === '7days')"
  },
  {
    pattern: /order\.duration === '1month'/g,
    replacement: "(order.duration === '1个月' || order.duration === '1month')"
  },
  {
    pattern: /order\.duration === '3months'/g,
    replacement: "(order.duration === '3个月' || order.duration === '3months')"
  },
  {
    pattern: /order\.duration === '6months'/g,
    replacement: "(order.duration === '6个月' || order.duration === '6months')"
  },
  {
    pattern: /order\.duration === '1year'/g,
    replacement: "(order.duration === '1年' || order.duration === '1year')"
  },
  // 修复独立的 duration 判断（确保不是 order.duration）
  {
    pattern: /(?<!order\.)duration === '7days'/g,
    replacement: "(duration === '7天' || duration === '7days')"
  },
  {
    pattern: /(?<!order\.)duration === '1month'/g,
    replacement: "(duration === '1个月' || duration === '1month')"
  },
  {
    pattern: /(?<!order\.)duration === '3months'/g,
    replacement: "(duration === '3个月' || duration === '3months')"
  },
  {
    pattern: /(?<!order\.)duration === '6months'/g,
    replacement: "(duration === '6个月' || duration === '6months')"
  },
  {
    pattern: /(?<!order\.)duration === '1year'/g,
    replacement: "(duration === '1年' || duration === '1year')"
  }
];

console.log('开始修复 api.js...\n');

let changeCount = 0;

replacements.forEach(rule => {
  const matches = content.match(rule.pattern);
  if (matches) {
    content = content.replace(rule.pattern, rule.replacement);
    console.log(`✓ 替换了 ${matches.length} 处: ${rule.pattern.source}`);
    changeCount += matches.length;
  }
});

if (changeCount > 0) {
  // 写入文件
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\n✅ 成功修复 api.js，共修改 ${changeCount} 处`);
} else {
  console.log('ℹ️  api.js 无需修改');
}

console.log('\n现在可以重新访问 http://localhost:3000/admin/orders');