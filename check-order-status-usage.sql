-- 🔍 检查订单状态实际使用情况
-- 只查看数据，不删除任何内容

-- 1. 统计所有订单状态的使用情况
SELECT 
    '📊 订单状态分布统计' as info,
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM orders_optimized
GROUP BY status
ORDER BY count DESC;

-- 2. 统计支付状态分布
SELECT 
    '💰 支付状态分布统计' as info,
    payment_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM orders_optimized
GROUP BY payment_status
ORDER BY count DESC;

-- 3. 查看状态和支付状态的组合使用情况
SELECT 
    '🔄 状态组合分析' as info,
    status,
    payment_status,
    COUNT(*) as count
FROM orders_optimized
GROUP BY status, payment_status
ORDER BY count DESC;

-- 4. 检查是否有空值或异常状态
SELECT 
    '⚠️ 数据质量检查' as info,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_count,
    COUNT(CASE WHEN payment_status IS NULL THEN 1 END) as null_payment_status_count,
    COUNT(CASE WHEN status NOT IN ('pending', 'confirmed', 'cancelled', 'expired', 'confirmed_config', 'pending_payment', 'pending_config', 'rejected', 'completed', 'processing') THEN 1 END) as unknown_status_count,
    COUNT(*) as total_orders
FROM orders_optimized;

-- 5. 查看各状态的最新订单示例
SELECT 
    '📋 各状态最新订单示例' as info,
    status,
    payment_status,
    customer_name,
    amount,
    created_at
FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at DESC) as rn
    FROM orders_optimized
) ranked
WHERE rn = 1
ORDER BY created_at DESC;