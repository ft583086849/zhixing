-- 检查orders表的完整字段结构
-- 目标: 确认当前表结构和您提到的字段逻辑

-- 1. 查看orders表的所有字段
SELECT '=== orders表所有字段 ===' as test_section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查关键字段是否存在
SELECT '=== 检查关键字段存在性 ===' as test_section;

SELECT 
    'sales_code' as field_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'sales_code'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'sales_type' as field_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'sales_type'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'primary_sales_id' as field_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'primary_sales_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'secondary_sales_id' as field_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'secondary_sales_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'commission_rate' as field_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'commission_rate'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'commission_amount' as field_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'commission_amount'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'link_code' as field_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'link_code'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;
