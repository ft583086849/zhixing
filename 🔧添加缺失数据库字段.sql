-- 🔧 添加缺失数据库字段 SQL脚本
-- 基于需求文档v4.3，修复primary_sales和secondary_sales表结构
-- 执行时间：请在Supabase SQL Editor中执行

-- ============================================================================
-- 1. 修复 primary_sales 表
-- ============================================================================

-- 检查表是否存在
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'primary_sales') THEN
        RAISE NOTICE 'primary_sales表不存在，需要先创建表';
    ELSE
        RAISE NOTICE '开始修复primary_sales表结构...';
    END IF;
END $$;

-- 添加缺失字段到primary_sales表
ALTER TABLE primary_sales 
ADD COLUMN IF NOT EXISTS payment_address TEXT,
ADD COLUMN IF NOT EXISTS alipay_surname VARCHAR(50),
ADD COLUMN IF NOT EXISTS chain_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 40.00,
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS secondary_registration_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 添加注释
COMMENT ON COLUMN primary_sales.payment_address IS '收款地址';
COMMENT ON COLUMN primary_sales.alipay_surname IS '支付宝收款人姓氏';
COMMENT ON COLUMN primary_sales.chain_name IS '链名（如TRC20）';
COMMENT ON COLUMN primary_sales.commission_rate IS '佣金比率（默认40%）';
COMMENT ON COLUMN primary_sales.sales_code IS '用户购买时使用的销售代码';
COMMENT ON COLUMN primary_sales.secondary_registration_code IS '二级销售注册时使用的代码';

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_primary_sales_sales_code ON primary_sales(sales_code);
CREATE INDEX IF NOT EXISTS idx_primary_sales_secondary_registration_code ON primary_sales(secondary_registration_code);
CREATE INDEX IF NOT EXISTS idx_primary_sales_wechat_name ON primary_sales(wechat_name);

-- ============================================================================
-- 2. 修复 secondary_sales 表
-- ============================================================================

-- 检查表是否存在
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'secondary_sales') THEN
        RAISE NOTICE 'secondary_sales表不存在，需要先创建表';
    ELSE
        RAISE NOTICE '开始修复secondary_sales表结构...';
    END IF;
END $$;

-- 添加缺失字段到secondary_sales表
ALTER TABLE secondary_sales 
ADD COLUMN IF NOT EXISTS payment_address TEXT,
ADD COLUMN IF NOT EXISTS alipay_surname VARCHAR(50),
ADD COLUMN IF NOT EXISTS chain_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 30.00,
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS primary_sales_id INTEGER,
ADD COLUMN IF NOT EXISTS primary_registration_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS removed_by INTEGER,
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 添加注释
COMMENT ON COLUMN secondary_sales.payment_address IS '收款地址';
COMMENT ON COLUMN secondary_sales.alipay_surname IS '支付宝收款人姓氏';
COMMENT ON COLUMN secondary_sales.chain_name IS '链名（如TRC20）';
COMMENT ON COLUMN secondary_sales.commission_rate IS '佣金比率（由一级销售设定或默认30%）';
COMMENT ON COLUMN secondary_sales.sales_code IS '用户购买时使用的销售代码';
COMMENT ON COLUMN secondary_sales.primary_sales_id IS '关联的一级销售ID（NULL表示独立二级销售）';
COMMENT ON COLUMN secondary_sales.primary_registration_code IS '注册时使用的一级销售注册代码';
COMMENT ON COLUMN secondary_sales.status IS '状态：active/removed';
COMMENT ON COLUMN secondary_sales.removed_by IS '被哪个一级销售移除';
COMMENT ON COLUMN secondary_sales.removed_at IS '移除时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_secondary_sales_sales_code ON secondary_sales(sales_code);
CREATE INDEX IF NOT EXISTS idx_secondary_sales_primary_sales_id ON secondary_sales(primary_sales_id);
CREATE INDEX IF NOT EXISTS idx_secondary_sales_wechat_name ON secondary_sales(wechat_name);
CREATE INDEX IF NOT EXISTS idx_secondary_sales_status ON secondary_sales(status);

-- ============================================================================
-- 3. 修复 orders 表
-- ============================================================================

-- 添加缺失字段到orders表
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS sales_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS primary_sales_id INTEGER,
ADD COLUMN IF NOT EXISTS secondary_sales_id INTEGER,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.3000,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS customer_wechat VARCHAR(100),
ADD COLUMN IF NOT EXISTS purchase_type VARCHAR(20) DEFAULT 'immediate',
ADD COLUMN IF NOT EXISTS effective_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS expiry_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS alipay_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS crypto_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS config_confirmed BOOLEAN DEFAULT FALSE;

-- 添加注释
COMMENT ON COLUMN orders.sales_code IS '购买时使用的销售代码';
COMMENT ON COLUMN orders.sales_type IS '销售类型：primary/secondary';
COMMENT ON COLUMN orders.primary_sales_id IS '一级销售ID（如果是一级销售订单）';
COMMENT ON COLUMN orders.secondary_sales_id IS '二级销售ID（如果是二级销售订单）';
COMMENT ON COLUMN orders.commission_rate IS '佣金比率';
COMMENT ON COLUMN orders.commission_amount IS '销售返佣金额';
COMMENT ON COLUMN orders.customer_wechat IS '客户微信号';
COMMENT ON COLUMN orders.purchase_type IS '购买方式：immediate/advance';
COMMENT ON COLUMN orders.effective_time IS '生效时间';
COMMENT ON COLUMN orders.expiry_time IS '到期时间';
COMMENT ON COLUMN orders.config_confirmed IS '配置确认状态';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_sales_code ON orders(sales_code);
CREATE INDEX IF NOT EXISTS idx_orders_sales_type ON orders(sales_type);
CREATE INDEX IF NOT EXISTS idx_orders_primary_sales_id ON orders(primary_sales_id);
CREATE INDEX IF NOT EXISTS idx_orders_secondary_sales_id ON orders(secondary_sales_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_config_confirmed ON orders(config_confirmed);

-- ============================================================================
-- 4. 添加外键约束（可选）
-- ============================================================================

-- 为secondary_sales表添加外键约束
DO $$ 
BEGIN
    -- 检查外键是否已存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_secondary_sales_primary_sales_id'
    ) THEN
        ALTER TABLE secondary_sales 
        ADD CONSTRAINT fk_secondary_sales_primary_sales_id 
        FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id);
        RAISE NOTICE '已添加secondary_sales -> primary_sales外键约束';
    END IF;

    -- 为orders表添加外键约束
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_orders_primary_sales_id'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_primary_sales_id 
        FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id);
        RAISE NOTICE '已添加orders -> primary_sales外键约束';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_orders_secondary_sales_id'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_secondary_sales_id 
        FOREIGN KEY (secondary_sales_id) REFERENCES secondary_sales(id);
        RAISE NOTICE '已添加orders -> secondary_sales外键约束';
    END IF;
END $$;

-- ============================================================================
-- 5. 更新现有数据（如果有）
-- ============================================================================

-- 为现有primary_sales记录生成销售代码（如果为NULL）
UPDATE primary_sales 
SET 
    sales_code = 'PS_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12)),
    secondary_registration_code = 'SR_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12)),
    commission_rate = COALESCE(commission_rate, 40.00)
WHERE sales_code IS NULL OR secondary_registration_code IS NULL;

-- 为现有secondary_sales记录生成销售代码（如果为NULL）
UPDATE secondary_sales 
SET 
    sales_code = 'SS_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12)),
    commission_rate = COALESCE(commission_rate, 30.00),
    status = COALESCE(status, 'active')
WHERE sales_code IS NULL;

-- ============================================================================
-- 6. 验证表结构
-- ============================================================================

-- 显示primary_sales表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'primary_sales' 
ORDER BY ordinal_position;

-- 显示secondary_sales表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'secondary_sales' 
ORDER BY ordinal_position;

-- 显示orders表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- ============================================================================
-- 7. 执行完成通知
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ 数据库字段添加完成！';
    RAISE NOTICE '📋 已添加字段：';
    RAISE NOTICE '   - primary_sales: payment_address, alipay_surname, chain_name, commission_rate, sales_code, secondary_registration_code';
    RAISE NOTICE '   - secondary_sales: payment_address, alipay_surname, chain_name, commission_rate, sales_code, primary_sales_id, status';
    RAISE NOTICE '   - orders: sales_code, sales_type, primary_sales_id, secondary_sales_id, commission_rate, commission_amount';
    RAISE NOTICE '🔗 已创建索引和外键约束';
    RAISE NOTICE '🎯 现在可以重新运行功能测试了！';
    RAISE NOTICE '==============================================';
END $$;