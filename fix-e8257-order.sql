-- 修复e8257订单数据不一致问题
-- 订单ID: 3, 用户名: e8257
-- 问题: duration是3个月但实付¥1588（应该是1年）

-- 1. 先查询当前数据
SELECT 
    id,
    order_number,
    tradingview_username,
    duration,
    amount,
    alipay_amount,
    effective_time,
    expiry_time,
    created_at,
    updated_at
FROM orders_optimized 
WHERE id = 3 AND tradingview_username = 'e8257';

-- 2. 更新订单为1年套餐
UPDATE orders_optimized 
SET 
    duration = '1year',           -- 改为1年
    amount = 1588,                 -- 订单金额改为1588
    expiry_time = CASE 
        WHEN effective_time IS NOT NULL 
        THEN effective_time + INTERVAL '1 year'  -- 到期时间=生效时间+1年
        ELSE expiry_time           -- 如果没有生效时间，保持原样
    END,
    updated_at = NOW()             -- 更新时间
WHERE 
    id = 3 
    AND tradingview_username = 'e8257';

-- 3. 查询更新后的结果
SELECT 
    id,
    order_number,
    tradingview_username,
    duration,
    amount,
    alipay_amount,
    effective_time,
    expiry_time,
    created_at,
    updated_at
FROM orders_optimized 
WHERE id = 3 AND tradingview_username = 'e8257';