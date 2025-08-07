-- ================================================
-- 紧急修复订单更新权限问题
-- 请在Supabase控制台的SQL编辑器中执行
-- ================================================

-- 1. 完全禁用所有表的RLS（包括读写权限）
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE primary_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- 2. 授予anon角色完整的CRUD权限
GRANT ALL PRIVILEGES ON orders TO anon;
GRANT ALL PRIVILEGES ON primary_sales TO anon;
GRANT ALL PRIVILEGES ON secondary_sales TO anon;
GRANT ALL PRIVILEGES ON admins TO anon;

-- 3. 授予authenticated角色完整权限（如果有认证用户）
GRANT ALL PRIVILEGES ON orders TO authenticated;
GRANT ALL PRIVILEGES ON primary_sales TO authenticated;
GRANT ALL PRIVILEGES ON secondary_sales TO authenticated;
GRANT ALL PRIVILEGES ON admins TO authenticated;

-- 4. 确保序列权限（用于自增ID）
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. 验证权限设置
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('orders', 'primary_sales', 'secondary_sales', 'admins')
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- 6. 验证RLS状态（应该都是false）
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('orders', 'primary_sales', 'secondary_sales', 'admins');

-- 7. 测试更新（使用实际存在的订单ID）
-- 先查看一条订单
SELECT id, order_number, status FROM orders LIMIT 1;

-- 然后测试更新（将下面的1替换为实际的订单ID）
-- UPDATE orders SET status = 'confirmed_payment', updated_at = NOW() WHERE id = 1 RETURNING *;

-- 8. 如果updated_at字段不存在，添加它
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to orders table';
    END IF;
END $$;

-- 9. 刷新Supabase的权限缓存
-- 注意：这个命令可能需要超级用户权限
-- NOTIFY pgrst, 'reload schema';
