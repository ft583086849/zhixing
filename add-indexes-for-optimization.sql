-- =====================================================
-- 添加索引优化查询性能
-- 执行时间：建议在低峰期执行
-- =====================================================

-- 1. orders_optimized 表索引
-- 销售代码索引（最常用的查询条件）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_sales_code 
ON orders_optimized(sales_code);

-- 状态索引（筛选常用）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status 
ON orders_optimized(status);

-- 创建时间索引（排序和范围查询）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at 
ON orders_optimized(created_at DESC);

-- 金额索引（金额范围查询）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_amount 
ON orders_optimized(amount);

-- 复合索引：状态+创建时间（催单查询优化）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created 
ON orders_optimized(status, created_at DESC);

-- 复合索引：销售代码+状态（销售订单查询）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_sales_status 
ON orders_optimized(sales_code, status);

-- 2. sales_optimized 表索引
-- 销售代码索引（主键已有，但确保存在）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_sales_code 
ON sales_optimized(sales_code);

-- 销售类型索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_type 
ON sales_optimized(sales_type);

-- 上级销售代码索引（关联查询）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_parent_code 
ON sales_optimized(parent_sales_code);

-- 3. customers_optimized 表索引（如果存在）
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_id 
-- ON customers_optimized(id);

-- 4. 查看索引创建状态
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('orders_optimized', 'sales_optimized')
ORDER BY tablename, indexname;

-- 5. 分析表统计信息（帮助查询优化器）
ANALYZE orders_optimized;
ANALYZE sales_optimized;

-- 6. 查看表大小和索引大小
SELECT 
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS indexes_size
FROM pg_catalog.pg_statio_user_tables
WHERE relname IN ('orders_optimized', 'sales_optimized')
ORDER BY pg_total_relation_size(relid) DESC;