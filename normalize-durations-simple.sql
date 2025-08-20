-- 规范化购买时长字段数据
-- 将duration字段规范化为: 0.25(7天), 3(3个月), 6(6个月), 12(1年)

-- 查看当前分布
SELECT 
    duration as "当前时长(月)",
    COUNT(*) as "记录数"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 更新orders_optimized表
UPDATE orders_optimized
SET duration = CASE
    WHEN duration IS NULL THEN 3      -- 空值默认3个月
    WHEN duration <= 2 THEN 0.25      -- 2个月及以下 -> 7天试用
    WHEN duration = 3 THEN 3          -- 3个月保持不变
    WHEN duration <= 5 THEN 6         -- 4-5个月 -> 6个月
    WHEN duration = 6 THEN 6          -- 6个月保持不变
    WHEN duration < 12 THEN 12        -- 7-11个月 -> 1年
    ELSE 12                           -- 12个月及以上 -> 1年
END;

-- 更新orders表（保持同步）
UPDATE orders
SET duration = CASE
    WHEN duration IS NULL THEN 3      -- 空值默认3个月
    WHEN duration <= 2 THEN 0.25      -- 2个月及以下 -> 7天试用
    WHEN duration = 3 THEN 3          -- 3个月保持不变
    WHEN duration <= 5 THEN 6         -- 4-5个月 -> 6个月
    WHEN duration = 6 THEN 6          -- 6个月保持不变
    WHEN duration < 12 THEN 12        -- 7-11个月 -> 1年
    ELSE 12                           -- 12个月及以上 -> 1年
END;

-- 查看更新后的分布
SELECT 
    duration,
    CASE 
        WHEN duration = 0.25 THEN '7天试用'
        WHEN duration = 3 THEN '3个月'
        WHEN duration = 6 THEN '6个月'
        WHEN duration = 12 THEN '1年'
        ELSE concat(duration::text, '个月(异常)')
    END as "时长说明",
    COUNT(*) as "记录数"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 查看一些示例记录
SELECT 
    order_number as "订单号",
    tradingview_username as "用户名",
    duration as "时长值",
    CASE 
        WHEN duration = 0.25 THEN '7天试用'
        WHEN duration = 3 THEN '3个月'
        WHEN duration = 6 THEN '6个月'
        WHEN duration = 12 THEN '1年'
        ELSE concat(duration::text, '个月')
    END as "时长说明",
    amount as "金额"
FROM orders_optimized
ORDER BY duration, created_at DESC
LIMIT 20;