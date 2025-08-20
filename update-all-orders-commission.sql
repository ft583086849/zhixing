-- =====================================================
-- 批量更新orders_optimized表的佣金数据
-- 从sales_optimized表获取佣金率并计算佣金
-- =====================================================

-- 1. 更新所有配置成功订单的佣金率和佣金金额
-- 使用实付金额（actual_payment_amount）计算，如果没有则使用订单金额（amount）
UPDATE orders_optimized o
SET 
  commission_rate = s.commission_rate,
  commission_amount = COALESCE(o.actual_payment_amount, o.amount, 0) * s.commission_rate,
  updated_at = NOW()
FROM sales_optimized s
WHERE o.sales_code = s.sales_code
  AND COALESCE(o.actual_payment_amount, o.amount, 0) > 0
  AND o.status = 'confirmed_config';

-- 2. 更新二级销售订单的一级分销佣金
-- 一级从二级订单获得的分销佣金 = 实付金额 × (一级佣金率 - 二级佣金率)
UPDATE orders_optimized o
SET 
  secondary_commission_amount = COALESCE(o.actual_payment_amount, o.amount, 0) * (s1.commission_rate - s2.commission_rate),
  updated_at = NOW()
FROM sales_optimized s2
JOIN sales_optimized s1 ON s1.sales_code = s2.parent_sales_code
WHERE o.sales_code = s2.sales_code
  AND s2.sales_type = 'secondary'
  AND COALESCE(o.actual_payment_amount, o.amount, 0) > 0
  AND o.status = 'confirmed_config';

-- 3. 将非配置成功订单的佣金设为0（包括rejected, pending_payment, pending_config等）
UPDATE orders_optimized
SET 
  commission_rate = 0,
  commission_amount = 0,
  secondary_commission_amount = 0
WHERE status != 'confirmed_config';

-- 4. 查看更新结果统计
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'confirmed_config' THEN 1 END) as confirmed_orders,
  COUNT(CASE WHEN commission_rate > 0 THEN 1 END) as orders_with_rate,
  COUNT(CASE WHEN commission_amount > 0 THEN 1 END) as orders_with_commission,
  COUNT(CASE WHEN secondary_commission_amount > 0 THEN 1 END) as orders_with_secondary,
  ROUND(AVG(CASE WHEN commission_rate > 0 THEN commission_rate END)::numeric, 4) as avg_commission_rate,
  SUM(commission_amount) as total_commission,
  SUM(secondary_commission_amount) as total_secondary_commission
FROM orders_optimized
WHERE status = 'confirmed_config';

-- 5. 查看示例数据
SELECT 
  id,
  customer_wechat,
  sales_code,
  amount,
  commission_rate,
  commission_amount,
  secondary_commission_amount,
  status
FROM orders_optimized
WHERE amount > 0
ORDER BY created_at DESC
LIMIT 10;