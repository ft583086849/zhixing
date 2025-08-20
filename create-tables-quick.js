#!/usr/bin/env node

/**
 * 快速创建排除功能所需的数据库表
 */

console.log('🗄️ 创建销售统计排除功能数据库表\n');

console.log('请在 Supabase SQL Editor 中执行以下SQL：\n');

const simpleSQL = `
-- 创建销售统计排除配置表
CREATE TABLE IF NOT EXISTS excluded_sales_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wechat_name VARCHAR(255) NOT NULL,
  sales_code VARCHAR(50),
  sales_type VARCHAR(20),
  reason TEXT,
  excluded_by VARCHAR(255),
  excluded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS excluded_sales_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wechat_name VARCHAR(255) NOT NULL,
  sales_code VARCHAR(50),
  action VARCHAR(20) NOT NULL,
  reason TEXT,
  operated_by VARCHAR(255),
  operated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  affected_orders_count INT DEFAULT 0,
  affected_amount DECIMAL(10, 2) DEFAULT 0,
  affected_commission DECIMAL(10, 2) DEFAULT 0
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_excluded_wechat ON excluded_sales_config(wechat_name);
CREATE INDEX IF NOT EXISTS idx_excluded_active ON excluded_sales_config(is_active);
CREATE INDEX IF NOT EXISTS idx_excluded_log_wechat ON excluded_sales_log(wechat_name);
CREATE INDEX IF NOT EXISTS idx_excluded_log_time ON excluded_sales_log(operated_at DESC);

-- 设置权限（如果需要）
-- ALTER TABLE excluded_sales_config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE excluded_sales_log ENABLE ROW LEVEL SECURITY;

-- 测试插入一条记录（可选）
-- INSERT INTO excluded_sales_config (wechat_name, reason, excluded_by) 
-- VALUES ('测试销售001', '测试账号', 'admin');
`;

console.log(simpleSQL);

console.log('\n⚠️ 执行步骤:');
console.log('1. 登录 Supabase 控制台');
console.log('2. 选择你的项目');
console.log('3. 进入 SQL Editor');
console.log('4. 复制上面的SQL并执行');
console.log('5. 确认表创建成功\n');

console.log('✅ 执行成功后应该看到:');
console.log('- excluded_sales_config 表创建成功');
console.log('- excluded_sales_log 表创建成功');
console.log('- 各个索引创建成功');
console.log('- 无错误信息\n');

console.log('🧪 验证表创建:');
console.log('可以执行以下SQL验证：');
console.log('SELECT * FROM excluded_sales_config LIMIT 1;');
console.log('SELECT * FROM excluded_sales_log LIMIT 1;');

console.log('\n✅ 表创建完成后就可以测试功能了！');