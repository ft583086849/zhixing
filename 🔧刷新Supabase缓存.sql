-- 🔧 刷新 Supabase Schema 缓存
-- 解决字段已添加但API缓存未更新的问题

-- ===============================================
-- 方法1：通知 PostgREST 重新加载 schema
-- ===============================================
NOTIFY pgrst, 'reload schema';

-- ===============================================
-- 方法2：检查字段是否真的存在于数据库中
-- ===============================================
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('primary_sales', 'secondary_sales') 
AND column_name = 'sales_type'
ORDER BY table_name;

-- ===============================================
-- 方法3：验证 PostgREST 可以访问这些字段
-- ===============================================
-- 这个查询模拟 Supabase API 的访问方式
SELECT sales_type FROM primary_sales LIMIT 1;
SELECT sales_type FROM secondary_sales LIMIT 1;

-- ===============================================
-- 如果上面的查询成功，说明数据库层面没问题
-- 问题确实是 Supabase API 缓存
-- ===============================================

SELECT 
    '✅ 数据库字段正常' as status,
    '需要刷新 Supabase API 缓存' as action_needed;