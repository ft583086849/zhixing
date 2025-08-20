-- 智能规范化购买时长数据
-- 基于金额和原始duration值的组合来判断实际的购买时长
-- 目标值: 0.25(7天), 3(3个月), 6(6个月), 12(1年)

-- 1. 首先查看当前的数据分布
SELECT 
    duration as "当前时长",
    COUNT(*) as "数量",
    MIN(amount) as "最小金额",
    MAX(amount) as "最大金额",
    AVG(amount)::numeric(10,2) as "平均金额"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 2. 更新orders_optimized表 - 基于金额和时长的智能映射
UPDATE orders_optimized
SET duration = CASE
    -- 7天试用的情况
    WHEN amount < 100 THEN 0.25                          -- 金额小于100的都是7天试用
    WHEN duration = 0.25 THEN 0.25                       -- 原本就是0.25的保持不变
    WHEN duration < 1 AND amount < 200 THEN 0.25         -- 小于1个月且金额小于200的是7天试用
    
    -- 3个月的情况
    WHEN duration = 3 THEN 3                             -- 原本就是3个月的保持不变
    WHEN amount BETWEEN 200 AND 600 AND duration <= 3 THEN 3  -- 金额200-600且时长<=3的是3个月
    WHEN duration BETWEEN 2 AND 4 AND amount < 800 THEN 3     -- 时长2-4个月且金额<800的是3个月
    
    -- 6个月的情况  
    WHEN duration = 6 THEN 6                             -- 原本就是6个月的保持不变
    WHEN amount BETWEEN 600 AND 1200 AND duration <= 6 THEN 6  -- 金额600-1200且时长<=6的是6个月
    WHEN duration BETWEEN 4 AND 8 AND amount < 1500 THEN 6     -- 时长4-8个月且金额<1500的是6个月
    
    -- 1年的情况
    WHEN duration = 12 THEN 12                           -- 原本就是12个月的保持不变
    WHEN amount >= 1200 THEN 12                          -- 金额>=1200的都是1年
    WHEN duration >= 10 THEN 12                          -- 时长>=10个月的都是1年
    WHEN duration >= 7 AND amount >= 1000 THEN 12        -- 时长>=7个月且金额>=1000的是1年
    
    -- 默认情况：根据最接近的值判断
    WHEN duration <= 1.5 THEN 0.25                       -- 1.5个月以下归为7天
    WHEN duration <= 4.5 THEN 3                          -- 4.5个月以下归为3个月
    WHEN duration <= 9 THEN 6                            -- 9个月以下归为6个月
    ELSE 12                                              -- 其他都归为1年
END
WHERE duration IS NOT NULL;

-- 处理duration为NULL的情况 - 基于金额判断
UPDATE orders_optimized
SET duration = CASE
    WHEN amount < 100 THEN 0.25        -- 小金额默认7天试用
    WHEN amount < 600 THEN 3           -- 中等金额默认3个月
    WHEN amount < 1200 THEN 6          -- 较大金额默认6个月
    ELSE 12                            -- 大金额默认1年
END
WHERE duration IS NULL AND amount IS NOT NULL;

-- 如果金额和时长都为NULL，默认设为3个月
UPDATE orders_optimized
SET duration = 3
WHERE duration IS NULL AND amount IS NULL;

-- 3. 同步更新orders表（使用相同的逻辑）
UPDATE orders
SET duration = CASE
    -- 7天试用的情况
    WHEN amount < 100 THEN 0.25
    WHEN duration = 0.25 THEN 0.25
    WHEN duration < 1 AND amount < 200 THEN 0.25
    
    -- 3个月的情况
    WHEN duration = 3 THEN 3
    WHEN amount BETWEEN 200 AND 600 AND duration <= 3 THEN 3
    WHEN duration BETWEEN 2 AND 4 AND amount < 800 THEN 3
    
    -- 6个月的情况  
    WHEN duration = 6 THEN 6
    WHEN amount BETWEEN 600 AND 1200 AND duration <= 6 THEN 6
    WHEN duration BETWEEN 4 AND 8 AND amount < 1500 THEN 6
    
    -- 1年的情况
    WHEN duration = 12 THEN 12
    WHEN amount >= 1200 THEN 12
    WHEN duration >= 10 THEN 12
    WHEN duration >= 7 AND amount >= 1000 THEN 12
    
    -- 默认情况
    WHEN duration <= 1.5 THEN 0.25
    WHEN duration <= 4.5 THEN 3
    WHEN duration <= 9 THEN 6
    ELSE 12
END
WHERE duration IS NOT NULL;

-- 处理NULL情况
UPDATE orders
SET duration = CASE
    WHEN amount < 100 THEN 0.25
    WHEN amount < 600 THEN 3
    WHEN amount < 1200 THEN 6
    ELSE 12
END
WHERE duration IS NULL AND amount IS NOT NULL;

UPDATE orders
SET duration = 3
WHERE duration IS NULL AND amount IS NULL;

-- 4. 验证更新后的结果
SELECT 
    duration,
    CASE 
        WHEN duration = 0.25 THEN '7天试用'
        WHEN duration = 3 THEN '3个月'
        WHEN duration = 6 THEN '6个月'
        WHEN duration = 12 THEN '1年'
        ELSE concat(duration::text, '个月(需检查)')
    END as "时长类型",
    COUNT(*) as "订单数",
    MIN(amount) as "最小金额",
    MAX(amount) as "最大金额",
    AVG(amount)::numeric(10,2) as "平均金额"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 5. 查看一些示例，确认映射是否合理
SELECT 
    order_number as "订单号",
    tradingview_username as "用户",
    duration as "时长值",
    CASE 
        WHEN duration = 0.25 THEN '7天试用'
        WHEN duration = 3 THEN '3个月'
        WHEN duration = 6 THEN '6个月'
        WHEN duration = 12 THEN '1年'
    END as "时长类型",
    amount as "金额"
FROM orders_optimized
WHERE duration IN (0.25, 3, 6, 12)
ORDER BY duration, amount
LIMIT 40;