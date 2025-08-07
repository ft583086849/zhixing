-- =============================================
-- 🔥 完全修复Supabase权限问题
-- 在Supabase SQL Editor中执行
-- =============================================

-- 1. 禁用所有表的RLS（如果还没禁用）
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE primary_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config DISABLE ROW LEVEL SECURITY;

-- 2. 授予anon角色完整权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 3. 授予authenticated角色完整权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 4. 特别确保orders表的权限
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;

-- 5. 确保service_role也有权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- 6. 验证权限设置
SELECT 
    tablename,
    has_table_privilege('anon', tablename, 'SELECT') as can_select,
    has_table_privilege('anon', tablename, 'INSERT') as can_insert,
    has_table_privilege('anon', tablename, 'UPDATE') as can_update,
    has_table_privilege('anon', tablename, 'DELETE') as can_delete
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('orders', 'primary_sales', 'secondary_sales');

-- 7. 测试更新操作
UPDATE orders 
SET status = 'test_update', 
    updated_at = NOW()
WHERE id = (SELECT id FROM orders LIMIT 1)
RETURNING id, status, updated_at;

-- 8. 恢复原状态（如果测试成功）
UPDATE orders 
SET status = 'pending_payment'
WHERE status = 'test_update';

-- 9. 查看当前RLS状态
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('orders', 'primary_sales', 'secondary_sales', 'admins', 'payment_config');
