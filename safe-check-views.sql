-- 🔍 安全检查视图使用情况
-- 确认线上是否在使用这些视图

-- 1. 检查当前所有视图
SELECT 
    '📊 当前视图列表' as info,
    table_name as view_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'VIEW'
ORDER BY table_name;

-- 2. 检查是否有视图依赖orders_optimized表
SELECT 
    '🔗 视图依赖检查' as info,
    v.table_name as view_name,
    v.view_definition
FROM information_schema.views v
WHERE v.table_schema = 'public'
    AND v.view_definition LIKE '%orders_optimized%';

-- 3. 检查表的当前状态
SELECT 
    '📋 orders_optimized表状态' as info,
    COUNT(*) as record_count
FROM orders_optimized;

-- 4. 检查原表状态作为对比
SELECT 
    '📋 原orders表状态' as info,
    COUNT(*) as record_count
FROM orders;