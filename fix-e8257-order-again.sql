-- 修复e8257订单数据不一致问题
-- 将订单从3个月/300元修正为12个月/1588元

-- 1. 更新orders表
UPDATE orders 
SET 
    duration = 12,
    amount = 1588
WHERE tradingview_username = 'e8257';

-- 2. 更新orders_optimized表
UPDATE orders_optimized 
SET 
    duration = 12,
    amount = 1588,
    -- 重新计算佣金（假设是primary类型，40%总佣金）
    commission_amount = 1588 * 0.4,
    primary_commission_amount = 1588 * 0.4,
    secondary_commission_amount = 0
WHERE tradingview_username = 'e8257';

-- 3. 验证修复结果
SELECT 
    'orders' as table_name,
    order_number,
    tradingview_username,
    duration,
    amount,
    alipay_amount,
    crypto_amount,
    status
FROM orders
WHERE tradingview_username = 'e8257'
UNION ALL
SELECT 
    'orders_optimized' as table_name,
    order_number,
    tradingview_username,
    duration,
    amount,
    alipay_amount,
    crypto_amount,
    status
FROM orders_optimized
WHERE tradingview_username = 'e8257';