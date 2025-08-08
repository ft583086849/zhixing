-- =====================================================
-- 修复时间范围筛选问题：添加payment_time字段
-- =====================================================

-- 1. 添加payment_time字段到orders表
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_time TIMESTAMP;

-- 2. 为已存在的订单初始化payment_time
-- 对于已确认的订单，使用updated_at作为付款时间
UPDATE orders 
SET payment_time = updated_at 
WHERE status = 'confirmed_config' 
  AND payment_time IS NULL 
  AND updated_at IS NOT NULL;

-- 对于已确认但updated_at为空的订单，使用config_time
UPDATE orders 
SET payment_time = config_time 
WHERE status = 'confirmed_config' 
  AND payment_time IS NULL 
  AND config_time IS NOT NULL;

-- 对于已确认但没有任何时间的订单，使用created_at
UPDATE orders 
SET payment_time = created_at 
WHERE status = 'confirmed_config' 
  AND payment_time IS NULL;

-- 3. 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_payment_time 
ON orders(payment_time);

-- 4. 验证修改结果
SELECT 
  COUNT(*) as total_orders,
  COUNT(payment_time) as orders_with_payment_time,
  COUNT(CASE WHEN status = 'confirmed_config' THEN 1 END) as confirmed_orders,
  COUNT(CASE WHEN status = 'confirmed_config' AND payment_time IS NOT NULL THEN 1 END) as confirmed_with_payment_time
FROM orders;

-- 5. 查看几个样本数据
SELECT 
  id,
  status,
  created_at,
  updated_at,
  config_time,
  payment_time,
  amount
FROM orders
WHERE status = 'confirmed_config'
LIMIT 5;
