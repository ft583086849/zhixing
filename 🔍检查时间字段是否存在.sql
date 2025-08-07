-- 检查orders表中的时间相关字段
-- 诊断生效时间/到期时间显示横线问题

-- 1. 检查orders表的字段结构（时间相关）
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND table_schema = 'public'
    AND (column_name LIKE '%time%' 
         OR column_name LIKE '%date%'
         OR column_name LIKE 'effective%'
         OR column_name LIKE 'expiry%'
         OR column_name LIKE 'created%'
         OR column_name LIKE 'updated%')
ORDER BY ordinal_position;

-- 2. 检查最新订单的时间字段数据
SELECT 
    order_number,
    sales_code,
    status,
    created_at,
    -- 检查这些字段是否存在
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
                AND column_name = 'effective_time'
        ) THEN 'effective_time字段存在'
        ELSE 'effective_time字段不存在'
    END as effective_time_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
                AND column_name = 'expiry_time'
        ) THEN 'expiry_time字段存在'
        ELSE 'expiry_time字段不存在'
    END as expiry_time_check
FROM orders
ORDER BY created_at DESC
LIMIT 3;
