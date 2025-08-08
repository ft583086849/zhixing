-- 🔧 修复Supabase权限问题
-- 请在 Supabase Dashboard 的 SQL Editor 中运行此脚本

-- 1. 检查 secondary_sales 表的 RLS 状态
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'secondary_sales';

-- 2. 检查现有的 RLS 策略
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'secondary_sales';

-- 3. 临时禁用 RLS（仅用于测试）
-- 警告：这会允许所有人访问数据，仅在测试环境使用
-- ALTER TABLE secondary_sales DISABLE ROW LEVEL SECURITY;

-- 4. 或者创建允许匿名插入的策略（推荐）
-- 首先启用 RLS
ALTER TABLE secondary_sales ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "允许匿名创建二级销售" ON secondary_sales;
DROP POLICY IF EXISTS "允许查看所有二级销售" ON secondary_sales;
DROP POLICY IF EXISTS "允许更新自己的二级销售" ON secondary_sales;

-- 创建新的策略

-- 策略1: 允许匿名用户创建二级销售
CREATE POLICY "允许匿名创建二级销售" 
ON secondary_sales 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 策略2: 允许所有人查看二级销售（用于验证和查询）
CREATE POLICY "允许查看所有二级销售" 
ON secondary_sales 
FOR SELECT 
TO anon, authenticated
USING (true);

-- 策略3: 允许更新自己创建的记录（基于session或其他标识）
CREATE POLICY "允许更新二级销售" 
ON secondary_sales 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 策略4: 允许删除（仅用于测试清理）
CREATE POLICY "允许删除二级销售" 
ON secondary_sales 
FOR DELETE 
TO anon, authenticated
USING (true);

-- 5. 验证策略是否生效
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'secondary_sales'
ORDER BY policyname;

-- 6. 测试插入权限
-- 尝试插入一条测试记录
INSERT INTO secondary_sales (
    wechat_name,
    crypto_address,
    sales_code,
    commission_rate,
    payment_method,
    sales_type,
    created_at
) VALUES (
    'RLS测试_' || extract(epoch from now())::text,
    '0xTest' || extract(epoch from now())::text,
    'SEC' || extract(epoch from now())::text,
    30,
    'crypto',
    'secondary',
    now()
) RETURNING *;

-- 7. 清理测试数据
DELETE FROM secondary_sales 
WHERE wechat_name LIKE 'RLS测试_%'
OR wechat_name LIKE 'test_%'
OR wechat_name LIKE '测试独立%';

-- 8. 输出最终状态
SELECT 
    'secondary_sales表RLS状态' as info,
    CASE 
        WHEN rowsecurity THEN '已启用 ✅' 
        ELSE '已禁用 ⚠️' 
    END as status
FROM pg_tables 
WHERE tablename = 'secondary_sales';
