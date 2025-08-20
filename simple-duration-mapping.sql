-- 查看当前的duration分布
SELECT 
    duration as "当前时长值(月)",
    COUNT(*) as "订单数"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 简单的映射规则 - 请根据实际情况调整
-- 目标值: 0.25(7天), 3(3个月), 6(6个月), 12(1年)

UPDATE orders_optimized
SET duration = CASE
    -- 请根据实际业务规则调整以下映射
    WHEN duration = 0.25 THEN 0.25    -- 0.25保持为7天
    WHEN duration = 1 THEN 3           -- 1个月映射到3个月？
    WHEN duration = 2 THEN 3           -- 2个月映射到3个月？
    WHEN duration = 3 THEN 3           -- 3个月保持不变
    WHEN duration = 4 THEN 6           -- 4个月映射到6个月？
    WHEN duration = 5 THEN 6           -- 5个月映射到6个月？
    WHEN duration = 6 THEN 6           -- 6个月保持不变
    WHEN duration = 7 THEN 12          -- 7个月映射到1年？
    WHEN duration = 8 THEN 12          -- 8个月映射到1年？
    WHEN duration = 9 THEN 12          -- 9个月映射到1年？
    WHEN duration = 10 THEN 12         -- 10个月映射到1年？
    WHEN duration = 11 THEN 12         -- 11个月映射到1年？
    WHEN duration = 12 THEN 12         -- 12个月保持不变
    WHEN duration > 12 THEN 12         -- 超过12个月都映射到1年
    ELSE 3                             -- 默认3个月
END;