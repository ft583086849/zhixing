-- 检查二级销售订单统计问题

-- 1. 验证fl261247的sales_code
SELECT 
  id,
  wechat_name,
  sales_code,
  primary_sales_id,
  commission_rate
FROM secondary_sales 
WHERE wechat_name = 'fl261247';

-- 2. 检查fl261247的订单状态值
SELECT 
  sales_code,
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM orders 
WHERE sales_code = 'SEC17547252976848697'
GROUP BY sales_code, status;

-- 3. 检查系统中所有的订单状态值
SELECT DISTINCT status, COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- 4. 验证getPrimarySalesSettlement查询逻辑
-- 模拟后端查询：确认订单
SELECT 
  ss.wechat_name,
  ss.sales_code,
  COUNT(CASE WHEN o.status IN ('confirmed', 'confirmed_config', 'confirmed_configuration', 'active') THEN 1 END) as confirmed_orders,
  SUM(CASE WHEN o.status IN ('confirmed', 'confirmed_config', 'confirmed_configuration', 'active') 
      THEN COALESCE(o.actual_payment_amount, o.amount, 0) ELSE 0 END) as confirmed_amount
FROM secondary_sales ss
LEFT JOIN orders o ON o.sales_code = ss.sales_code
WHERE ss.primary_sales_id = 4  -- WML792355703的ID
GROUP BY ss.id, ss.wechat_name, ss.sales_code
ORDER BY ss.wechat_name;
