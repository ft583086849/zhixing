#!/usr/bin/env node

/**
 * 回滚脚本 - 恢复到使用原orders表
 * 使用方法: node rollback-orders.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 开始回滚订单系统到原始版本...\n');

// 需要回滚的文件列表
const filesToRollback = [
  {
    original: 'client/src/components/admin/AdminOrders.js',
    backup: 'client/src/components/admin/AdminOrders.js.backup'
  },
  {
    original: 'client/src/services/api.js',
    backup: 'client/src/services/api.js.backup'
  },
  {
    original: 'routes/orders.js',
    backup: 'routes/orders.js.backup'
  }
];

let successCount = 0;
let errorCount = 0;

// 执行回滚
filesToRollback.forEach(file => {
  try {
    if (fs.existsSync(file.backup)) {
      // 读取备份文件内容
      const backupContent = fs.readFileSync(file.backup, 'utf8');
      
      // 写入到原文件
      fs.writeFileSync(file.original, backupContent, 'utf8');
      
      console.log(`✅ 已回滚: ${file.original}`);
      successCount++;
    } else {
      console.log(`⚠️  备份文件不存在: ${file.backup}`);
      console.log(`   尝试手动恢复表名引用...`);
      
      // 如果没有备份文件，尝试直接替换表名
      if (fs.existsSync(file.original)) {
        let content = fs.readFileSync(file.original, 'utf8');
        
        // 替换表名引用
        content = content.replace(/\.from\(['"]orders_optimized['"]\)/g, ".from('orders')");
        content = content.replace(/FROM orders_optimized/g, "FROM orders");
        content = content.replace(/UPDATE orders_optimized/g, "UPDATE orders");
        content = content.replace(/INSERT INTO orders_optimized/g, "INSERT INTO orders");
        
        fs.writeFileSync(file.original, content, 'utf8');
        console.log(`✅ 已手动回滚: ${file.original}`);
        successCount++;
      }
    }
  } catch (error) {
    console.error(`❌ 回滚失败 ${file.original}:`, error.message);
    errorCount++;
  }
});

console.log('\n📊 回滚结果:');
console.log(`   成功: ${successCount} 个文件`);
console.log(`   失败: ${errorCount} 个文件`);

if (errorCount === 0) {
  console.log('\n✅ 回滚完成！');
  console.log('\n下一步:');
  console.log('1. 重新构建前端: npm run build');
  console.log('2. 重启服务: npm restart');
  console.log('3. 验证功能是否正常');
} else {
  console.log('\n⚠️  部分文件回滚失败，请手动检查');
}

// 生成回滚SQL脚本
const rollbackSQL = `
-- 如果需要在数据库层面回滚，执行以下SQL
-- 注意：这不会删除orders_optimized表，只是停止使用它

-- 1. 删除自动同步触发器
DROP TRIGGER IF EXISTS trg_sync_orders ON orders;

-- 2. 验证原表数据完整性
SELECT COUNT(*) as "原表记录数" FROM orders;

-- 3. 如果需要从orders_optimized同步数据回orders（谨慎执行）
-- INSERT INTO orders (id, order_number, ...)
-- SELECT id, order_number, ...
-- FROM orders_optimized
-- WHERE id NOT IN (SELECT id FROM orders)
-- ON CONFLICT (id) DO NOTHING;

-- 注意：orders_optimized表保留不删除，以便需要时可以再次切换
`;

fs.writeFileSync('rollback-orders.sql', rollbackSQL, 'utf8');
console.log('\n📝 已生成数据库回滚脚本: rollback-orders.sql');