-- ========================================
-- 添加催单相关字段到orders_optimized表
-- 请在Supabase SQL编辑器中执行此脚本
-- ========================================

-- 1. 添加催单状态字段
ALTER TABLE orders_optimized 
ADD COLUMN IF NOT EXISTS is_reminded BOOLEAN DEFAULT false;

-- 2. 添加催单时间字段
ALTER TABLE orders_optimized 
ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMP WITH TIME ZONE;

-- 3. 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_optimized_is_reminded 
ON orders_optimized(is_reminded);

CREATE INDEX IF NOT EXISTS idx_orders_optimized_reminded_at 
ON orders_optimized(reminded_at);

-- 4. 添加字段注释
COMMENT ON COLUMN orders_optimized.is_reminded IS '是否已催单';
COMMENT ON COLUMN orders_optimized.reminded_at IS '催单时间';

-- 5. 验证字段是否添加成功
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders_optimized' 
AND column_name IN ('is_reminded', 'reminded_at');

-- 执行完成后，应该看到两条记录：
-- is_reminded | boolean | YES | false
-- reminded_at | timestamp with time zone | YES | NULL