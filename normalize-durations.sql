-- 规范化购买时长字段数据
-- 将duration字段规范化为: 0.25(7天), 3(3个月), 6(6个月), 12(1年)

-- 1. 首先查看当前的duration分布
SELECT 
    duration,
    COUNT(*) as count
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 2. 更新orders_optimized表中的duration字段
-- 映射规则:
-- 1个月以下 -> 0.25 (7天试用)
-- 1-2个月 -> 0.25 (7天试用)
-- 3个月 -> 3 (3个月)
-- 4-5个月 -> 6 (6个月)
-- 6个月 -> 6 (6个月)
-- 7-11个月 -> 12 (1年)
-- 12个月及以上 -> 12 (1年)

UPDATE orders_optimized
SET duration = CASE
    WHEN duration IS NULL THEN 3  -- 默认3个月
    WHEN duration < 1 THEN 0.25   -- 小于1个月的都算7天试用
    WHEN duration <= 2 THEN 0.25  -- 1-2个月算7天试用
    WHEN duration = 3 THEN 3      -- 3个月保持不变
    WHEN duration <= 5 THEN 6     -- 4-5个月算6个月
    WHEN duration = 6 THEN 6      -- 6个月保持不变
    WHEN duration < 12 THEN 12    -- 7-11个月算1年
    ELSE 12                       -- 12个月及以上都算1年
END;

-- 3. 同步更新orders表（保持两表一致）
UPDATE orders
SET duration = CASE
    WHEN duration IS NULL THEN 3  -- 默认3个月
    WHEN duration < 1 THEN 0.25   -- 小于1个月的都算7天试用
    WHEN duration <= 2 THEN 0.25  -- 1-2个月算7天试用
    WHEN duration = 3 THEN 3      -- 3个月保持不变
    WHEN duration <= 5 THEN 6     -- 4-5个月算6个月
    WHEN duration = 6 THEN 6      -- 6个月保持不变
    WHEN duration < 12 THEN 12    -- 7-11个月算1年
    ELSE 12                       -- 12个月及以上都算1年
END;

-- 4. 验证更新后的分布
SELECT 
    duration,
    CASE 
        WHEN duration = 0.25 THEN '7天试用'
        WHEN duration = 3 THEN '3个月'
        WHEN duration = 6 THEN '6个月'
        WHEN duration = 12 THEN '1年'
        ELSE '其他'
    END as duration_label,
    COUNT(*) as count
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 5. 查看几个示例订单验证
SELECT 
    id,
    order_number,
    tradingview_username,
    duration,
    CASE 
        WHEN duration = 0.25 THEN '7天试用'
        WHEN duration = 3 THEN '3个月'
        WHEN duration = 6 THEN '6个月'
        WHEN duration = 12 THEN '1年'
        ELSE '其他'
    END as duration_label,
    amount
FROM orders_optimized
LIMIT 20;