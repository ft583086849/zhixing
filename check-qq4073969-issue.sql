-- 查清qq4073969订单问题的根本原因

-- 1. 查看qq4073969的订单详情
SELECT 
  id,
  order_number,
  customer_wechat,
  sales_code,
  primary_sales_id,
  secondary_sales_id,
  amount,
  status,
  created_at
FROM orders 
WHERE customer_wechat = 'qq4073969';

-- 2. 关键问题：PRI17548273477088006这个销售代码存在吗？
SELECT 
  id,
  sales_code,
  wechat_name,
  created_at
FROM primary_sales 
WHERE sales_code = 'PRI17548273477088006';

-- 3. 如果不存在，搜索相似的
SELECT 
  id,
  sales_code,
  wechat_name,
  created_at
FROM primary_sales 
WHERE sales_code LIKE '%17548273477088006%'
   OR sales_code LIKE 'PRI175482734%';

-- 4. 查看所有PRI开头的销售代码（看看格式是否一致）
SELECT 
  sales_code,
  wechat_name,
  created_at
FROM primary_sales
ORDER BY created_at DESC
LIMIT 10;

-- 5. 如果销售存在，为什么订单没有关联上？
-- 检查是否是刚才UPDATE的结果
SELECT 
  o.id,
  o.order_number,
  o.sales_code,
  o.primary_sales_id,
  ps.id as should_be_id,
  ps.wechat_name
FROM orders o
LEFT JOIN primary_sales ps ON ps.sales_code = o.sales_code
WHERE o.customer_wechat = 'qq4073969';

-- 6. 查看订单创建时间vs销售注册时间
SELECT 
  'order' as type,
  order_number as identifier,
  created_at,
  sales_code
FROM orders 
WHERE customer_wechat = 'qq4073969'
UNION ALL
SELECT 
  'sales' as type,
  wechat_name as identifier,
  created_at,
  sales_code
FROM primary_sales 
WHERE sales_code = 'PRI17548273477088006'
ORDER BY created_at;
