-- 统一规范化duration字段值
-- 统一使用中文格式: '7天', '1个月', '3个月', '6个月', '1年'

-- 1. 更新orders_optimized表
UPDATE orders_optimized
SET duration = CASE
    -- 7天相关
    WHEN duration = '7days' THEN '7天'
    WHEN duration = '7天免费' THEN '7天'
    WHEN duration = '7天' THEN '7天'
    
    -- 1个月相关
    WHEN duration = '1month' THEN '1个月'
    WHEN duration = '1个月' THEN '1个月'
    
    -- 3个月相关
    WHEN duration = '3months' THEN '3个月'
    WHEN duration = '3个月' THEN '3个月'
    
    -- 6个月相关
    WHEN duration = '6months' THEN '6个月'
    WHEN duration = '6个月' THEN '6个月'
    
    -- 1年相关
    WHEN duration = '1year' THEN '1年'
    WHEN duration = '1年' THEN '1年'
    
    ELSE duration  -- 保持其他值不变
END
WHERE duration IS NOT NULL;

-- 2. 更新orders表
UPDATE orders
SET duration = CASE
    -- 7天相关
    WHEN duration = '7days' THEN '7天'
    WHEN duration = '7天免费' THEN '7天'
    WHEN duration = '7天' THEN '7天'
    
    -- 1个月相关
    WHEN duration = '1month' THEN '1个月'
    WHEN duration = '1个月' THEN '1个月'
    
    -- 3个月相关
    WHEN duration = '3months' THEN '3个月'
    WHEN duration = '3个月' THEN '3个月'
    
    -- 6个月相关
    WHEN duration = '6months' THEN '6个月'
    WHEN duration = '6个月' THEN '6个月'
    
    -- 1年相关
    WHEN duration = '1year' THEN '1年'
    WHEN duration = '1年' THEN '1年'
    
    ELSE duration
END
WHERE duration IS NOT NULL;

-- 3. 验证更新后的结果
SELECT 
    'orders_optimized' as "表名",
    duration as "统一后的值",
    COUNT(*) as "记录数"
FROM orders_optimized
GROUP BY duration
ORDER BY 
    CASE duration
        WHEN '7天' THEN 1
        WHEN '1个月' THEN 2
        WHEN '3个月' THEN 3
        WHEN '6个月' THEN 4
        WHEN '1年' THEN 5
        ELSE 6
    END;

-- 4. 验证orders表
SELECT 
    'orders' as "表名",
    duration as "统一后的值",
    COUNT(*) as "记录数"
FROM orders
GROUP BY duration
ORDER BY 
    CASE duration
        WHEN '7天' THEN 1
        WHEN '1个月' THEN 2
        WHEN '3个月' THEN 3
        WHEN '6个月' THEN 4
        WHEN '1年' THEN 5
        ELSE 6
    END;