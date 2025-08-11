-- 调查错误销售记录的来源

-- 1. 查看niu001002003和guazigongshe的完整销售记录
SELECT 
  id,
  sales_code,
  wechat_name,
  primary_sales_id,
  commission_rate,
  created_at,
  payment_address
FROM secondary_sales 
WHERE wechat_name IN ('niu001002003', 'guazigongshe');

-- 2. 查看他们作为销售的订单（销售身份）
SELECT 
  o.id,
  o.order_number,
  o.customer_wechat,
  o.sales_code,
  o.amount,
  o.status,
  o.created_at,
  ss.wechat_name as sales_name
FROM orders o
JOIN secondary_sales ss ON o.sales_code = ss.sales_code
WHERE ss.wechat_name IN ('niu001002003', 'guazigongshe');

-- 3. 查看他们作为客户的订单（客户身份）
SELECT 
  id,
  order_number,
  customer_wechat,
  sales_code,
  amount,
  status,
  created_at
FROM orders 
WHERE customer_wechat IN ('niu001002003', 'guazigongshe')
ORDER BY created_at;

-- 4. 分析时间线 - 他们是什么时候注册为销售的
SELECT 
  'secondary_sales' as source,
  wechat_name,
  created_at,
  sales_code
FROM secondary_sales 
WHERE wechat_name IN ('niu001002003', 'guazigongshe')
UNION ALL
SELECT 
  'orders_as_customer' as source,
  customer_wechat as wechat_name,
  created_at,
  'customer_order' as sales_code
FROM orders 
WHERE customer_wechat IN ('niu001002003', 'guazigongshe')
ORDER BY created_at;

-- 5. 检查PRI17548273477088006这个一级销售代码
SELECT 
  id,
  sales_code,
  wechat_name,
  created_at
FROM primary_sales 
WHERE sales_code = 'PRI17548273477088006';

-- 6. 查看使用PRI17548273477088006的订单
SELECT 
  id,
  order_number,
  customer_wechat,
  sales_code,
  primary_sales_id,
  secondary_sales_id,
  amount,
  status
FROM orders 
WHERE sales_code = 'PRI17548273477088006';
