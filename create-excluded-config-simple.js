#!/usr/bin/env node

console.log('📋 销售统计排除功能 - 数据库表创建指南\n');

console.log('请按以下步骤在 Supabase 控制台创建表：\n');

console.log('1. 登录 Supabase 控制台');
console.log('2. 选择你的项目');
console.log('3. 进入 SQL Editor');
console.log('4. 复制并执行 create-excluded-sales-table.sql 文件中的SQL\n');

console.log('表结构说明：');
console.log('📊 excluded_sales_config - 排除配置表');
console.log('   - wechat_name: 被排除的微信号');
console.log('   - sales_code: 销售代码');
console.log('   - reason: 排除原因');
console.log('   - is_active: 是否生效\n');

console.log('📝 excluded_sales_log - 操作日志表');
console.log('   - 记录所有排除/恢复操作');
console.log('   - 记录操作影响的数据量\n');

console.log('创建完成后，系统将具备以下功能：');
console.log('✅ 在收款配置页面管理排除名单');
console.log('✅ 管理后台统计自动过滤排除的销售');
console.log('✅ 销售对账页面不受影响，显示完整数据');
console.log('✅ 所有操作有日志记录\n');

// 生成一个简化的测试SQL
const testSQL = `
-- 测试：创建排除配置表（简化版）
CREATE TABLE IF NOT EXISTS excluded_sales_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wechat_name VARCHAR(255) NOT NULL,
  sales_code VARCHAR(50),
  reason TEXT,
  excluded_by VARCHAR(255),
  excluded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_excluded_wechat ON excluded_sales_config(wechat_name);
CREATE INDEX IF NOT EXISTS idx_excluded_active ON excluded_sales_config(is_active);

-- 测试插入
-- INSERT INTO excluded_sales_config (wechat_name, reason, excluded_by) 
-- VALUES ('测试销售001', '内部测试账号', 'admin');
`;

console.log('如果需要快速测试，可以先执行以下简化SQL：');
console.log('```sql');
console.log(testSQL);
console.log('```\n');

console.log('完整SQL文件位置：');
console.log('📁 /Users/zzj/Documents/w/create-excluded-sales-table.sql\n');

console.log('下一步：');
console.log('1. 在Supabase执行SQL创建表');
console.log('2. 修改API添加过滤逻辑');
console.log('3. 在收款配置页面添加管理界面');