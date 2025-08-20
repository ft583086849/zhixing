-- 同步线上orders表的新数据到orders_optimized表
-- 只同步orders_optimized中不存在的新订单

-- 1. 查看当前两个表的数据量对比
SELECT 
    'orders' as table_name,
    COUNT(*) as count,
    MAX(id) as max_id,
    MAX(created_at) as latest_order
FROM orders
UNION ALL
SELECT 
    'orders_optimized' as table_name,
    COUNT(*) as count,
    MAX(id) as max_id,
    MAX(created_at) as latest_order
FROM orders_optimized;

-- 2. 查找orders表中存在但orders_optimized表中不存在的订单
WITH missing_orders AS (
    SELECT o.*
    FROM orders o
    LEFT JOIN orders_optimized oo ON o.id = oo.id
    WHERE oo.id IS NULL
)
SELECT COUNT(*) as missing_count FROM missing_orders;

-- 3. 插入缺失的订单到orders_optimized表
INSERT INTO orders_optimized (
    id,
    order_number,
    customer_name,
    customer_wechat,
    tradingview_username,
    sales_code,
    sales_type,
    duration,
    amount,
    payment_method,
    payment_status,
    payment_time,
    purchase_type,
    effective_time,
    expiry_time,
    status,
    alipay_amount,
    crypto_amount,
    commission_rate,
    commission_amount,
    primary_sales_id,
    secondary_sales_id,
    created_at,
    updated_at
)
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_wechat,
    o.tradingview_username,
    o.sales_code,
    o.sales_type,
    o.duration,
    o.amount,
    o.payment_method,
    o.payment_status,
    o.payment_time,
    o.purchase_type,
    o.effective_time,
    o.expiry_time,
    o.status,
    o.alipay_amount,
    o.crypto_amount,
    o.commission_rate,
    o.commission_amount,
    o.primary_sales_id,
    o.secondary_sales_id,
    o.created_at,
    o.updated_at
FROM orders o
LEFT JOIN orders_optimized oo ON o.id = oo.id
WHERE oo.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. 更新新插入订单的佣金拆分字段
UPDATE orders_optimized 
SET 
    primary_commission_amount = CASE 
        WHEN sales_type = 'primary' THEN amount * 0.4
        WHEN sales_type = 'secondary' THEN amount * (0.4 - COALESCE(commission_rate, 0.25))
        ELSE 0
    END,
    
    secondary_commission_amount = CASE 
        WHEN sales_type = 'primary' THEN 0
        WHEN sales_type = 'secondary' THEN amount * COALESCE(commission_rate, 0.25)
        WHEN sales_type = 'independent' THEN amount * 0.4
        ELSE 0
    END,
    
    secondary_commission_rate = CASE 
        WHEN sales_type = 'secondary' OR sales_type = 'independent' 
        THEN COALESCE(commission_rate, 0.25)
        ELSE 0
    END
WHERE amount IS NOT NULL 
    AND amount > 0
    AND primary_commission_amount IS NULL;

-- 5. 验证同步结果
SELECT 
    'orders' as table_name,
    COUNT(*) as count,
    MAX(id) as max_id,
    MAX(created_at) as latest_order
FROM orders
UNION ALL
SELECT 
    'orders_optimized' as table_name,
    COUNT(*) as count,
    MAX(id) as max_id,
    MAX(created_at) as latest_order
FROM orders_optimized;

-- 6. 显示最新同步的订单
SELECT 
    id,
    order_number,
    tradingview_username,
    amount,
    status,
    created_at,
    primary_commission_amount,
    secondary_commission_amount
FROM orders_optimized
WHERE id IN (
    SELECT o.id
    FROM orders o
    LEFT JOIN orders_optimized oo ON o.id = oo.id
    WHERE oo.id IS NULL
)
ORDER BY created_at DESC;