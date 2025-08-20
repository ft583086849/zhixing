-- =====================================================
-- 从 orders_optimized 表重新计算 sales_optimized 表的数据
-- 正确处理一级销售的直销佣金和团队分成
-- =====================================================

-- 1. 先清空现有的统计数据
UPDATE sales_optimized SET
  total_orders = 0,
  total_amount = 0,
  total_commission = 0,
  primary_commission_amount = 0,
  secondary_commission_amount = 0,
  total_direct_orders = 0,
  total_direct_amount = 0,
  total_team_orders = 0,
  total_team_amount = 0;

-- 2. 从 orders_optimized 聚合每个销售的直销业绩
WITH direct_sales_stats AS (
  SELECT 
    sales_code,
    COUNT(*) as order_count,
    SUM(COALESCE(actual_payment_amount, amount, 0)) as total_amount,
    SUM(COALESCE(commission_amount, 0)) as commission_amount
  FROM orders_optimized
  WHERE sales_code IS NOT NULL
    AND status != 'rejected'
  GROUP BY sales_code
)
UPDATE sales_optimized s
SET 
  total_orders = d.order_count,
  total_amount = d.total_amount,
  total_direct_orders = d.order_count,
  total_direct_amount = d.total_amount,
  -- 直销佣金就是订单的 commission_amount
  primary_commission_amount = d.commission_amount,
  total_commission = d.commission_amount
FROM direct_sales_stats d
WHERE s.sales_code = d.sales_code;

-- 3. 计算一级销售的团队分成
-- 从二级销售的订单中，把 secondary_commission_amount 加给对应的一级销售
WITH team_commission_stats AS (
  SELECT 
    p.sales_code as primary_sales_code,
    COUNT(DISTINCT o.id) as team_orders,
    SUM(COALESCE(o.actual_payment_amount, o.amount, 0)) as team_amount,
    SUM(COALESCE(o.secondary_commission_amount, 0)) as team_commission
  FROM orders_optimized o
  JOIN secondary_sales s ON o.sales_code = s.sales_code
  JOIN primary_sales p ON s.primary_sales_id = p.id
  WHERE o.status != 'rejected'
    AND o.secondary_commission_amount > 0
  GROUP BY p.sales_code
)
UPDATE sales_optimized s
SET 
  total_team_orders = t.team_orders,
  total_team_amount = t.team_amount,
  -- 团队分成
  secondary_commission_amount = t.team_commission,
  -- 总佣金 = 直销佣金 + 团队分成
  total_commission = s.primary_commission_amount + t.team_commission
FROM team_commission_stats t
WHERE s.sales_code = t.primary_sales_code
  AND s.sales_type = 'primary';

-- 4. 更新团队人数（一级销售的下级数量）
WITH team_size_stats AS (
  SELECT 
    p.sales_code as primary_sales_code,
    COUNT(DISTINCT s.sales_code) as team_size
  FROM primary_sales p
  JOIN secondary_sales s ON s.primary_sales_id = p.id
  GROUP BY p.sales_code
)
UPDATE sales_optimized s
SET team_size = t.team_size
FROM team_size_stats t
WHERE s.sales_code = t.primary_sales_code
  AND s.sales_type = 'primary';

-- 5. 更新上级销售名称（给二级销售）
UPDATE sales_optimized s
SET parent_sales_name = p.wechat_name
FROM secondary_sales ss
JOIN primary_sales p ON ss.primary_sales_id = p.id
WHERE s.original_id = ss.id::uuid
  AND s.sales_type IN ('secondary', 'independent');

-- 6. 设置默认佣金率（如果没有设置）
UPDATE sales_optimized
SET commission_rate = CASE 
  WHEN sales_type = 'primary' THEN 0.4
  WHEN sales_type = 'independent' THEN 0.25
  ELSE 0.25
END
WHERE commission_rate IS NULL OR commission_rate = 0;

-- 7. 验证数据
SELECT 
  sales_type,
  COUNT(*) as count,
  SUM(total_orders) as total_orders,
  SUM(total_amount) as total_amount,
  SUM(primary_commission_amount) as direct_commission,
  SUM(secondary_commission_amount) as team_commission,
  SUM(total_commission) as total_commission
FROM sales_optimized
GROUP BY sales_type
ORDER BY sales_type;

-- 8. 显示一些一级销售的详细数据
SELECT 
  wechat_name,
  sales_type,
  total_orders,
  total_amount,
  total_direct_orders,
  total_direct_amount,
  primary_commission_amount as "直销佣金",
  total_team_orders,
  total_team_amount,
  secondary_commission_amount as "团队分成",
  total_commission as "总佣金",
  team_size
FROM sales_optimized
WHERE sales_type = 'primary'
ORDER BY total_commission DESC
LIMIT 5;

-- 9. 显示一些二级销售的详细数据
SELECT 
  wechat_name,
  sales_type,
  parent_sales_name,
  total_orders,
  total_amount,
  total_commission as "销售佣金"
FROM sales_optimized
WHERE sales_type IN ('secondary', 'independent')
ORDER BY total_commission DESC
LIMIT 5;