-- 简单验证订单数据是否存在并能被正确查询

-- 1. 检查订单总数
SELECT 
    'orders表总数' as info,
    COUNT(*) as count
FROM orders;

-- 2. 检查最新订单数据
SELECT 
    'recent_orders' as info,
    order_number,
    sales_code,
    customer_wechat,
    tradingview_username,
    amount,
    actual_payment_amount,
    status,
    created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 3;

-- 3. 检查订单与销售的关联（模拟SupabaseService.getOrders()查询）
SELECT 
    'orders_with_sales' as info,
    o.id,
    o.order_number,
    o.sales_code,
    o.customer_wechat,
    o.tradingview_username,
    o.amount,
    o.actual_payment_amount,
    o.status,
    o.created_at,
    p.name as primary_sales_name,
    p.wechat_name as primary_wechat,
    s.name as secondary_sales_name,
    s.wechat_name as secondary_wechat
FROM orders o
LEFT JOIN primary_sales p ON o.sales_code = p.sales_code
LEFT JOIN secondary_sales s ON o.sales_code = s.sales_code
ORDER BY o.created_at DESC
LIMIT 3;
