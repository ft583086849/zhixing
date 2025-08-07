-- 诊断数据流问题
-- 检查刚才创建的数据是否正确存储

-- 1. 检查最新的一级销售数据
SELECT 
    '=== 最新一级销售 ===' as info,
    sales_code,
    name,
    wechat_name,
    payment_method,
    payment_address,
    created_at
FROM primary_sales 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. 检查最新的二级销售数据
SELECT 
    '=== 最新二级销售 ===' as info,
    sales_code,
    name,
    wechat_name,
    payment_method,
    payment_address,
    created_at
FROM secondary_sales 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. 检查最新的订单数据
SELECT 
    '=== 最新订单 ===' as info,
    order_number,
    sales_code,
    customer_wechat,
    tradingview_username,
    amount,
    actual_payment_amount,
    duration,
    status,
    created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. 检查订单与销售的关联
SELECT 
    '=== 订单销售关联 ===' as info,
    o.order_number,
    o.sales_code,
    o.customer_wechat,
    o.amount,
    o.actual_payment_amount,
    CASE 
        WHEN p.sales_code IS NOT NULL THEN '一级销售'
        WHEN s.sales_code IS NOT NULL THEN '二级销售'
        ELSE '未关联'
    END as sales_type,
    COALESCE(p.wechat_name, s.wechat_name, '无') as sales_wechat
FROM orders o
LEFT JOIN primary_sales p ON o.sales_code = p.sales_code
LEFT JOIN secondary_sales s ON o.sales_code = s.sales_code
ORDER BY o.created_at DESC
LIMIT 5;
