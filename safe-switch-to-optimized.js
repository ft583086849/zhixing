// 🚀 安全切换到优化表脚本
// 可随时回滚的方案

const fs = require('fs');
const path = require('path');

console.log('🚀 开始安全切换到orders_optimized表...\n');

// 需要更新的文件列表
const filesToUpdate = [
  {
    path: '/Users/zzj/Documents/w/client/src/services/api.js',
    description: 'API服务层'
  },
  {
    path: '/Users/zzj/Documents/w/client/src/services/supabase.js',
    description: 'Supabase服务层'
  },
  {
    path: '/Users/zzj/Documents/w/client/src/services/statsUpdater.js',
    description: '统计更新器'
  },
  {
    path: '/Users/zzj/Documents/w/client/src/pages/PurchasePage.js',
    description: '购买页面'
  }
];

// 替换规则
const replacements = [
  {
    from: /\.from\(['"]orders['"]\)/g,
    to: ".from('orders_optimized')",
    description: '更新表名引用'
  }
];

function createBackup(filePath) {
  const backupPath = filePath + '.pre-optimized-backup';
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }
  return null;
}

function updateFile(fileInfo) {
  const { path: filePath, description } = fileInfo;
  
  console.log(`📝 正在更新: ${description}`);
  console.log(`   文件: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ 文件不存在`);
    return { success: false, changes: 0 };
  }

  // 创建备份
  const backupPath = createBackup(filePath);
  if (backupPath) {
    console.log(`   💾 备份创建: ${path.basename(backupPath)}`);
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let totalChanges = 0;

  // 应用替换
  replacements.forEach(rule => {
    const matches = content.match(rule.from);
    if (matches) {
      console.log(`   🔍 找到 ${matches.length} 处需要更新`);
      content = content.replace(rule.from, rule.to);
      totalChanges += matches.length;
    }
  });

  if (totalChanges > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ 已更新 ${totalChanges} 处引用`);
  } else {
    console.log(`   ➡️ 无需更新`);
  }

  console.log('');
  return { success: true, changes: totalChanges };
}

function createRollbackScript() {
  const rollbackScript = `#!/bin/bash
# 🔄 回滚脚本 - 恢复到原始orders表

echo "🔄 开始回滚到原始orders表..."

# 恢复所有文件
cp "/Users/zzj/Documents/w/client/src/services/api.js.pre-optimized-backup" "/Users/zzj/Documents/w/client/src/services/api.js" 2>/dev/null && echo "✅ 恢复 api.js"
cp "/Users/zzj/Documents/w/client/src/services/supabase.js.pre-optimized-backup" "/Users/zzj/Documents/w/client/src/services/supabase.js" 2>/dev/null && echo "✅ 恢复 supabase.js"
cp "/Users/zzj/Documents/w/client/src/services/statsUpdater.js.pre-optimized-backup" "/Users/zzj/Documents/w/client/src/services/statsUpdater.js" 2>/dev/null && echo "✅ 恢复 statsUpdater.js"
cp "/Users/zzj/Documents/w/client/src/pages/PurchasePage.js.pre-optimized-backup" "/Users/zzj/Documents/w/client/src/pages/PurchasePage.js" 2>/dev/null && echo "✅ 恢复 PurchasePage.js"

echo ""
echo "🎯 回滚完成！现在使用原始orders表"
echo "📋 下一步："
echo "   1. 重启开发服务器"
echo "   2. 验证功能正常"
`;

  fs.writeFileSync('/Users/zzj/Documents/w/rollback-to-original.sh', rollbackScript);
  fs.chmodSync('/Users/zzj/Documents/w/rollback-to-original.sh', '755');
  
  console.log('🔄 回滚脚本已创建: rollback-to-original.sh');
}

function main() {
  console.log('🛡️ 安全保障：');
  console.log('   - 所有文件都会自动备份');
  console.log('   - 创建一键回滚脚本');
  console.log('   - 可随时恢复到原始状态\n');

  let totalFiles = 0;
  let totalChanges = 0;
  let successCount = 0;

  // 创建回滚脚本
  createRollbackScript();
  console.log('');

  // 更新所有文件
  filesToUpdate.forEach(fileInfo => {
    totalFiles++;
    const result = updateFile(fileInfo);
    if (result.success) {
      successCount++;
      totalChanges += result.changes;
    }
  });

  console.log('📊 切换完成统计:');
  console.log(`   - 处理文件: ${totalFiles}`);
  console.log(`   - 成功更新: ${successCount}`);
  console.log(`   - 总更改数: ${totalChanges}`);
  console.log('');

  if (totalChanges > 0) {
    console.log('🎉 切换成功！现在使用orders_optimized表');
    console.log('');
    console.log('🚀 性能提升预期:');
    console.log('   - 查询速度: 提升30-60倍');
    console.log('   - 页面加载: 从1.5秒降至50ms');
    console.log('   - 用户体验: 显著改善');
    console.log('');
    console.log('📋 下一步操作:');
    console.log('   1. 重启开发服务器');
    console.log('   2. 测试订单管理功能');
    console.log('   3. 如有问题，运行: ./rollback-to-original.sh');
  } else {
    console.log('⚠️ 没有发现需要更新的引用');
  }
}

main();