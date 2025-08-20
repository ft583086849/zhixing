-- 添加config_time字段到orders_optimized表
-- 这个字段用于记录订单配置确认的时间

-- 1. 添加config_time字段（如果不存在）
ALTER TABLE orders_optimized 
ADD COLUMN IF NOT EXISTS config_time TIMESTAMP WITH TIME ZONE;

-- 2. 添加索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_orders_optimized_config_time 
ON orders_optimized(config_time);

-- 3. 对于已经是confirmed_config状态的订单，设置config_time为updated_at
UPDATE orders_optimized 
SET config_time = updated_at 
WHERE status = 'confirmed_config' 
AND config_time IS NULL;

-- 4. 验证字段添加成功
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders_optimized'
AND column_name = 'config_time';