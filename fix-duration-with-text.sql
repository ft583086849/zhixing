-- 将duration字段改为文本类型，存储标准的时长描述
-- 标准值: '7天', '1个月', '3个月', '6个月', '1年'

-- 1. 先查看当前的数据分布
SELECT 
    duration as "当前时长值",
    COUNT(*) as "订单数"
FROM orders_optimized
GROUP BY duration
ORDER BY duration;

-- 2. 添加新的文本字段来存储时长描述
ALTER TABLE orders_optimized 
ADD COLUMN IF NOT EXISTS duration_text VARCHAR(20);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS duration_text VARCHAR(20);

-- 3. 根据duration数值设置duration_text
UPDATE orders_optimized
SET duration_text = CASE
    WHEN duration = 0.25 THEN '7天'
    WHEN duration = 1 THEN '1个月'
    WHEN duration = 3 THEN '3个月'
    WHEN duration = 6 THEN '6个月'
    WHEN duration = 12 THEN '1年'
    -- 处理非标准值
    WHEN duration < 0.5 THEN '7天'
    WHEN duration BETWEEN 0.5 AND 2 THEN '1个月'
    WHEN duration BETWEEN 2 AND 4.5 THEN '3个月'
    WHEN duration BETWEEN 4.5 AND 9 THEN '6个月'
    WHEN duration >= 9 THEN '1年'
    ELSE '3个月'  -- 默认值
END;

UPDATE orders
SET duration_text = CASE
    WHEN duration = 0.25 THEN '7天'
    WHEN duration = 1 THEN '1个月'
    WHEN duration = 3 THEN '3个月'
    WHEN duration = 6 THEN '6个月'
    WHEN duration = 12 THEN '1年'
    -- 处理非标准值
    WHEN duration < 0.5 THEN '7天'
    WHEN duration BETWEEN 0.5 AND 2 THEN '1个月'
    WHEN duration BETWEEN 2 AND 4.5 THEN '3个月'
    WHEN duration BETWEEN 4.5 AND 9 THEN '6个月'
    WHEN duration >= 9 THEN '1年'
    ELSE '3个月'  -- 默认值
END;

-- 4. 同时更新duration数值为标准值
UPDATE orders_optimized
SET duration = CASE
    WHEN duration_text = '7天' THEN 0.25
    WHEN duration_text = '1个月' THEN 1
    WHEN duration_text = '3个月' THEN 3
    WHEN duration_text = '6个月' THEN 6
    WHEN duration_text = '1年' THEN 12
END;

UPDATE orders
SET duration = CASE
    WHEN duration_text = '7天' THEN 0.25
    WHEN duration_text = '1个月' THEN 1
    WHEN duration_text = '3个月' THEN 3
    WHEN duration_text = '6个月' THEN 6
    WHEN duration_text = '1年' THEN 12
END;

-- 5. 验证结果
SELECT 
    duration as "数值",
    duration_text as "文本描述",
    COUNT(*) as "订单数"
FROM orders_optimized
GROUP BY duration, duration_text
ORDER BY duration;

-- 6. 查看示例
SELECT 
    order_number as "订单号",
    tradingview_username as "用户",
    duration as "时长(月)",
    duration_text as "时长描述",
    amount as "金额"
FROM orders_optimized
LIMIT 20;