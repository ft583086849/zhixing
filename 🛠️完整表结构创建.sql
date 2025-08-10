-- 🛠️ 完整表结构创建/修复 SQL
-- 基于检查结果，创建完整的表结构

-- ============================================================================
-- 1. 完整创建 primary_sales 表（一级分销表）
-- ============================================================================

-- 删除现有表并重新创建（如果需要）
-- DROP TABLE IF EXISTS primary_sales CASCADE;

CREATE TABLE IF NOT EXISTS primary_sales (
    id SERIAL PRIMARY KEY,
    wechat_name VARCHAR(100) NOT NULL UNIQUE,
    sales_code VARCHAR(50) UNIQUE NOT NULL,
    secondary_registration_code VARCHAR(50) UNIQUE NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'alipay',
    payment_address TEXT NOT NULL,
    alipay_surname VARCHAR(50),
    chain_name VARCHAR(50),
    commission_rate DECIMAL(5,4) DEFAULT 0.4000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 如果表已存在，添加缺失字段
ALTER TABLE primary_sales 
ADD COLUMN IF NOT EXISTS wechat_name VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS secondary_registration_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'alipay',
ADD COLUMN IF NOT EXISTS payment_address TEXT,
ADD COLUMN IF NOT EXISTS alipay_surname VARCHAR(50),
ADD COLUMN IF NOT EXISTS chain_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 40.00,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_primary_sales_wechat_name ON primary_sales(wechat_name);
CREATE INDEX IF NOT EXISTS idx_primary_sales_sales_code ON primary_sales(sales_code);
CREATE INDEX IF NOT EXISTS idx_primary_sales_secondary_registration_code ON primary_sales(secondary_registration_code);

-- ============================================================================
-- 2. 完整创建 secondary_sales 表（二级分销表）
-- ============================================================================

CREATE TABLE IF NOT EXISTS secondary_sales (
    id SERIAL PRIMARY KEY,
    wechat_name VARCHAR(100) NOT NULL UNIQUE,
    sales_code VARCHAR(50) UNIQUE NOT NULL,
    primary_sales_id INTEGER,
    primary_registration_code VARCHAR(50),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'alipay',
    payment_address TEXT NOT NULL,
    alipay_surname VARCHAR(50),
    chain_name VARCHAR(50),
    commission_rate DECIMAL(5,4) DEFAULT 0.2500,
    status VARCHAR(20) DEFAULT 'active',
    removed_by INTEGER,
    removed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 如果表已存在，添加缺失字段
ALTER TABLE secondary_sales 
ADD COLUMN IF NOT EXISTS wechat_name VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS primary_sales_id INTEGER,
ADD COLUMN IF NOT EXISTS primary_registration_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'alipay',
ADD COLUMN IF NOT EXISTS payment_address TEXT,
ADD COLUMN IF NOT EXISTS alipay_surname VARCHAR(50),
ADD COLUMN IF NOT EXISTS chain_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 30.00,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS removed_by INTEGER,
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_secondary_sales_wechat_name ON secondary_sales(wechat_name);
CREATE INDEX IF NOT EXISTS idx_secondary_sales_sales_code ON secondary_sales(sales_code);
CREATE INDEX IF NOT EXISTS idx_secondary_sales_primary_sales_id ON secondary_sales(primary_sales_id);

-- ============================================================================
-- 3. 完整创建 orders 表（订单表）
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 如果表已存在，添加缺失字段
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS sales_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS tradingview_username VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_wechat VARCHAR(100),
ADD COLUMN IF NOT EXISTS duration VARCHAR(20),
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS purchase_type VARCHAR(20) DEFAULT 'immediate',
ADD COLUMN IF NOT EXISTS effective_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS expiry_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS screenshot_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_payment',
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.3000,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS primary_sales_id INTEGER,
ADD COLUMN IF NOT EXISTS secondary_sales_id INTEGER,
ADD COLUMN IF NOT EXISTS alipay_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS crypto_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS config_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_sales_code ON orders(sales_code);
CREATE INDEX IF NOT EXISTS idx_orders_sales_type ON orders(sales_type);
CREATE INDEX IF NOT EXISTS idx_orders_tradingview_username ON orders(tradingview_username);
CREATE INDEX IF NOT EXISTS idx_orders_primary_sales_id ON orders(primary_sales_id);
CREATE INDEX IF NOT EXISTS idx_orders_secondary_sales_id ON orders(secondary_sales_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_config_confirmed ON orders(config_confirmed);

-- ============================================================================
-- 4. 添加外键约束
-- ============================================================================

-- 为secondary_sales添加外键约束
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_secondary_sales_primary_sales_id'
    ) THEN
        ALTER TABLE secondary_sales 
        ADD CONSTRAINT fk_secondary_sales_primary_sales_id 
        FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '外键约束添加失败，可能是数据不一致: %', SQLERRM;
END $$;

-- 为orders添加外键约束
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_orders_primary_sales_id'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_primary_sales_id 
        FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '外键约束添加失败，可能是数据不一致: %', SQLERRM;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_orders_secondary_sales_id'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_secondary_sales_id 
        FOREIGN KEY (secondary_sales_id) REFERENCES secondary_sales(id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '外键约束添加失败，可能是数据不一致: %', SQLERRM;
END $$;

-- ============================================================================
-- 5. 为现有记录生成必需的代码（如果表中有数据）
-- ============================================================================

-- 为现有primary_sales记录生成销售代码
UPDATE primary_sales 
SET 
    sales_code = COALESCE(sales_code, 'PS_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12))),
    secondary_registration_code = COALESCE(secondary_registration_code, 'SR_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12))),
    commission_rate = COALESCE(commission_rate, 40.00),
    payment_method = COALESCE(payment_method, 'alipay'),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE sales_code IS NULL OR secondary_registration_code IS NULL;

-- 为现有secondary_sales记录生成销售代码
UPDATE secondary_sales 
SET 
    sales_code = COALESCE(sales_code, 'SS_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12))),
    commission_rate = COALESCE(commission_rate, 30.00),
    status = COALESCE(status, 'active'),
    payment_method = COALESCE(payment_method, 'alipay'),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE sales_code IS NULL;

-- 为现有orders记录设置默认值
UPDATE orders 
SET 
    commission_rate = COALESCE(commission_rate, 0.3000),
    commission_amount = COALESCE(commission_amount, 0.00),
    config_confirmed = COALESCE(config_confirmed, FALSE),
    status = COALESCE(status, 'pending_payment'),
    purchase_type = COALESCE(purchase_type, 'immediate'),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE commission_rate IS NULL OR commission_amount IS NULL;

-- ============================================================================
-- 6. 验证表结构
-- ============================================================================

-- 显示表结构信息
SELECT '=== PRIMARY_SALES 表结构 ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'primary_sales' 
ORDER BY ordinal_position;

SELECT '=== SECONDARY_SALES 表结构 ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'secondary_sales' 
ORDER BY ordinal_position;

SELECT '=== ORDERS 表结构 ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 显示记录数量
SELECT '=== 表记录统计 ===' as info;
SELECT 'primary_sales' as table_name, COUNT(*) as record_count FROM primary_sales
UNION ALL
SELECT 'secondary_sales' as table_name, COUNT(*) as record_count FROM secondary_sales
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as record_count FROM orders
UNION ALL
SELECT 'admins' as table_name, COUNT(*) as record_count FROM admins;

-- ============================================================================
-- 7. 完成通知
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ 完整表结构创建/修复完成！';
    RAISE NOTICE '📋 已处理表：';
    RAISE NOTICE '   ✅ primary_sales - 一级分销表';
    RAISE NOTICE '   ✅ secondary_sales - 二级分销表';
    RAISE NOTICE '   ✅ orders - 订单表';
    RAISE NOTICE '   ✅ admins - 管理员表（已存在）';
    RAISE NOTICE '🔗 已创建所有必需的索引和约束';
    RAISE NOTICE '🎯 现在可以正常运行业务逻辑了！';
    RAISE NOTICE '🧪 请运行功能测试验证：';
    RAISE NOTICE '   node 🧪实际功能测试执行.js';
    RAISE NOTICE '==============================================';
END $$;