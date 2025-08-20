-- 🛡️ 零风险解决方案
-- 创建新表orders_optimized_v2，不影响现有业务

-- 1. 首先检查现有情况
SELECT 
    '📊 现有orders_optimized状态' as info,
    COUNT(*) as record_count,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM orders_optimized;

-- 2. 创建新的优化表orders_optimized_v2（字段长度充足）
CREATE TABLE IF NOT EXISTS orders_optimized_v2 (
    -- 基础信息字段
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- 客户信息字段（字段长度充足）
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(50),
    customer_email VARCHAR(200),
    customer_wechat VARCHAR(100),
    tradingview_username VARCHAR(100),
    
    -- 金额和支付字段
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    actual_payment_amount DECIMAL(10,2),
    alipay_amount DECIMAL(10,2),
    crypto_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    payment_time TIMESTAMPTZ,
    
    -- 产品和订单字段
    duration VARCHAR(50) NOT NULL,
    purchase_type VARCHAR(30) DEFAULT 'immediate',
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    config_confirmed BOOLEAN DEFAULT FALSE,
    effective_time TIMESTAMPTZ,
    expiry_time TIMESTAMPTZ,
    submit_time TIMESTAMPTZ,
    
    -- 销售关联字段
    sales_code VARCHAR(100),
    sales_type VARCHAR(30),
    primary_sales_id BIGINT,
    secondary_sales_id BIGINT,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    commission_rate DECIMAL(5,4) DEFAULT 0,
    link_code VARCHAR(100),
    
    -- 附件和截图字段
    screenshot_path VARCHAR(500),
    screenshot_data TEXT,
    
    -- 性能优化字段
    search_keywords TEXT,
    data_version INTEGER DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- 未来扩展字段
    customer_id BIGINT,
    source_channel VARCHAR(100),
    referrer_code VARCHAR(100),
    campaign_id VARCHAR(100),
    device_info JSONB,
    geo_location JSONB,
    risk_score INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- 约束
    CONSTRAINT chk_v2_payment_status 
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled', 'pending_payment')),
        
    CONSTRAINT chk_v2_sales_type 
        CHECK (sales_type IN ('primary', 'secondary', 'independent') OR sales_type IS NULL),
        
    CONSTRAINT chk_v2_status 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired', 'confirmed_config', 'pending_payment', 'pending_config', 'rejected', 'completed', 'processing')),
        
    CONSTRAINT chk_v2_amount_positive 
        CHECK (amount >= 0),
        
    CONSTRAINT chk_v2_commission_rate 
        CHECK (commission_rate >= 0 AND commission_rate <= 1)
);

-- 3. 创建索引
CREATE INDEX idx_orders_v2_created_at ON orders_optimized_v2 (created_at DESC);
CREATE INDEX idx_orders_v2_payment_status ON orders_optimized_v2 (payment_status);
CREATE INDEX idx_orders_v2_status ON orders_optimized_v2 (status);
CREATE INDEX idx_orders_v2_customer_name ON orders_optimized_v2 (customer_name);
CREATE INDEX idx_orders_v2_sales_code ON orders_optimized_v2 (sales_code);

-- 4. 从原orders表完整迁移数据
INSERT INTO orders_optimized_v2 (
    order_number, created_at, updated_at,
    customer_name, customer_phone, customer_email, customer_wechat, tradingview_username,
    amount, actual_payment_amount, alipay_amount, crypto_amount,
    payment_method, payment_status, payment_time,
    duration, purchase_type, status, config_confirmed,
    effective_time, expiry_time, submit_time,
    sales_code, sales_type, primary_sales_id, secondary_sales_id,
    commission_amount, commission_rate, link_code,
    screenshot_path, screenshot_data,
    search_keywords, data_version, is_deleted
)
SELECT 
    order_number, created_at, updated_at,
    customer_name, customer_phone, customer_email, customer_wechat, tradingview_username,
    amount, actual_payment_amount, alipay_amount, crypto_amount,
    payment_method, payment_status, payment_time,
    duration, purchase_type, status, config_confirmed,
    effective_time, expiry_time, submit_time,
    sales_code, sales_type, primary_sales_id, secondary_sales_id,
    commission_amount, commission_rate, link_code,
    screenshot_path, screenshot_data,
    CONCAT_WS(' ', customer_name, customer_phone, customer_wechat, order_number, tradingview_username) as search_keywords,
    1 as data_version,
    FALSE as is_deleted
FROM orders
WHERE order_number IS NOT NULL
ORDER BY created_at;

-- 5. 验证迁移结果
SELECT 
    '✅ orders_optimized_v2创建完成' as result,
    COUNT(*) as total_records,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders
FROM orders_optimized_v2;

-- 6. 对比三个表的数据量
SELECT 'orders (原表)' as table_name, COUNT(*) as record_count FROM orders
UNION ALL
SELECT 'orders_optimized (现有)' as table_name, COUNT(*) as record_count FROM orders_optimized
UNION ALL
SELECT 'orders_optimized_v2 (新表)' as table_name, COUNT(*) as record_count FROM orders_optimized_v2;

SELECT '✅ 新表orders_optimized_v2创建成功，原有表完全不受影响！' as message;