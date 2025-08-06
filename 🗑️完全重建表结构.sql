-- 🗑️ 完全重建表结构（谨慎使用！会删除所有数据）
-- ⚠️ 警告：这会删除所有现有数据，请确保你真的想要重新开始

-- ============================================================================
-- 步骤1：删除现有表（按顺序删除，避免外键约束冲突）
-- ============================================================================

-- 首先删除有外键依赖的表
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS secondary_sales CASCADE;
DROP TABLE IF EXISTS primary_sales CASCADE;

-- 保留管理员表（通常不需要删除）
-- DROP TABLE IF EXISTS admins CASCADE;  -- 如果需要重建管理员表，取消注释

-- ============================================================================
-- 步骤2：重新创建完整表结构
-- ============================================================================

-- 创建一级分销表
CREATE TABLE primary_sales (
    id SERIAL PRIMARY KEY,
    wechat_name VARCHAR(100) NOT NULL UNIQUE,
    sales_code VARCHAR(50) UNIQUE NOT NULL,
    secondary_registration_code VARCHAR(50) UNIQUE NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'alipay',
    payment_address TEXT NOT NULL,
    alipay_surname VARCHAR(50),
    chain_name VARCHAR(50),
    commission_rate DECIMAL(5,2) DEFAULT 40.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建二级分销表
CREATE TABLE secondary_sales (
    id SERIAL PRIMARY KEY,
    wechat_name VARCHAR(100) NOT NULL UNIQUE,
    sales_code VARCHAR(50) UNIQUE NOT NULL,
    primary_sales_id INTEGER,
    primary_registration_code VARCHAR(50),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'alipay',
    payment_address TEXT NOT NULL,
    alipay_surname VARCHAR(50),
    chain_name VARCHAR(50),
    commission_rate DECIMAL(5,2) DEFAULT 30.00,
    status VARCHAR(20) DEFAULT 'active',
    removed_by INTEGER,
    removed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id)
);

-- 创建订单表
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    sales_code VARCHAR(50) NOT NULL,
    sales_type VARCHAR(20) NOT NULL,
    tradingview_username VARCHAR(100) NOT NULL,
    customer_wechat VARCHAR(100),
    duration VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_time TIMESTAMP NOT NULL,
    purchase_type VARCHAR(20) DEFAULT 'immediate',
    effective_time TIMESTAMP,
    expiry_time TIMESTAMP,
    submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    screenshot_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending_payment',
    commission_rate DECIMAL(5,4) DEFAULT 0.3000,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    primary_sales_id INTEGER,
    secondary_sales_id INTEGER,
    alipay_amount DECIMAL(10,2),
    crypto_amount DECIMAL(10,2),
    config_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id),
    FOREIGN KEY (secondary_sales_id) REFERENCES secondary_sales(id)
);

-- ============================================================================
-- 步骤3：创建索引
-- ============================================================================

-- primary_sales 索引
CREATE INDEX idx_primary_sales_wechat_name ON primary_sales(wechat_name);
CREATE INDEX idx_primary_sales_sales_code ON primary_sales(sales_code);
CREATE INDEX idx_primary_sales_secondary_registration_code ON primary_sales(secondary_registration_code);

-- secondary_sales 索引
CREATE INDEX idx_secondary_sales_wechat_name ON secondary_sales(wechat_name);
CREATE INDEX idx_secondary_sales_sales_code ON secondary_sales(sales_code);
CREATE INDEX idx_secondary_sales_primary_sales_id ON secondary_sales(primary_sales_id);

-- orders 索引
CREATE INDEX idx_orders_sales_code ON orders(sales_code);
CREATE INDEX idx_orders_sales_type ON orders(sales_type);
CREATE INDEX idx_orders_tradingview_username ON orders(tradingview_username);
CREATE INDEX idx_orders_primary_sales_id ON orders(primary_sales_id);
CREATE INDEX idx_orders_secondary_sales_id ON orders(secondary_sales_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_config_confirmed ON orders(config_confirmed);

-- ============================================================================
-- 步骤4：插入测试数据（可选）
-- ============================================================================

-- 插入测试一级分销
INSERT INTO primary_sales (
    wechat_name, 
    sales_code, 
    secondary_registration_code, 
    payment_method, 
    payment_address,
    alipay_surname,
    commission_rate
) VALUES (
    'test_primary_sales', 
    'PS_TEST001', 
    'SR_TEST001', 
    'alipay', 
    'test@alipay.com',
    '测试',
    40.00
);

-- 插入管理员账户（如果需要）
INSERT INTO admins (username, password_hash, role, created_at) 
VALUES ('admin', '$2b$10$example_hash', 'super_admin', CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- 步骤5：验证结果
-- ============================================================================

-- 检查表是否创建成功
SELECT 'primary_sales' as table_name, COUNT(*) as count FROM primary_sales
UNION ALL
SELECT 'secondary_sales' as table_name, COUNT(*) as count FROM secondary_sales
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as count FROM orders;

-- 显示表结构
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('primary_sales', 'secondary_sales', 'orders')
ORDER BY table_name, ordinal_position;

RAISE NOTICE '✅ 表重建完成！所有数据已重置。';
RAISE NOTICE '🧪 现在可以运行功能测试：node 🧪实际功能测试执行.js';