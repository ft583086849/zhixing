-- ================================================
-- 添加预留字段和优化索引
-- 执行时间：约5-10分钟
-- 使用CONCURRENTLY避免锁表
-- ================================================

-- ================================================
-- 1. Orders表预留字段
-- ================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_became_sales BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_conversion_date TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS link_type VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS parent_sales_type VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate_snapshot DECIMAL(5,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_first_order BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_source VARCHAR(50);

-- Orders表索引优化（使用CONCURRENTLY避免锁表）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status) WHERE status != 'rejected';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_sales_code ON orders(sales_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_time ON orders(payment_time DESC) WHERE payment_time IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- ================================================
-- 2. Customers表预留字段
-- ================================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_sales BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_type VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS became_sales_at TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_link VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS parent_sales_id INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS parent_sales_type VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_qr_code TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(10,2) DEFAULT 0;

-- Customers表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_wechat ON customers(wechat_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_is_sales ON customers(is_sales);

-- ================================================
-- 3. 销售表预留字段
-- ================================================

-- Primary_sales表
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS allow_recruit BOOLEAN DEFAULT TRUE;
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS max_secondary_count INTEGER DEFAULT 100;
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS recruit_link VARCHAR(255);
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS purchase_link VARCHAR(255);
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS total_recruited INTEGER DEFAULT 0;
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- Secondary_sales表
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS converted_from_order_id INTEGER;
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP;
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS payment_qr_code TEXT;
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS payment_info TEXT;

-- 销售表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_primary_sales_code ON primary_sales(sales_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_secondary_sales_code ON secondary_sales(sales_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_secondary_sales_primary ON secondary_sales(primary_sales_id);

-- ================================================
-- 完成提示
-- ================================================
-- 所有字段和索引添加完成
-- 使用以下命令检查索引创建进度：
-- SELECT * FROM pg_stat_progress_create_index;

-- 查看新添加的字段：
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name IN ('orders', 'customers', 'primary_sales', 'secondary_sales')
-- AND column_name IN ('user_id', 'customer_became_sales', 'is_sales', 'allow_recruit')
-- ORDER BY table_name, ordinal_position;