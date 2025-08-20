-- 添加催单相关字段到订单表
ALTER TABLE orders_optimized 
ADD COLUMN IF NOT EXISTS is_reminded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_time TIMESTAMP;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_reminder 
ON orders_optimized(is_reminded, status, expiry_time) 
WHERE status IN ('confirmed_config', 'active');

-- 验证字段添加成功
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders_optimized'
  AND column_name IN ('is_reminded', 'reminder_time');