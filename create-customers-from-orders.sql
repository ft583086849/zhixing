-- ======================================
-- 从订单表提取客户数据创建 customers_optimized
-- ======================================

-- 1. 先查看订单表中有多少唯一客户
SELECT 
    COUNT(DISTINCT customer_wechat) as "唯一客户数（按微信）",
    COUNT(DISTINCT tradingview_username) as "唯一客户数（按TV用户名）",
    COUNT(DISTINCT CONCAT(customer_wechat, '-', tradingview_username)) as "唯一客户数（组合）"
FROM orders_optimized
WHERE customer_wechat IS NOT NULL;

-- 2. 查看客户数据分布
WITH unique_customers AS (
    SELECT DISTINCT
        customer_wechat,
        customer_name,
        tradingview_username,
        -- 获取最常用的销售信息
        (ARRAY_AGG(sales_wechat_name ORDER BY created_at DESC))[1] as sales_wechat_name,
        (ARRAY_AGG(sales_code ORDER BY created_at DESC))[1] as sales_code,
        (ARRAY_AGG(sales_type ORDER BY created_at DESC))[1] as sales_type,
        COUNT(*) as order_count,
        SUM(amount) as total_amount,
        MIN(created_at) as first_order_date,
        MAX(created_at) as last_order_date
    FROM orders_optimized
    WHERE customer_wechat IS NOT NULL
    GROUP BY customer_wechat, customer_name, tradingview_username
)
SELECT 
    COUNT(*) as "总客户数",
    COUNT(CASE WHEN order_count = 1 THEN 1 END) as "单次购买客户",
    COUNT(CASE WHEN order_count > 1 THEN 1 END) as "多次购买客户",
    MAX(order_count) as "最多购买次数",
    MAX(total_amount) as "最高消费金额"
FROM unique_customers;

-- 3. 创建 customers_optimized 表（基于订单数据）
DROP TABLE IF EXISTS customers_optimized CASCADE;

CREATE TABLE customers_optimized (
    -- 主键使用UUID
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 客户基础信息（从订单表提取）
    customer_wechat VARCHAR(100) UNIQUE NOT NULL,  -- 使用微信号作为唯一标识
    customer_name VARCHAR(200),
    tradingview_username VARCHAR(100),
    
    -- 销售信息（从最新订单获取）
    sales_code VARCHAR(50),
    sales_wechat_name VARCHAR(100),
    sales_type VARCHAR(20),
    primary_sales_id UUID,
    primary_sales_wechat VARCHAR(100),
    secondary_sales_id UUID,
    secondary_sales_wechat VARCHAR(100),
    
    -- 订单统计信息
    total_orders INTEGER DEFAULT 0,
    active_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    total_paid_amount DECIMAL(10,2) DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0,
    
    -- 时间信息
    first_order_date TIMESTAMP WITH TIME ZONE,
    last_order_date TIMESTAMP WITH TIME ZONE,
    last_order_status VARCHAR(50),
    last_order_amount DECIMAL(10,2),
    days_since_last_order INTEGER,
    
    -- 分析字段
    avg_order_amount DECIMAL(10,2) DEFAULT 0,
    max_order_amount DECIMAL(10,2) DEFAULT 0,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    
    -- 搜索优化
    search_text TEXT,
    
    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 从订单表提取并插入客户数据
INSERT INTO customers_optimized (
    customer_wechat,
    customer_name,
    tradingview_username,
    sales_code,
    sales_wechat_name,
    sales_type,
    primary_sales_wechat,
    secondary_sales_wechat,
    total_orders,
    active_orders,
    pending_orders,
    total_amount,
    total_paid_amount,
    total_commission,
    first_order_date,
    last_order_date,
    last_order_status,
    last_order_amount,
    days_since_last_order,
    avg_order_amount,
    max_order_amount,
    min_order_amount,
    search_text,
    created_at
)
SELECT 
    customer_wechat,
    -- 取最常用的客户名
    (ARRAY_AGG(customer_name ORDER BY created_at DESC))[1] as customer_name,
    -- 取最常用的TV用户名
    (ARRAY_AGG(tradingview_username ORDER BY created_at DESC))[1] as tradingview_username,
    
    -- 销售信息（取最新的）
    (ARRAY_AGG(sales_code ORDER BY created_at DESC))[1] as sales_code,
    (ARRAY_AGG(sales_wechat_name ORDER BY created_at DESC))[1] as sales_wechat_name,
    (ARRAY_AGG(sales_type ORDER BY created_at DESC))[1] as sales_type,
    (ARRAY_AGG(primary_sales_wechat ORDER BY created_at DESC))[1] as primary_sales_wechat,
    (ARRAY_AGG(secondary_sales_wechat ORDER BY created_at DESC))[1] as secondary_sales_wechat,
    
    -- 订单统计
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status IN ('active', 'confirmed_config', 'confirmed_payment') THEN 1 END) as active_orders,
    COUNT(CASE WHEN status IN ('pending_payment', 'pending_config') THEN 1 END) as pending_orders,
    COALESCE(SUM(amount), 0) as total_amount,
    COALESCE(SUM(COALESCE(alipay_amount, 0) + COALESCE(crypto_amount, 0)), 0) as total_paid_amount,
    COALESCE(SUM(commission_amount), 0) as total_commission,
    
    -- 时间信息
    MIN(created_at) as first_order_date,
    MAX(created_at) as last_order_date,
    (ARRAY_AGG(status ORDER BY created_at DESC))[1] as last_order_status,
    (ARRAY_AGG(amount ORDER BY created_at DESC))[1] as last_order_amount,
    EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER as days_since_last_order,
    
    -- 分析字段
    AVG(amount)::DECIMAL(10,2) as avg_order_amount,
    MAX(amount) as max_order_amount,
    MIN(amount) as min_order_amount,
    
    -- 搜索文本
    LOWER(CONCAT_WS(' ',
        customer_wechat,
        (ARRAY_AGG(customer_name ORDER BY created_at DESC))[1],
        (ARRAY_AGG(tradingview_username ORDER BY created_at DESC))[1]
    )) as search_text,
    
    -- 使用第一笔订单时间作为客户创建时间
    MIN(created_at) as created_at
    
FROM orders_optimized
WHERE customer_wechat IS NOT NULL 
    AND customer_wechat != ''
    AND customer_wechat != '1'  -- 排除测试数据
GROUP BY customer_wechat;

-- 5. 创建索引
CREATE INDEX idx_customers_opt_wechat ON customers_optimized(customer_wechat);
CREATE INDEX idx_customers_opt_tv_username ON customers_optimized(tradingview_username);
CREATE INDEX idx_customers_opt_sales_wechat ON customers_optimized(sales_wechat_name);
CREATE INDEX idx_customers_opt_created_at ON customers_optimized(created_at DESC);
CREATE INDEX idx_customers_opt_last_order ON customers_optimized(last_order_date DESC);
CREATE INDEX idx_customers_opt_total_amount ON customers_optimized(total_amount DESC);
CREATE INDEX idx_customers_opt_total_orders ON customers_optimized(total_orders DESC);
CREATE INDEX idx_customers_opt_search ON customers_optimized USING gin(to_tsvector('simple', search_text));

-- 6. 验证数据
SELECT 
    COUNT(*) as "客户总数",
    COUNT(CASE WHEN total_orders = 1 THEN 1 END) as "单次购买",
    COUNT(CASE WHEN total_orders > 1 THEN 1 END) as "多次购买",
    AVG(total_orders)::DECIMAL(10,2) as "平均订单数",
    AVG(total_amount)::DECIMAL(10,2) as "平均消费额",
    MAX(total_amount) as "最高消费额"
FROM customers_optimized;

-- 7. 查看前10个高价值客户
SELECT 
    customer_wechat,
    tradingview_username,
    sales_wechat_name,
    total_orders as "订单数",
    total_amount as "总消费",
    last_order_date as "最近订单",
    days_since_last_order as "距今天数"
FROM customers_optimized
ORDER BY total_amount DESC
LIMIT 10;