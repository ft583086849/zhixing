-- 直接规范化duration字段的值
-- 标准值: 0.25(7天), 1(1个月), 3(3个月), 6(6个月), 12(1年)

-- 1. 查看当前的duration分布
SELECT 
    duration as "当前值",
    COUNT(*) as "数量"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 2. 更新orders_optimized表的duration值
UPDATE orders_optimized
SET duration = CASE
    -- 已经是标准值的保持不变
    WHEN duration = 0.25 THEN 0.25   -- 7天
    WHEN duration = 1 THEN 1         -- 1个月
    WHEN duration = 3 THEN 3         -- 3个月
    WHEN duration = 6 THEN 6         -- 6个月
    WHEN duration = 12 THEN 12       -- 1年
    
    -- 非标准值的映射规则
    WHEN duration < 0.5 THEN 0.25    -- 小于0.5 -> 7天
    WHEN duration = 2 THEN 3         -- 2个月 -> 3个月
    WHEN duration = 4 THEN 3         -- 4个月 -> 3个月
    WHEN duration = 5 THEN 6         -- 5个月 -> 6个月
    WHEN duration BETWEEN 7 AND 11 THEN 12  -- 7-11个月 -> 1年
    WHEN duration > 12 THEN 12       -- 超过12个月 -> 1年
    
    -- NULL保持NULL
    WHEN duration IS NULL THEN NULL
    ELSE duration  -- 其他情况保持原值
END
WHERE duration IS NOT NULL;  -- 只更新非NULL的记录

-- 3. 同步更新orders表
UPDATE orders
SET duration = CASE
    WHEN duration = 0.25 THEN 0.25
    WHEN duration = 1 THEN 1
    WHEN duration = 3 THEN 3
    WHEN duration = 6 THEN 6
    WHEN duration = 12 THEN 12
    WHEN duration < 0.5 THEN 0.25
    WHEN duration = 2 THEN 3
    WHEN duration = 4 THEN 3
    WHEN duration = 5 THEN 6
    WHEN duration BETWEEN 7 AND 11 THEN 12
    WHEN duration > 12 THEN 12
    WHEN duration IS NULL THEN NULL
    ELSE duration
END
WHERE duration IS NOT NULL;

-- 4. 验证更新后的结果
SELECT 
    duration,
    CASE 
        WHEN duration = 0.25 THEN '7天'
        WHEN duration = 1 THEN '1个月'
        WHEN duration = 3 THEN '3个月'
        WHEN duration = 6 THEN '6个月'
        WHEN duration = 12 THEN '1年'
        WHEN duration IS NULL THEN 'NULL'
        ELSE concat(duration::text, '(需检查)')
    END as "说明",
    COUNT(*) as "数量"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 5. 查看示例数据
SELECT 
    order_number,
    tradingview_username,
    duration,
    CASE 
        WHEN duration = 0.25 THEN '7天'
        WHEN duration = 1 THEN '1个月'
        WHEN duration = 3 THEN '3个月'
        WHEN duration = 6 THEN '6个月'
        WHEN duration = 12 THEN '1年'
        WHEN duration IS NULL THEN 'NULL'
        ELSE concat(duration::text, '(需检查)')
    END as "时长说明",
    amount
FROM orders_optimized
ORDER BY duration
LIMIT 30;