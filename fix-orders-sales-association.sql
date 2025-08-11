-- 修复订单的销售关联（不删除任何数据）

-- 1. 查看需要修复的订单
SELECT 
  o.id,
  o.order_number,
  o.customer_wechat,
  o.sales_code,
  o.primary_sales_id,
  o.secondary_sales_id,
  ps.id as should_be_primary_id,
  ss.id as should_be_secondary_id
FROM orders o
LEFT JOIN primary_sales ps ON ps.sales_code = o.sales_code
LEFT JOIN secondary_sales ss ON ss.sales_code = o.sales_code
WHERE o.sales_code IS NOT NULL 
  AND o.sales_code != ''
  AND (o.primary_sales_id IS NULL AND o.secondary_sales_id IS NULL);

-- 2. 修复一级销售订单的关联
UPDATE orders o
SET primary_sales_id = ps.id
FROM primary_sales ps
WHERE o.sales_code = ps.sales_code
  AND o.sales_code LIKE 'PRI%'
  AND o.primary_sales_id IS NULL;

-- 3. 修复二级销售订单的关联
UPDATE orders o
SET secondary_sales_id = ss.id
FROM secondary_sales ss
WHERE o.sales_code = ss.sales_code
  AND o.sales_code LIKE 'SEC%'
  AND o.secondary_sales_id IS NULL;

-- 4. 验证修复结果
SELECT 
  COUNT(*) as total_orders_with_sales_code,
  COUNT(CASE WHEN primary_sales_id IS NOT NULL OR secondary_sales_id IS NOT NULL THEN 1 END) as orders_with_ids,
  COUNT(CASE WHEN primary_sales_id IS NULL AND secondary_sales_id IS NULL THEN 1 END) as orders_missing_ids
FROM orders
WHERE sales_code IS NOT NULL AND sales_code != '';

-- 5. 特别检查qq4073969的订单
SELECT 
  id,
  order_number,
  customer_wechat,
  sales_code,
  primary_sales_id,
  secondary_sales_id,
  status,
  amount
FROM orders 
WHERE customer_wechat = 'qq4073969';
