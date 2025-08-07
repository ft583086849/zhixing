-- 修复数据关联逻辑
-- 基于用户提供的关联关系说明

-- 1. 检查orders表的实际字段结构
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND table_schema = 'public'
    AND (column_name LIKE '%sales%' 
         OR column_name LIKE '%primary%'
         OR column_name LIKE '%secondary%')
ORDER BY ordinal_position;

-- 2. 检查订单与销售的实际关联情况
SELECT 
    o.order_number,
    o.sales_code,
    o.sales_type,
    -- 检查这些字段是否存在
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'primary_sales_id'
        ) THEN 'primary_sales_id字段存在'
        ELSE 'primary_sales_id字段不存在'
    END as primary_sales_id_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'secondary_sales_id'
        ) THEN 'secondary_sales_id字段存在'
        ELSE 'secondary_sales_id字段不存在'
    END as secondary_sales_id_check
FROM orders
ORDER BY created_at DESC
LIMIT 3;

-- 3. 检查销售数据是否存在
SELECT 
    '一级销售数据' as type,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as sample_names
FROM primary_sales
LIMIT 1

UNION ALL

SELECT 
    '二级销售数据' as type,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as sample_names
FROM secondary_sales
LIMIT 1;

-- 4. 检查订单中sales_code的分布
SELECT 
    sales_code,
    COUNT(*) as order_count,
    SUM(amount) as total_amount,
    SUM(actual_payment_amount) as total_actual_amount
FROM orders
WHERE sales_code IS NOT NULL
GROUP BY sales_code
ORDER BY order_count DESC
LIMIT 5;
