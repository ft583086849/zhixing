-- 直接在Supabase SQL编辑器中执行此查询
-- 检查订单ID 72是否存在以及其详细信息

-- 1. 查询订单ID 72
SELECT 
  id,
  customer_wechat,
  tradingview_username,
  sales_code,
  status,
  amount,
  actual_payment_amount,
  commission_amount,
  created_at,
  updated_at,
  is_reminded,
  payment_method,
  duration
FROM orders
WHERE id = 72;

-- 2. 查询所有包含"直接购买"的订单
SELECT 
  id,
  customer_wechat,
  tradingview_username,
  sales_code,
  status,
  amount,
  created_at
FROM orders
WHERE customer_wechat LIKE '%直接购买%'
ORDER BY id DESC;

-- 3. 查询所有包含"89"的客户订单
SELECT 
  id,
  customer_wechat,
  tradingview_username,
  sales_code,
  status,
  amount,
  created_at
FROM orders
WHERE customer_wechat LIKE '%89%'
ORDER BY id DESC
LIMIT 20;

-- 4. 统计不同状态的订单数量
SELECT 
  status,
  COUNT(*) as count
FROM orders
WHERE customer_wechat LIKE '%直接购买%'
   OR customer_wechat LIKE '%89%'
GROUP BY status
ORDER BY count DESC;

-- 5. 检查是否有重复的customer_wechat
SELECT 
  customer_wechat,
  tradingview_username,
  COUNT(*) as order_count,
  STRING_AGG(id::text, ', ') as order_ids,
  STRING_AGG(status, ', ') as statuses
FROM orders
WHERE customer_wechat = '89一级下的直接购买'
GROUP BY customer_wechat, tradingview_username
HAVING COUNT(*) > 0;




