-- =====================================================
-- 上线前同步orders和orders_optimized表数据
-- =====================================================

-- 1. 先备份当前orders_optimized表的数据（以防万一）
CREATE TABLE IF NOT EXISTS orders_optimized_backup_20250818 AS 
SELECT * FROM orders_optimized;

-- 2. 同步orders表的最新数据到orders_optimized
-- 只同步可能有变化的字段
UPDATE orders_optimized o
SET 
  status = COALESCE((SELECT status FROM orders WHERE id = o.id), o.status),
  actual_payment_amount = COALESCE((SELECT actual_payment_amount FROM orders WHERE id = o.id), o.actual_payment_amount),
  customer_wechat = COALESCE((SELECT customer_wechat FROM orders WHERE id = o.id), o.customer_wechat),
  sales_name = COALESCE((SELECT sales_name FROM orders WHERE id = o.id), o.sales_name),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = o.id 
  AND orders.updated_at > o.updated_at
);

-- 3. 插入orders表中新增的订单（如果有）
INSERT INTO orders_optimized (
  id, 
  customer_wechat, 
  sales_code, 
  sales_name,
  price_plan, 
  amount, 
  actual_payment_amount,
  payment_method, 
  status, 
  expiry_time,
  created_at,
  updated_at
)
SELECT 
  o.id,
  o.customer_wechat,
  o.sales_code,
  o.sales_name,
  o.price_plan,
  o.amount,
  o.actual_payment_amount,
  o.payment_method,
  o.status,
  o.expiry_time,
  o.created_at,
  o.updated_at
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM orders_optimized 
  WHERE orders_optimized.id = o.id
);

-- 4. 重新计算所有订单的佣金（触发器会自动处理）
-- 但为了确保，我们手动更新一次
UPDATE orders_optimized
SET 
  commission_rate = CASE 
    WHEN sales_code IN (SELECT sales_code FROM sales_optimized WHERE sales_type = 'primary') THEN 0.4
    WHEN sales_code IN (SELECT sales_code FROM sales_optimized WHERE sales_type = 'secondary') THEN 0.25
    ELSE 0.25
  END,
  commission_amount = COALESCE(actual_payment_amount, amount, 0) * CASE 
    WHEN sales_code IN (SELECT sales_code FROM sales_optimized WHERE sales_type = 'primary') THEN 0.4
    WHEN sales_code IN (SELECT sales_code FROM sales_optimized WHERE sales_type = 'secondary') THEN 0.25
    ELSE 0.25
  END
WHERE status = 'confirmed_config';

-- 5. 验证同步结果
SELECT 
  'orders表' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'confirmed_config' THEN 1 END) as confirmed_count,
  SUM(amount) as total_amount,
  SUM(actual_payment_amount) as total_actual_payment
FROM orders

UNION ALL

SELECT 
  'orders_optimized表' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'confirmed_config' THEN 1 END) as confirmed_count,
  SUM(amount) as total_amount,
  SUM(actual_payment_amount) as total_actual_payment
FROM orders_optimized;

-- 6. 检查佣金计算是否正确
SELECT 
  COUNT(*) as orders_with_commission,
  SUM(commission_amount) as total_commission,
  AVG(commission_rate) as avg_commission_rate
FROM orders_optimized
WHERE status = 'confirmed_config'
  AND commission_amount > 0;