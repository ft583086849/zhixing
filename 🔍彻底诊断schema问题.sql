-- 🔍 彻底诊断 Supabase Schema 问题
-- 重启后错误仍存在，需要深入检查

-- ===============================================
-- 1. 检查当前连接的数据库和模式
-- ===============================================
SELECT 
    current_database() as current_db,
    current_schema() as current_schema,
    current_user as current_user;

-- ===============================================
-- 2. 检查所有模式中的表
-- ===============================================
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename IN ('primary_sales', 'secondary_sales')
ORDER BY schemaname, tablename;

-- ===============================================
-- 3. 检查 public 模式中的表结构
-- ===============================================
SELECT 
    'public.primary_sales' as table_info,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'primary_sales'
ORDER BY ordinal_position;

SELECT 
    'public.secondary_sales' as table_info,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'secondary_sales'
ORDER BY ordinal_position;

-- ===============================================
-- 4. 检查是否在其他模式中
-- ===============================================
SELECT 
    table_schema,
    table_name,
    column_name
FROM information_schema.columns 
WHERE column_name = 'sales_type'
AND table_name IN ('primary_sales', 'secondary_sales');

-- ===============================================
-- 5. 检查 PostgREST 可访问性
-- ===============================================
-- 这些是 Supabase API 实际会执行的查询
SELECT '=== 测试 PostgREST 访问 ===' as test_section;

-- 测试基本表访问
SELECT COUNT(*) as primary_sales_count FROM primary_sales;
SELECT COUNT(*) as secondary_sales_count FROM secondary_sales;

-- 测试 sales_type 字段访问
SELECT sales_type FROM primary_sales LIMIT 1;
SELECT sales_type FROM secondary_sales LIMIT 1;

-- ===============================================
-- 6. 检查表权限
-- ===============================================
SELECT 
    table_schema,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name IN ('primary_sales', 'secondary_sales')
AND grantee IN ('postgres', 'authenticator', 'anon', 'authenticated');

-- ===============================================
-- 7. 模拟 Supabase API 插入
-- ===============================================
SELECT '=== 模拟 API 插入测试 ===' as test_section;

-- 这个插入应该完全模拟前端发送的数据
INSERT INTO primary_sales (
    wechat_name,
    payment_method,
    alipay_account,
    name,
    sales_type
) VALUES (
    'DEEP_TEST_' || EXTRACT(EPOCH FROM NOW())::bigint,
    'alipay',
    'deeptest@test.com',
    '深度测试',
    'primary'
) RETURNING *;

-- 清理测试数据
DELETE FROM primary_sales WHERE wechat_name LIKE 'DEEP_TEST_%';

-- ===============================================
-- 最终诊断结果
-- ===============================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'primary_sales' 
            AND column_name = 'sales_type'
            AND table_schema = 'public'
        ) THEN '✅ primary_sales.sales_type 字段存在'
        ELSE '❌ primary_sales.sales_type 字段不存在'
    END as primary_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'secondary_sales' 
            AND column_name = 'sales_type'
            AND table_schema = 'public'
        ) THEN '✅ secondary_sales.sales_type 字段存在'
        ELSE '❌ secondary_sales.sales_type 字段不存在'
    END as secondary_status;