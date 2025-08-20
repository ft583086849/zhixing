/**
 * 代码兼容性修复脚本
 * 让所有duration判断兼容中英文格式
 */

const fs = require('fs');
const path = require('path');

// 需要修改的文件和对应的替换规则
const filesToFix = [
  {
    file: 'client/src/services/api.js',
    replacements: [
      {
        old: "order.duration === '7days'",
        new: "(order.duration === '7天' || order.duration === '7days')"
      },
      {
        old: "duration === '7days'",
        new: "(duration === '7天' || duration === '7days')"
      },
      {
        old: "duration === '1month'",
        new: "(duration === '1个月' || duration === '1month')"
      },
      {
        old: "duration === '3months'",
        new: "(duration === '3个月' || duration === '3months')"
      },
      {
        old: "duration === '6months'",
        new: "(duration === '6个月' || duration === '6months')"
      },
      {
        old: "duration === '1year'",
        new: "(duration === '1年' || duration === '1year')"
      }
    ]
  },
  {
    file: 'client/src/components/admin/AdminOrders.js',
    replacements: [
      {
        old: "record.duration === '7days'",
        new: "(record.duration === '7天' || record.duration === '7days')"
      }
    ]
  },
  {
    file: 'client/src/components/admin/AdminOrdersOptimized.js',
    replacements: [
      {
        old: "record.duration === '7days'",
        new: "(record.duration === '7天' || record.duration === '7days')"
      }
    ]
  },
  {
    file: 'client/src/services/supabase.js',
    replacements: [
      {
        old: "order.duration === '7days'",
        new: "(order.duration === '7天' || order.duration === '7days')"
      },
      {
        old: "order.duration === '1month'",
        new: "(order.duration === '1个月' || order.duration === '1month')"
      },
      {
        old: "order.duration === '3months'",
        new: "(order.duration === '3个月' || order.duration === '3months')"
      },
      {
        old: "order.duration === '6months'",
        new: "(order.duration === '6个月' || order.duration === '6months')"
      },
      {
        old: "order.duration === '1year'",
        new: "(order.duration === '1年' || order.duration === '1year')"
      }
    ]
  }
];

// 同时需要更新显示映射
const displayMappings = `
// Duration显示映射 - 兼容中英文
const durationMap = {
  '7天': '7天免费',
  '7days': '7天免费',
  '1个月': '1个月',
  '1month': '1个月',
  '3个月': '3个月',
  '3months': '3个月',
  '6个月': '6个月',
  '6months': '6个月',
  '1年': '1年',
  '1year': '1年'
};
`;

console.log('========================================');
console.log('代码兼容性修复');
console.log('========================================\n');

// 备份原文件
function backupFile(filePath) {
  const backupPath = filePath + '.before-duration-fix';
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ 备份文件: ${path.basename(backupPath)}`);
  }
}

// 修复文件
function fixFile(fileConfig) {
  const filePath = path.join(__dirname, fileConfig.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${fileConfig.file}`);
    return;
  }
  
  // 备份
  backupFile(filePath);
  
  // 读取文件
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 应用替换
  fileConfig.replacements.forEach(replacement => {
    if (content.includes(replacement.old)) {
      content = content.replace(new RegExp(replacement.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.new);
      console.log(`  ✓ 替换: ${replacement.old} → ${replacement.new}`);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 已修复: ${fileConfig.file}\n`);
  } else {
    console.log(`ℹ️  无需修改: ${fileConfig.file}\n`);
  }
}

// 执行修复
filesToFix.forEach(fixFile);

console.log('========================================');
console.log('修复完成！');
console.log('========================================\n');

console.log('📋 已完成的修改:');
console.log('1. 所有duration判断现在兼容中英文格式');
console.log('2. 原文件已备份为 .before-duration-fix');
console.log('3. 现在可以安全地修改数据库了\n');

console.log('📌 下一步:');
console.log('1. 测试功能是否正常');
console.log('2. 访问 http://localhost:3000/fix-duration 修复数据库');
console.log('3. 在Supabase执行触发器SQL确保新数据规范\n');

console.log('⚠️  注意事项:');
console.log('- 如需回滚，使用 .before-duration-fix 备份文件');
console.log('- 建议先在测试环境验证');
console.log('- 确认无误后再部署到生产环境');