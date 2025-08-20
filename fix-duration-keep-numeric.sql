-- 保持duration为数值类型，但使用更清晰的标准值
-- 标准值: 0.23 (7天，约0.23个月), 1(1个月), 3(3个月), 6(6个月), 12(1年)
-- 或者用: 7(7天，特殊标记), 1(1个月), 3(3个月), 6(6个月), 12(1年)

-- 查看当前分布
SELECT 
    duration as "当前时长值",
    COUNT(*) as "订单数"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 方案1: 用负数表示天数 (如 -7 表示7天)
UPDATE orders_optimized
SET duration = CASE
    -- 7天用 -7 表示
    WHEN duration < 0.5 OR duration = 0.25 THEN -7
    -- 月份保持正数
    WHEN duration BETWEEN 0.5 AND 2 THEN 1
    WHEN duration BETWEEN 2 AND 4.5 THEN 3
    WHEN duration BETWEEN 4.5 AND 9 THEN 6
    WHEN duration >= 9 THEN 12
    -- 标准值保持不变
    WHEN duration = 1 THEN 1
    WHEN duration = 3 THEN 3
    WHEN duration = 6 THEN 6
    WHEN duration = 12 THEN 12
    ELSE 3  -- 默认3个月
END;

UPDATE orders
SET duration = CASE
    WHEN duration < 0.5 OR duration = 0.25 THEN -7
    WHEN duration BETWEEN 0.5 AND 2 THEN 1
    WHEN duration BETWEEN 2 AND 4.5 THEN 3
    WHEN duration BETWEEN 4.5 AND 9 THEN 6
    WHEN duration >= 9 THEN 12
    WHEN duration = 1 THEN 1
    WHEN duration = 3 THEN 3
    WHEN duration = 6 THEN 6
    WHEN duration = 12 THEN 12
    ELSE 3
END;

-- 验证结果
SELECT 
    duration,
    CASE 
        WHEN duration = -7 THEN '7天'
        WHEN duration = 1 THEN '1个月'
        WHEN duration = 3 THEN '3个月'
        WHEN duration = 6 THEN '6个月'
        WHEN duration = 12 THEN '1年'
        ELSE concat(duration::text, '(非标准)')
    END as "时长说明",
    COUNT(*) as "订单数"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;