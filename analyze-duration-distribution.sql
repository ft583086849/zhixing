-- 分析当前购买时长的实际分布情况
-- 查看orders_optimized表中所有的duration值和对应的金额

-- 1. 查看duration的详细分布和对应的金额范围
SELECT 
    duration as "时长(月)",
    COUNT(*) as "订单数",
    MIN(amount) as "最小金额",
    MAX(amount) as "最大金额",
    AVG(amount)::numeric(10,2) as "平均金额"
FROM orders_optimized
WHERE duration IS NOT NULL
GROUP BY duration
ORDER BY duration;

-- 2. 查看一些具体的订单示例，了解duration和amount的对应关系
SELECT 
    duration as "时长(月)",
    amount as "金额",
    order_number as "订单号",
    tradingview_username as "用户名",
    created_at as "创建时间"
FROM orders_optimized
WHERE duration IS NOT NULL
ORDER BY duration, amount
LIMIT 50;

-- 3. 基于金额推断可能的映射规则
SELECT 
    CASE 
        WHEN amount < 100 THEN '可能是7天试用'
        WHEN amount BETWEEN 100 AND 500 THEN '可能是3个月'
        WHEN amount BETWEEN 500 AND 1000 THEN '可能是6个月'
        WHEN amount > 1000 THEN '可能是1年'
    END as "推测类型",
    duration as "当前时长值",
    COUNT(*) as "订单数",
    MIN(amount) as "最小金额",
    MAX(amount) as "最大金额"
FROM orders_optimized
WHERE amount IS NOT NULL AND duration IS NOT NULL
GROUP BY 
    CASE 
        WHEN amount < 100 THEN '可能是7天试用'
        WHEN amount BETWEEN 100 AND 500 THEN '可能是3个月'
        WHEN amount BETWEEN 500 AND 1000 THEN '可能是6个月'
        WHEN amount > 1000 THEN '可能是1年'
    END,
    duration
ORDER BY "推测类型", duration;