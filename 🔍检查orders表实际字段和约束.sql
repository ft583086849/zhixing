-- 检查orders表的实际字段结构和约束
-- 目标: 确认字段名称、数据类型和NOT NULL约束

-- 1. 查看orders表的所有字段详情
SELECT '=== orders表字段详情 ===' as test_section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查NOT NULL约束
SELECT '=== orders表NOT NULL约束 ===' as test_section;

SELECT 
    column_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
  AND is_nullable = 'NO'
ORDER BY column_name;

-- 3. 检查数字类型字段
SELECT '=== orders表数字类型字段 ===' as test_section;

SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
  AND data_type IN ('numeric', 'decimal', 'integer', 'bigint', 'real', 'double precision')
ORDER BY column_name;
