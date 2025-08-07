-- 检查orders表字段结构
-- 目标: 验证link_code字段是否存在，如果不存在则添加

-- 1. 检查orders表结构
SELECT '=== 检查orders表字段 ===' as test_section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查是否有link_code字段
SELECT '=== 检查link_code字段存在性 ===' as test_section;

SELECT 
    COUNT(*) as link_code_exists
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name = 'link_code'
  AND table_schema = 'public';

-- 3. 检查最近的orders记录看看有什么字段
SELECT '=== 最近orders记录字段 ===' as test_section;

SELECT *
FROM orders 
ORDER BY created_at DESC 
LIMIT 3;
