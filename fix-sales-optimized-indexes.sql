-- ========================================
-- 修复 sales_optimized 表索引冲突
-- ========================================

-- 1. 先删除已存在的索引（如果存在）
DROP INDEX IF EXISTS idx_sales_opt_code;
DROP INDEX IF EXISTS idx_sales_opt_type;
DROP INDEX IF EXISTS idx_sales_opt_parent;
DROP INDEX IF EXISTS idx_sales_opt_status;
DROP INDEX IF EXISTS idx_sales_opt_created;
DROP INDEX IF EXISTS idx_sales_opt_phone;
DROP INDEX IF EXISTS idx_sales_opt_email;
DROP INDEX IF EXISTS idx_sales_opt_original;
DROP INDEX IF EXISTS idx_sales_opt_composite;

-- 2. 重新创建索引
CREATE INDEX IF NOT EXISTS idx_sales_opt_code ON sales_optimized(sales_code);
CREATE INDEX IF NOT EXISTS idx_sales_opt_type ON sales_optimized(sales_type);
CREATE INDEX IF NOT EXISTS idx_sales_opt_parent ON sales_optimized(parent_sales_id);
CREATE INDEX IF NOT EXISTS idx_sales_opt_status ON sales_optimized(status);
CREATE INDEX IF NOT EXISTS idx_sales_opt_created ON sales_optimized(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_opt_phone ON sales_optimized(phone);
CREATE INDEX IF NOT EXISTS idx_sales_opt_email ON sales_optimized(email);
CREATE INDEX IF NOT EXISTS idx_sales_opt_original ON sales_optimized(original_table, original_id);

-- 复合索引（用于常见查询）
CREATE INDEX IF NOT EXISTS idx_sales_opt_composite ON sales_optimized(sales_type, status, created_at DESC);

-- 3. 验证索引创建结果
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'sales_optimized'
ORDER BY indexname;

-- 4. 分析表以更新统计信息
ANALYZE sales_optimized;

-- 5. 显示结果
SELECT 
    '==================== 索引修复完成 ====================' as message;

SELECT 
    COUNT(*) as "索引数量",
    'sales_optimized' as "表名"
FROM pg_indexes
WHERE tablename = 'sales_optimized';