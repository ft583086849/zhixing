#!/usr/bin/env node

/**
 * 生产环境部署脚本 - 切换到orders_optimized表
 * 使用方法: node production-deploy.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始部署订单系统优化版本...\n');

// 创建时间戳备份目录
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = `backups/deploy-${timestamp}`;

// 创建备份目录
if (!fs.existsSync('backups')) {
  fs.mkdirSync('backups');
}
fs.mkdirSync(backupDir, { recursive: true });

console.log(`📁 创建备份目录: ${backupDir}\n`);

// 需要修改的文件列表
const filesToModify = [
  'client/src/components/admin/AdminOrders.js',
  'client/src/services/api.js', 
  'routes/orders.js'
];

// 1. 备份所有文件
console.log('1️⃣ 备份原始文件...');
filesToModify.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const backupPath = path.join(backupDir, path.basename(file));
    fs.writeFileSync(backupPath, content, 'utf8');
    
    // 同时创建.backup文件用于快速回滚
    fs.writeFileSync(`${file}.backup`, content, 'utf8');
    
    console.log(`   ✅ 已备份: ${file}`);
  }
});

// 2. 修改表名引用
console.log('\n2️⃣ 更新代码中的表名引用...');

const replacements = [
  {
    from: /\.from\(['"]orders['"]\)/g,
    to: ".from('orders_optimized')",
    description: '更新Supabase查询'
  },
  {
    from: /FROM orders(?!\w)/g,
    to: "FROM orders_optimized",
    description: '更新SQL查询'
  },
  {
    from: /UPDATE orders(?!\w)/g,
    to: "UPDATE orders_optimized",
    description: '更新UPDATE语句'
  },
  {
    from: /INSERT INTO orders(?!\w)/g,
    to: "INSERT INTO orders_optimized",
    description: '更新INSERT语句'
  }
];

let modifiedCount = 0;
filesToModify.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    replacements.forEach(replacement => {
      const before = content;
      content = content.replace(replacement.from, replacement.to);
      if (before !== content) {
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`   ✅ 已更新: ${file}`);
      modifiedCount++;
    } else {
      console.log(`   ℹ️  无需更新: ${file}`);
    }
  }
});

// 3. 生成部署检查清单
const checklist = `
# 部署检查清单

## 部署前检查
- [ ] 确认orders_optimized表已创建
- [ ] 确认数据已同步（orders → orders_optimized）
- [ ] 确认自动同步触发器已创建
- [ ] 确认测试环境验证通过

## 部署步骤
- [ ] 执行 git pull 获取最新代码
- [ ] 执行 npm install 安装依赖
- [ ] 执行 npm run build 构建前端
- [ ] 重启Node.js服务
- [ ] 清除CDN缓存（如果有）

## 部署后验证
- [ ] 访问订单管理页面，确认能正常显示
- [ ] 测试筛选功能是否正常
- [ ] 测试分页功能是否正常
- [ ] 检查页面加载速度是否提升
- [ ] 监控错误日志

## 回滚方案
如需回滚，执行: node rollback-orders.js

## 备份位置
- 本次备份目录: ${backupDir}
- 快速回滚备份: *.backup文件
`;

fs.writeFileSync('deployment-checklist.md', checklist, 'utf8');

// 4. 生成数据库部署SQL
const deploySQL = `
-- 生产环境数据库部署脚本
-- 执行时间: ${new Date().toISOString()}

-- 1. 验证orders_optimized表是否存在
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'orders_optimized';

-- 2. 同步最新数据（如果需要）
INSERT INTO orders_optimized
SELECT * FROM orders 
WHERE id NOT IN (SELECT id FROM orders_optimized)
ON CONFLICT (id) DO NOTHING;

-- 3. 验证数据一致性
SELECT 
  (SELECT COUNT(*) FROM orders) as orders_count,
  (SELECT COUNT(*) FROM orders_optimized) as optimized_count,
  (SELECT MAX(created_at) FROM orders) as orders_latest,
  (SELECT MAX(created_at) FROM orders_optimized) as optimized_latest;

-- 4. 创建或更新触发器（如果还没创建）
-- 执行 create-auto-sync-trigger.sql
`;

fs.writeFileSync('deploy-database.sql', deploySQL, 'utf8');

console.log('\n✅ 部署准备完成！');
console.log('\n📋 已生成文件:');
console.log('   - deployment-checklist.md (部署检查清单)');
console.log('   - deploy-database.sql (数据库部署脚本)');
console.log('   - rollback-orders.js (回滚脚本)');
console.log(`   - ${backupDir}/ (备份文件)`);
console.log('\n下一步:');
console.log('1. 查看 deployment-checklist.md 并按步骤执行');
console.log('2. 在Supabase Dashboard执行 deploy-database.sql');
console.log('3. 提交代码并部署到生产环境');
console.log('\n⚠️  如遇问题，执行: node rollback-orders.js 进行回滚');