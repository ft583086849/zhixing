-- ========================================
-- 安全重建 sales_optimized 表
-- 会保留现有数据
-- ========================================

-- 1. 检查表是否存在
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_optimized') THEN
        RAISE NOTICE '表 sales_optimized 已存在';
        
        -- 检查是否有数据
        DECLARE
            row_count INT;
        BEGIN
            SELECT COUNT(*) INTO row_count FROM sales_optimized;
            RAISE NOTICE '当前表中有 % 条记录', row_count;
            
            IF row_count > 0 THEN
                RAISE NOTICE '⚠️ 警告：表中有数据，将备份到 sales_optimized_backup';
                
                -- 备份现有表
                DROP TABLE IF EXISTS sales_optimized_backup;
                CREATE TABLE sales_optimized_backup AS SELECT * FROM sales_optimized;
                RAISE NOTICE '✅ 数据已备份到 sales_optimized_backup';
            END IF;
        END;
        
    ELSE
        RAISE NOTICE '表 sales_optimized 不存在，将创建新表';
    END IF;
END $$;

-- 2. 如果只想添加缺失的字段（不删除表）
DO $$
BEGIN
    -- 检查并添加缺失的字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales_optimized' 
                   AND column_name = 'password_hash') THEN
        ALTER TABLE sales_optimized ADD COLUMN password_hash VARCHAR(255);
        RAISE NOTICE '✅ 添加字段 password_hash';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales_optimized' 
                   AND column_name = 'password_salt') THEN
        ALTER TABLE sales_optimized ADD COLUMN password_salt VARCHAR(100);
        RAISE NOTICE '✅ 添加字段 password_salt';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales_optimized' 
                   AND column_name = 'login_enabled') THEN
        ALTER TABLE sales_optimized ADD COLUMN login_enabled BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ 添加字段 login_enabled';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales_optimized' 
                   AND column_name = 'last_login_at') THEN
        ALTER TABLE sales_optimized ADD COLUMN last_login_at TIMESTAMP;
        RAISE NOTICE '✅ 添加字段 last_login_at';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales_optimized' 
                   AND column_name = 'login_attempts') THEN
        ALTER TABLE sales_optimized ADD COLUMN login_attempts INT DEFAULT 0;
        RAISE NOTICE '✅ 添加字段 login_attempts';
    END IF;
END $$;

-- 3. 修复索引（删除重复的，重新创建）
DROP INDEX IF EXISTS idx_sales_opt_code;
DROP INDEX IF EXISTS idx_sales_opt_type;
DROP INDEX IF EXISTS idx_sales_opt_parent;
DROP INDEX IF EXISTS idx_sales_opt_status;
DROP INDEX IF EXISTS idx_sales_opt_created;
DROP INDEX IF EXISTS idx_sales_opt_phone;
DROP INDEX IF EXISTS idx_sales_opt_email;
DROP INDEX IF EXISTS idx_sales_opt_original;
DROP INDEX IF EXISTS idx_sales_opt_composite;

-- 重新创建索引
CREATE INDEX idx_sales_opt_code ON sales_optimized(sales_code);
CREATE INDEX idx_sales_opt_type ON sales_optimized(sales_type);
CREATE INDEX idx_sales_opt_parent ON sales_optimized(parent_sales_id) WHERE parent_sales_id IS NOT NULL;
CREATE INDEX idx_sales_opt_status ON sales_optimized(status);
CREATE INDEX idx_sales_opt_created ON sales_optimized(created_at DESC);
CREATE INDEX idx_sales_opt_phone ON sales_optimized(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_sales_opt_email ON sales_optimized(email) WHERE email IS NOT NULL;
CREATE INDEX idx_sales_opt_original ON sales_optimized(original_table, original_id) WHERE original_table IS NOT NULL;
CREATE INDEX idx_sales_opt_composite ON sales_optimized(sales_type, status, created_at DESC);

-- 4. 显示表结构
SELECT 
    '==================== 表结构信息 ====================' as message;

SELECT 
    column_name as "字段名",
    data_type as "数据类型",
    is_nullable as "可为空",
    column_default as "默认值"
FROM information_schema.columns
WHERE table_name = 'sales_optimized'
ORDER BY ordinal_position;

-- 5. 显示数据统计
SELECT 
    '==================== 数据统计 ====================' as message;

SELECT 
    sales_type as "销售类型",
    COUNT(*) as "数量",
    SUM(total_orders) as "总订单",
    SUM(total_amount) as "总金额"
FROM sales_optimized
GROUP BY sales_type
ORDER BY sales_type;

-- 6. 提示下一步
SELECT 
    '==================== 下一步操作 ====================' as message,
    '如果表为空，请执行 migrate-to-sales-optimized-v4.sql 迁移数据' as action;