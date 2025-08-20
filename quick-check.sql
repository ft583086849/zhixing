-- 快速检查线上数据库状态

-- 1. 检查表是否存在
SELECT 
    table_name as "表名",
    '✅ 存在' as "状态"
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'orders_optimized');

-- 2. 比较记录数
SELECT 
    'orders' as "表名",
    COUNT(*) as "记录数"
FROM orders
UNION ALL
SELECT 
    'orders_optimized' as "表名",
    COUNT(*) as "记录数"
FROM orders_optimized;

-- 3. 检查关键字段
SELECT 
    column_name as "字段名"
FROM information_schema.columns
WHERE table_name = 'orders_optimized'
AND column_name IN ('primary_commission_amount', 'secondary_commission_amount');