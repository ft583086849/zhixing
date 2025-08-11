-- 调试一级销售对账页面的二级销售统计问题

-- 1. 确认WML792355703的基本信息
SELECT 
  id,
  wechat_name,
  sales_code,
  commission_rate
FROM primary_sales 
WHERE wechat_name = 'WML792355703';

-- 2. 查看他的所有二级销售
SELECT 
  ss.id,
  ss.wechat_name,
  ss.sales_code,
  ss.primary_sales_id,
  ss.commission_rate,
  ps.wechat_name as primary_name
FROM secondary_sales ss
LEFT JOIN primary_sales ps ON ps.id = ss.primary_sales_id
WHERE ss.primary_sales_id = (
  SELECT id FROM primary_sales WHERE wechat_name = 'WML792355703'
);

-- 3. 关键查询：fl261247的订单（模拟getPrimarySalesSettlement的查询）
SELECT 
  o.id,
  o.order_number,
  o.sales_code,
  o.status,
  o.amount,
  o.actual_payment_amount,
  o.customer_wechat,
  o.created_at,
  ss.wechat_name as sales_name
FROM orders o
JOIN secondary_sales ss ON o.sales_code = ss.sales_code
WHERE ss.wechat_name = 'fl261247';

-- 4. 检查确认订单的状态值
SELECT 
  ss.wechat_name,
  o.status,
  COUNT(*) as count,
  SUM(COALESCE(o.actual_payment_amount, o.amount, 0)) as total_amount
FROM secondary_sales ss
LEFT JOIN orders o ON o.sales_code = ss.sales_code
WHERE ss.primary_sales_id = (
  SELECT id FROM primary_sales WHERE wechat_name = 'WML792355703'
)
GROUP BY ss.wechat_name, o.status
ORDER BY ss.wechat_name, o.status;

-- 5. 直接计算二级销售统计（应该显示的值）
SELECT 
  ss.wechat_name,
  ss.commission_rate,
  COUNT(o.id) as total_orders,
  COUNT(CASE WHEN o.status IN ('confirmed', 'confirmed_config', 'confirmed_configuration', 'active') THEN 1 END) as confirmed_orders,
  SUM(CASE WHEN o.status IN ('confirmed', 'confirmed_config', 'confirmed_configuration', 'active') 
      THEN COALESCE(o.actual_payment_amount, o.amount, 0) ELSE 0 END) as confirmed_amount,
  SUM(CASE WHEN o.status IN ('confirmed', 'confirmed_config', 'confirmed_configuration', 'active') 
      THEN COALESCE(o.actual_payment_amount, o.amount, 0) * ss.commission_rate ELSE 0 END) as commission_amount
FROM secondary_sales ss
LEFT JOIN orders o ON o.sales_code = ss.sales_code
WHERE ss.primary_sales_id = (
  SELECT id FROM primary_sales WHERE wechat_name = 'WML792355703'
)
GROUP BY ss.id, ss.wechat_name, ss.commission_rate
ORDER BY ss.wechat_name;

-- 6. 计算一级销售的佣金明细（应该显示的值）
WITH secondary_stats AS (
  SELECT 
    SUM(CASE WHEN o.status IN ('confirmed', 'confirmed_config', 'confirmed_configuration', 'active') 
        THEN COALESCE(o.actual_payment_amount, o.amount, 0) ELSE 0 END) as total_amount,
    SUM(CASE WHEN o.status IN ('confirmed', 'confirmed_config', 'confirmed_configuration', 'active') 
        THEN COALESCE(o.actual_payment_amount, o.amount, 0) * ss.commission_rate ELSE 0 END) as total_commission,
    SUM(CASE WHEN o.status IN ('confirmed', 'confirmed_config', 'confirmed_configuration', 'active') 
        THEN COALESCE(o.actual_payment_amount, o.amount, 0) * ss.commission_rate ELSE 0 END) / 
    NULLIF(SUM(CASE WHEN o.status IN ('confirmed', 'confirmed_config', 'confirmed_configuration', 'active') 
        THEN COALESCE(o.actual_payment_amount, o.amount, 0) ELSE 0 END), 0) as avg_commission_rate
  FROM secondary_sales ss
  LEFT JOIN orders o ON o.sales_code = ss.sales_code
  WHERE ss.primary_sales_id = (
    SELECT id FROM primary_sales WHERE wechat_name = 'WML792355703'
  )
)
SELECT 
  total_amount as "二级销售订单总额",
  ROUND(avg_commission_rate * 100, 2) as "平均二级佣金率%",
  total_commission as "二级总佣金",
  total_amount * 0.4 as "二级订单40%收益",
  total_amount * 0.4 - total_commission as "二级佣金收益额（差额）"
FROM secondary_stats;
