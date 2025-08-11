-- 1. 检查一级销售对账页面问题：查看订单状态值分布
SELECT DISTINCT status, COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- 2. 查看某个一级销售的二级销售及其订单情况
-- 以 WML792355703 为例（他有二级销售 fl261247）
SELECT 
  ps.wechat_name as primary_sales_name,
  ps.sales_code as primary_sales_code,
  ss.wechat_name as secondary_sales_name, 
  ss.sales_code as secondary_sales_code,
  COUNT(o.id) as order_count,
  GROUP_CONCAT(DISTINCT o.status) as order_statuses
FROM primary_sales ps
LEFT JOIN secondary_sales ss ON ss.primary_sales_id = ps.id
LEFT JOIN orders o ON o.sales_code = ss.sales_code
WHERE ps.wechat_name = 'WML792355703'
GROUP BY ps.id, ss.id;

-- 3. 检查fl261247的订单详情
SELECT id, order_number, sales_code, status, amount, created_at
FROM orders
WHERE sales_code IN (
  SELECT sales_code FROM secondary_sales WHERE wechat_name = 'fl261247'
)
ORDER BY created_at DESC
LIMIT 10;

-- 4. 检查订单管理页面问题：查看customer_wechat为guazigongshe和niu001002003的订单
SELECT 
  o.id,
  o.order_number,
  o.customer_wechat,
  o.sales_code,
  o.primary_sales_id,
  o.secondary_sales_id,
  ps.wechat_name as primary_wechat,
  ss.wechat_name as secondary_wechat
FROM orders o
LEFT JOIN primary_sales ps ON ps.id = o.primary_sales_id OR ps.sales_code = o.sales_code
LEFT JOIN secondary_sales ss ON ss.id = o.secondary_sales_id OR ss.sales_code = o.sales_code
WHERE o.customer_wechat IN ('guazigongshe', 'niu001002003');

-- 5. 检查是否有销售的wechat_name是这两个值
SELECT 'primary' as type, id, wechat_name, sales_code 
FROM primary_sales 
WHERE wechat_name IN ('guazigongshe', 'niu001002003')
UNION ALL
SELECT 'secondary' as type, id, wechat_name, sales_code 
FROM secondary_sales 
WHERE wechat_name IN ('guazigongshe', 'niu001002003');

-- 6. 检查qq4073969订单的销售关联
SELECT 
  o.id,
  o.order_number,
  o.customer_wechat,
  o.sales_code,
  o.primary_sales_id,
  o.secondary_sales_id,
  o.status,
  o.created_at,
  ps.wechat_name as linked_primary,
  ss.wechat_name as linked_secondary
FROM orders o
LEFT JOIN primary_sales ps ON ps.id = o.primary_sales_id OR ps.sales_code = o.sales_code
LEFT JOIN secondary_sales ss ON ss.id = o.secondary_sales_id OR ss.sales_code = o.sales_code
WHERE o.customer_wechat = 'qq4073969';

-- 7. 检查sales_code字段的分布，看是否有异常值
SELECT 
  sales_code,
  COUNT(*) as order_count,
  GROUP_CONCAT(DISTINCT customer_wechat) as customers
FROM orders
WHERE sales_code IS NOT NULL AND sales_code != ''
GROUP BY sales_code
HAVING COUNT(*) > 0
ORDER BY order_count DESC
LIMIT 20;
