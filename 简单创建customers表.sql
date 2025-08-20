-- ======================================
-- 简化版：创建customers_optimized表
-- 请在Supabase Dashboard SQL Editor中执行
-- ======================================

-- 1. 删除旧表（如果存在）
DROP TABLE IF EXISTS customers_optimized CASCADE;

-- 2. 创建新表（简化版，只包含必要字段）
CREATE TABLE customers_optimized (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_wechat VARCHAR(100),
    customer_name VARCHAR(200),
    tradingview_username VARCHAR(100),
    sales_code VARCHAR(50),
    sales_wechat_name VARCHAR(100),
    sales_type VARCHAR(20),
    primary_sales_wechat VARCHAR(100),
    secondary_sales_wechat VARCHAR(100),
    total_orders INTEGER DEFAULT 0,
    active_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    total_paid_amount DECIMAL(10,2) DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0,
    first_order_date TIMESTAMP WITH TIME ZONE,
    last_order_date TIMESTAMP WITH TIME ZONE,
    last_order_status VARCHAR(50),
    last_order_amount DECIMAL(10,2),
    days_since_last_order INTEGER,
    avg_order_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 从orders_optimized表导入数据（简化版）
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
    avg_order_amount
)
SELECT 
    customer_wechat,
    MAX(customer_name) as customer_name,
    MAX(tradingview_username) as tradingview_username,
    MAX(sales_code) as sales_code,
    MAX(sales_wechat_name) as sales_wechat_name,
    MAX(sales_type) as sales_type,
    MAX(primary_sales_wechat) as primary_sales_wechat,
    MAX(secondary_sales_wechat) as secondary_sales_wechat,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status IN ('active', 'confirmed_config') THEN 1 END) as active_orders,
    COUNT(CASE WHEN status IN ('pending_payment', 'pending_config') THEN 1 END) as pending_orders,
    COALESCE(SUM(amount), 0) as total_amount,
    COALESCE(SUM(COALESCE(alipay_amount, 0) + COALESCE(crypto_amount, 0)), 0) as total_paid_amount,
    COALESCE(SUM(commission_amount), 0) as total_commission,
    MIN(created_at) as first_order_date,
    MAX(created_at) as last_order_date,
    MAX(status) as last_order_status,
    MAX(amount) as last_order_amount,
    EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER as days_since_last_order,
    AVG(amount)::DECIMAL(10,2) as avg_order_amount
FROM orders_optimized
WHERE customer_wechat IS NOT NULL 
    AND customer_wechat != ''
GROUP BY customer_wechat;

-- 4. 创建索引
CREATE INDEX idx_cust_opt_wechat ON customers_optimized(customer_wechat);
CREATE INDEX idx_cust_opt_amount ON customers_optimized(total_amount DESC);
CREATE INDEX idx_cust_opt_orders ON customers_optimized(total_orders DESC);

-- 5. 查看结果
SELECT COUNT(*) as "总客户数" FROM customers_optimized;

-- 查看前5个高价值客户
SELECT 
    customer_wechat,
    tradingview_username,
    sales_wechat_name,
    total_orders,
    total_amount,
    days_since_last_order
FROM customers_optimized
ORDER BY total_amount DESC
LIMIT 5;