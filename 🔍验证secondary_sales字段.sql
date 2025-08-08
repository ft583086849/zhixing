-- 🔍 验证 secondary_sales_name 字段是否存在
-- 请在 Supabase SQL Editor 中运行此脚本

-- =============================================
-- 1. 查看 orders 表的所有字段
-- =============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 2. 检查是否存在 secondary_sales_name 字段
-- =============================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'secondary_sales_name'
        ) 
        THEN '✅ secondary_sales_name 字段存在' 
        ELSE '❌ secondary_sales_name 字段不存在' 
    END as "secondary_sales_name状态",
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'secondary_sales_id'
        ) 
        THEN '✅ secondary_sales_id 字段存在' 
        ELSE '❌ secondary_sales_id 字段不存在' 
    END as "secondary_sales_id状态";

-- =============================================
-- 3. 查看一条订单记录的实际数据
-- =============================================
SELECT * FROM orders LIMIT 1;

-- =============================================
-- 4. 统计各字段的使用情况
-- =============================================
SELECT 
    'sales_code字段' as field_name,
    COUNT(*) as total_records,
    COUNT(sales_code) as non_null_count,
    COUNT(*) - COUNT(sales_code) as null_count
FROM orders
UNION ALL
SELECT 
    'sales_type字段',
    COUNT(*),
    COUNT(sales_type),
    COUNT(*) - COUNT(sales_type)
FROM orders
UNION ALL
SELECT 
    'secondary_sales_id字段',
    COUNT(*),
    COUNT(secondary_sales_id),
    COUNT(*) - COUNT(secondary_sales_id)
FROM orders;

-- =============================================
-- 5. 查看二级销售订单
-- =============================================
-- 方法1: 通过 sales_type 查找
SELECT 
    '通过sales_type查找' as method,
    COUNT(*) as count
FROM orders 
WHERE sales_type = 'secondary'
UNION ALL
-- 方法2: 通过 secondary_sales_id 查找
SELECT 
    '通过secondary_sales_id查找',
    COUNT(*)
FROM orders 
WHERE secondary_sales_id IS NOT NULL;

-- =============================================
-- 6. 查看具体的二级销售订单示例
-- =============================================
SELECT 
    id,
    order_number,
    sales_code,
    sales_type,
    secondary_sales_id,
    amount,
    status
FROM orders
WHERE sales_type = 'secondary' 
   OR secondary_sales_id IS NOT NULL
LIMIT 5;
