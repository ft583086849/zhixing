-- 查看所有表名，找到客户相关的表
SELECT 
    table_name as "表名",
    table_type as "表类型"
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 查找可能的客户/用户相关表
SELECT 
    table_name as "可能的客户表"
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND (
        table_name LIKE '%customer%' 
        OR table_name LIKE '%user%'
        OR table_name LIKE '%client%'
        OR table_name LIKE '%member%'
    )
ORDER BY table_name;

-- 查看orders_optimized表中的客户相关字段，推断客户数据存储位置
SELECT 
    column_name as "字段名",
    data_type as "数据类型"
FROM information_schema.columns
WHERE table_name = 'orders_optimized'
    AND column_name IN (
        'customer_id',
        'customer_name', 
        'customer_wechat',
        'tradingview_username',
        'customer_email',
        'customer_phone'
    )
ORDER BY ordinal_position;

-- 查看orders表中的客户字段
SELECT DISTINCT
    customer_name,
    customer_wechat,
    tradingview_username
FROM orders_optimized
WHERE customer_wechat IS NOT NULL
LIMIT 10;