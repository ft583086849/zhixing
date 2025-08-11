-- 查清niu001002003和guazigongshe的真实情况

-- 1. 他们的销售记录详情
SELECT 
  id,
  wechat_name,
  sales_code,
  created_at,
  commission_rate,
  (SELECT wechat_name FROM primary_sales WHERE id = secondary_sales.primary_sales_id) as primary_sales_name
FROM secondary_sales 
WHERE wechat_name IN ('niu001002003', 'guazigongshe');

-- 2. 他们作为销售的订单（自己卖东西）
SELECT 
  o.order_number,
  o.customer_wechat,
  o.sales_code,
  o.amount,
  o.status,
  o.created_at,
  '作为销售' as role
FROM orders o
JOIN secondary_sales ss ON o.sales_code = ss.sales_code
WHERE ss.wechat_name IN ('niu001002003', 'guazigongshe')
ORDER BY o.created_at;

-- 3. 他们作为客户的订单（自己买东西）
SELECT 
  o.order_number,
  o.customer_wechat,
  o.sales_code,
  o.amount,
  o.status,
  o.created_at,
  COALESCE(ps.wechat_name, ss.wechat_name) as sales_person,
  '作为客户' as role
FROM orders o
LEFT JOIN primary_sales ps ON o.sales_code = ps.sales_code
LEFT JOIN secondary_sales ss ON o.sales_code = ss.sales_code
WHERE o.customer_wechat IN ('niu001002003', 'guazigongshe')
ORDER BY o.created_at;

-- 4. 时间线分析
SELECT 
  event_time,
  event_type,
  person,
  details
FROM (
  -- 注册为销售的时间
  SELECT 
    created_at as event_time,
    '注册为销售' as event_type,
    wechat_name as person,
    CONCAT('销售代码: ', sales_code) as details
  FROM secondary_sales 
  WHERE wechat_name IN ('niu001002003', 'guazigongshe')
  
  UNION ALL
  
  -- 作为客户下单的时间
  SELECT 
    created_at as event_time,
    '客户下单' as event_type,
    customer_wechat as person,
    CONCAT('订单号: ', order_number, ', 金额: ', amount) as details
  FROM orders 
  WHERE customer_wechat IN ('niu001002003', 'guazigongshe')
  
  UNION ALL
  
  -- 作为销售出单的时间
  SELECT 
    o.created_at as event_time,
    '销售出单' as event_type,
    ss.wechat_name as person,
    CONCAT('客户: ', o.customer_wechat, ', 金额: ', o.amount) as details
  FROM orders o
  JOIN secondary_sales ss ON o.sales_code = ss.sales_code
  WHERE ss.wechat_name IN ('niu001002003', 'guazigongshe')
) timeline
ORDER BY event_time;
