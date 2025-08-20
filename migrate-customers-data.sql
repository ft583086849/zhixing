-- ======================================
-- 迁移数据到 customers_optimized 表
-- ======================================

-- 1. 清空目标表（仅在需要重新迁移时使用）
-- TRUNCATE TABLE customers_optimized CASCADE;

-- 2. 迁移客户基础数据和统计信息
INSERT INTO customers_optimized (
    -- 基础字段
    id,
    customer_name,
    customer_wechat,
    tradingview_username,
    phone,
    email,
    sales_id,
    status,
    notes,
    created_at,
    updated_at,
    
    -- 销售相关字段（从sales表获取）
    sales_code,
    sales_wechat_name,
    sales_type,
    primary_sales_id,
    primary_sales_wechat,
    secondary_sales_id,
    secondary_sales_wechat,
    
    -- 订单统计字段
    total_orders,
    active_orders,
    pending_orders,
    completed_orders,
    total_amount,
    total_paid_amount,
    total_commission,
    
    -- 最近订单信息
    last_order_id,
    last_order_date,
    last_order_status,
    last_order_amount,
    
    -- 首单信息
    first_order_id,
    first_order_date,
    first_order_amount,
    
    -- 分析字段
    avg_order_amount,
    days_since_last_order,
    
    -- 搜索字段
    search_text
)
SELECT 
    -- 从customers表获取基础信息
    c.id,
    c.customer_name,
    c.customer_wechat,
    c.tradingview_username,
    c.phone,
    c.email,
    c.sales_id,
    COALESCE(c.status, 'active') as status,
    c.notes,
    c.created_at,
    c.updated_at,
    
    -- 从sales表获取销售信息（避免后续JOIN）
    s.sales_code,
    s.wechat_name as sales_wechat_name,
    s.sales_type,
    CASE 
        WHEN s.sales_type = 'secondary' THEN s.primary_sales_id
        WHEN s.sales_type = 'primary' THEN s.id
        ELSE NULL
    END as primary_sales_id,
    ps.wechat_name as primary_sales_wechat,
    CASE 
        WHEN s.sales_type = 'secondary' THEN s.id
        ELSE NULL
    END as secondary_sales_id,
    CASE 
        WHEN s.sales_type = 'secondary' THEN s.wechat_name
        ELSE NULL
    END as secondary_sales_wechat,
    
    -- 订单统计（从orders_optimized表聚合）
    COALESCE(order_stats.total_orders, 0) as total_orders,
    COALESCE(order_stats.active_orders, 0) as active_orders,
    COALESCE(order_stats.pending_orders, 0) as pending_orders,
    COALESCE(order_stats.completed_orders, 0) as completed_orders,
    COALESCE(order_stats.total_amount, 0) as total_amount,
    COALESCE(order_stats.total_paid_amount, 0) as total_paid_amount,
    COALESCE(order_stats.total_commission, 0) as total_commission,
    
    -- 最近订单信息
    order_stats.last_order_id,
    order_stats.last_order_date,
    order_stats.last_order_status,
    order_stats.last_order_amount,
    
    -- 首单信息
    order_stats.first_order_id,
    order_stats.first_order_date,
    order_stats.first_order_amount,
    
    -- 分析字段
    CASE 
        WHEN order_stats.total_orders > 0 
        THEN order_stats.total_amount / order_stats.total_orders
        ELSE 0
    END as avg_order_amount,
    CASE 
        WHEN order_stats.last_order_date IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - order_stats.last_order_date)::INTEGER
        ELSE NULL
    END as days_since_last_order,
    
    -- 搜索文本
    LOWER(CONCAT_WS(' ', 
        c.customer_name, 
        c.customer_wechat, 
        c.tradingview_username,
        c.phone,
        c.email,
        s.wechat_name
    )) as search_text
    
FROM customers c

-- 左连接销售表
LEFT JOIN sales s ON c.sales_id = s.id
LEFT JOIN sales ps ON s.primary_sales_id = ps.id

-- 左连接订单统计子查询
LEFT JOIN (
    SELECT 
        o.customer_id,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN o.status IN ('active', 'confirmed_config') THEN 1 END) as active_orders,
        COUNT(CASE WHEN o.status IN ('pending_payment', 'pending_config') THEN 1 END) as pending_orders,
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
        
        SUM(o.amount) as total_amount,
        SUM(COALESCE(o.alipay_amount, 0) + COALESCE(o.crypto_amount, 0)) as total_paid_amount,
        SUM(COALESCE(o.commission_amount, 0)) as total_commission,
        
        -- 最近订单（使用窗口函数）
        (ARRAY_AGG(o.id ORDER BY o.created_at DESC))[1] as last_order_id,
        MAX(o.created_at) as last_order_date,
        (ARRAY_AGG(o.status ORDER BY o.created_at DESC))[1] as last_order_status,
        (ARRAY_AGG(o.amount ORDER BY o.created_at DESC))[1] as last_order_amount,
        
        -- 首单
        (ARRAY_AGG(o.id ORDER BY o.created_at ASC))[1] as first_order_id,
        MIN(o.created_at) as first_order_date,
        (ARRAY_AGG(o.amount ORDER BY o.created_at ASC))[1] as first_order_amount
        
    FROM orders_optimized o
    WHERE o.status != 'cancelled' AND o.status != 'rejected'
    GROUP BY o.customer_id
) order_stats ON c.id = order_stats.customer_id

-- 排除测试数据（可选）
WHERE c.customer_wechat NOT LIKE '%test%'
  AND (c.email IS NULL OR c.email NOT LIKE '%test%')
  
ON CONFLICT (id) DO UPDATE SET
    -- 如果ID已存在，更新所有字段
    customer_name = EXCLUDED.customer_name,
    customer_wechat = EXCLUDED.customer_wechat,
    tradingview_username = EXCLUDED.tradingview_username,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    sales_id = EXCLUDED.sales_id,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = EXCLUDED.updated_at,
    
    sales_code = EXCLUDED.sales_code,
    sales_wechat_name = EXCLUDED.sales_wechat_name,
    sales_type = EXCLUDED.sales_type,
    primary_sales_id = EXCLUDED.primary_sales_id,
    primary_sales_wechat = EXCLUDED.primary_sales_wechat,
    secondary_sales_id = EXCLUDED.secondary_sales_id,
    secondary_sales_wechat = EXCLUDED.secondary_sales_wechat,
    
    total_orders = EXCLUDED.total_orders,
    active_orders = EXCLUDED.active_orders,
    pending_orders = EXCLUDED.pending_orders,
    completed_orders = EXCLUDED.completed_orders,
    total_amount = EXCLUDED.total_amount,
    total_paid_amount = EXCLUDED.total_paid_amount,
    total_commission = EXCLUDED.total_commission,
    
    last_order_id = EXCLUDED.last_order_id,
    last_order_date = EXCLUDED.last_order_date,
    last_order_status = EXCLUDED.last_order_status,
    last_order_amount = EXCLUDED.last_order_amount,
    
    first_order_id = EXCLUDED.first_order_id,
    first_order_date = EXCLUDED.first_order_date,
    first_order_amount = EXCLUDED.first_order_amount,
    
    avg_order_amount = EXCLUDED.avg_order_amount,
    days_since_last_order = EXCLUDED.days_since_last_order,
    
    search_text = EXCLUDED.search_text,
    synced_at = NOW();

-- 3. 处理没有销售的客户（如果有）
UPDATE customers_optimized
SET 
    sales_wechat_name = '未分配',
    sales_type = 'unassigned'
WHERE sales_id IS NULL;

-- 4. 验证迁移结果
SELECT 
    'customers' as "源表",
    COUNT(*) as "记录数"
FROM customers
WHERE customer_wechat NOT LIKE '%test%'
UNION ALL
SELECT 
    'customers_optimized' as "目标表",
    COUNT(*) as "记录数"
FROM customers_optimized;

-- 5. 查看迁移的数据示例
SELECT 
    customer_wechat,
    tradingview_username,
    sales_wechat_name,
    sales_type,
    total_orders,
    total_amount,
    last_order_date,
    days_since_last_order
FROM customers_optimized
ORDER BY total_amount DESC
LIMIT 10;

-- 6. 检查统计准确性（抽查5个客户）
WITH verification AS (
    SELECT 
        c.id,
        c.customer_wechat,
        co.total_orders as optimized_orders,
        COUNT(o.id) as actual_orders,
        co.total_amount as optimized_amount,
        COALESCE(SUM(o.amount), 0) as actual_amount
    FROM customers c
    INNER JOIN customers_optimized co ON c.id = co.id
    LEFT JOIN orders_optimized o ON c.id = o.customer_id 
        AND o.status NOT IN ('cancelled', 'rejected')
    GROUP BY c.id, c.customer_wechat, co.total_orders, co.total_amount
    LIMIT 5
)
SELECT 
    customer_wechat,
    optimized_orders,
    actual_orders,
    CASE 
        WHEN optimized_orders = actual_orders THEN '✅ 一致'
        ELSE '❌ 不一致'
    END as "订单数检查",
    optimized_amount,
    actual_amount,
    CASE 
        WHEN optimized_amount = actual_amount THEN '✅ 一致'
        ELSE '❌ 不一致'
    END as "金额检查"
FROM verification;