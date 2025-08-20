-- 查看duration字段的实际值分布
-- 看看到底有哪些值，是否都是标准值

-- 1. 查看orders_optimized表的duration分布
SELECT 
    'orders_optimized' as "表名",
    duration as "duration值",
    COUNT(*) as "记录数",
    MIN(amount) as "最小金额",
    MAX(amount) as "最大金额",
    ROUND(AVG(amount)::numeric, 2) as "平均金额"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 2. 查看orders表的duration分布
SELECT 
    'orders' as "表名",
    duration as "duration值",
    COUNT(*) as "记录数",
    MIN(amount) as "最小金额",
    MAX(amount) as "最大金额",
    ROUND(AVG(amount)::numeric, 2) as "平均金额"
FROM orders
GROUP BY duration
ORDER BY duration;

-- 3. 查看一些具体的例子
SELECT 
    order_number as "订单号",
    tradingview_username as "用户名",
    duration as "duration值",
    amount as "金额",
    created_at as "创建时间"
FROM orders_optimized
WHERE duration NOT IN (0.25, 1, 3, 6, 12) OR duration IS NULL
ORDER BY duration
LIMIT 20;