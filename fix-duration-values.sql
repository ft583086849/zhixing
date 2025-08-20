-- 修正购买时长字段为标准值
-- 标准值: 0.25(7天), 1(1个月), 3(3个月), 6(6个月), 12(1年)

-- 1. 查看当前的duration分布
SELECT 
    duration as "当前时长值",
    COUNT(*) as "订单数"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 2. 更新orders_optimized表 - 修正非标准值
UPDATE orders_optimized
SET duration = CASE
    -- 标准值保持不变
    WHEN duration = 0.25 THEN 0.25    -- 7天
    WHEN duration = 1 THEN 1           -- 1个月
    WHEN duration = 3 THEN 3           -- 3个月
    WHEN duration = 6 THEN 6           -- 6个月
    WHEN duration = 12 THEN 12         -- 1年
    
    -- 修正非标准值（根据最接近的标准值）
    WHEN duration < 0.5 THEN 0.25      -- 小于0.5映射到7天
    WHEN duration BETWEEN 0.5 AND 2 THEN 1     -- 0.5-2映射到1个月
    WHEN duration BETWEEN 2 AND 4.5 THEN 3     -- 2-4.5映射到3个月
    WHEN duration BETWEEN 4.5 AND 9 THEN 6     -- 4.5-9映射到6个月
    WHEN duration >= 9 THEN 12                 -- 9及以上映射到1年
    
    -- NULL默认为3个月
    WHEN duration IS NULL THEN 3
    ELSE 3  -- 其他情况默认3个月
END;

-- 3. 同步更新orders表
UPDATE orders
SET duration = CASE
    -- 标准值保持不变
    WHEN duration = 0.25 THEN 0.25    -- 7天
    WHEN duration = 1 THEN 1           -- 1个月
    WHEN duration = 3 THEN 3           -- 3个月
    WHEN duration = 6 THEN 6           -- 6个月
    WHEN duration = 12 THEN 12         -- 1年
    
    -- 修正非标准值
    WHEN duration < 0.5 THEN 0.25
    WHEN duration BETWEEN 0.5 AND 2 THEN 1
    WHEN duration BETWEEN 2 AND 4.5 THEN 3
    WHEN duration BETWEEN 4.5 AND 9 THEN 6
    WHEN duration >= 9 THEN 12
    
    WHEN duration IS NULL THEN 3
    ELSE 3
END;

-- 4. 验证更新后的结果
SELECT 
    duration,
    CASE 
        WHEN duration = 0.25 THEN '7天'
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

-- 5. 查看一些示例记录
SELECT 
    order_number as "订单号",
    tradingview_username as "用户",
    duration as "时长值",
    CASE 
        WHEN duration = 0.25 THEN '7天'
        WHEN duration = 1 THEN '1个月'
        WHEN duration = 3 THEN '3个月'
        WHEN duration = 6 THEN '6个月'
        WHEN duration = 12 THEN '1年'
    END as "时长说明",
    amount as "金额"
FROM orders_optimized
ORDER BY duration, created_at DESC
LIMIT 30;