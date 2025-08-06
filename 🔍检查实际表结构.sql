-- 🔍 检查实际表结构
-- 查看所有表的完整字段信息

-- ============================================================================
-- 检查所有表的字段结构
-- ============================================================================

SELECT '=== ADMINS 表结构 ===' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'admins' 
ORDER BY ordinal_position;

SELECT '=== PRIMARY_SALES 表结构 ===' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'primary_sales' 
ORDER BY ordinal_position;

SELECT '=== SECONDARY_SALES 表结构 ===' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'secondary_sales' 
ORDER BY ordinal_position;

SELECT '=== ORDERS 表结构 ===' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 检查约束信息
SELECT '=== 约束信息 ===' as info;
SELECT 
    table_name,
    column_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name IN ('admins', 'primary_sales', 'secondary_sales', 'orders')
ORDER BY table_name, column_name;