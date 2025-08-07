-- 🔧 紧急修复Supabase权限 - 临时禁用RLS
-- 在Supabase SQL编辑器中运行

-- 1. 禁用一级销售表RLS
ALTER TABLE primary_sales DISABLE ROW LEVEL SECURITY;

-- 2. 禁用二级销售表RLS  
ALTER TABLE secondary_sales DISABLE ROW LEVEL SECURITY;

-- 3. 禁用支付配置表RLS
ALTER TABLE payment_config DISABLE ROW LEVEL SECURITY;

-- 4. 验证orders表RLS状态（应该已经禁用）
-- 如果orders表有问题，也禁用：
-- ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 5. 验证修复结果
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('primary_sales', 'secondary_sales', 'payment_config', 'orders');

-- rowsecurity应该显示为 false
