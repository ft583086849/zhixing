-- 分析为什么订单有sales_code但没有primary_sales_id

-- 1. 查看订单和销售的创建时间对比
SELECT 
  'Yii11111销售创建' as event,
  '2025-08-10 12:02:27' as time,
  'PRI17548273477088006' as sales_code
UNION ALL
SELECT 
  'qq4073969订单创建' as event,
  '2025-08-11 08:05:02' as time,
  'PRI17548273477088006' as sales_code
ORDER BY time;

-- 2. 查看数据库中primary_sales_id字段的使用情况
SELECT 
  COUNT(*) as total_orders,
  COUNT(sales_code) as with_sales_code,
  COUNT(primary_sales_id) as with_primary_id,
  COUNT(secondary_sales_id) as with_secondary_id,
  COUNT(CASE WHEN sales_code IS NOT NULL AND primary_sales_id IS NULL AND secondary_sales_id IS NULL THEN 1 END) as code_but_no_id
FROM orders;

-- 3. 查看有sales_code但没有ID的订单的创建时间分布
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as count,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM orders
WHERE sales_code IS NOT NULL 
  AND primary_sales_id IS NULL 
  AND secondary_sales_id IS NULL
GROUP BY DATE(created_at)
ORDER BY order_date;

-- 4. 查看具体是哪些订单有这个问题
SELECT 
  order_number,
  customer_wechat,
  sales_code,
  created_at,
  status
FROM orders
WHERE sales_code = 'PRI17548273477088006'
ORDER BY created_at;

-- 5. 检查是否是特定sales_code的问题
SELECT 
  sales_code,
  COUNT(*) as order_count,
  COUNT(primary_sales_id) as with_id_count,
  COUNT(primary_sales_id) * 100.0 / COUNT(*) as id_rate
FROM orders
WHERE sales_code IS NOT NULL
GROUP BY sales_code
HAVING COUNT(*) > 0
ORDER BY id_rate;
