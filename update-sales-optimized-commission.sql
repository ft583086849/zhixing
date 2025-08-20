-- =====================================================
-- 更新sales_optimized表的佣金统计
-- 使用实付金额（actual_payment_amount）重新计算
-- =====================================================

-- 1. 重置所有销售的统计数据
UPDATE sales_optimized
SET 
  total_orders = 0,
  total_amount = 0,
  total_direct_orders = 0,
  total_direct_amount = 0,
  total_team_orders = 0,
  total_team_amount = 0,
  primary_commission_amount = 0,
  secondary_commission_amount = 0,
  total_commission = 0;

-- 2. 更新直销统计（一级销售和独立销售的直接订单）
WITH direct_stats AS (
  SELECT 
    o.sales_code,
    COUNT(*) as order_count,
    -- 使用实付金额，如果没有则使用订单金额
    SUM(COALESCE(o.actual_payment_amount, o.amount, 0)) as total_amount
  FROM orders_optimized o
  WHERE o.status = 'confirmed_config'
  GROUP BY o.sales_code
)
UPDATE sales_optimized s
SET 
  total_orders = direct_stats.order_count,
  total_amount = direct_stats.total_amount,
  total_direct_orders = direct_stats.order_count,
  total_direct_amount = direct_stats.total_amount,
  -- 直销佣金 = 实付金额 × 佣金率
  primary_commission_amount = direct_stats.total_amount * s.commission_rate,
  total_commission = direct_stats.total_amount * s.commission_rate
FROM direct_stats
WHERE s.sales_code = direct_stats.sales_code;

-- 3. 更新一级销售的团队统计
WITH team_stats AS (
  SELECT 
    s2.parent_sales_code,
    COUNT(DISTINCT o.id) as team_orders,
    -- 使用实付金额计算团队销售额
    SUM(COALESCE(o.actual_payment_amount, o.amount, 0)) as team_amount,
    -- 计算团队佣金率的加权平均（用于显示平均二级佣金率）
    SUM(COALESCE(o.actual_payment_amount, o.amount, 0) * s2.commission_rate) / NULLIF(SUM(COALESCE(o.actual_payment_amount, o.amount, 0)), 0) as avg_team_rate
  FROM orders_optimized o
  JOIN sales_optimized s2 ON o.sales_code = s2.sales_code
  WHERE s2.parent_sales_code IS NOT NULL
    AND o.status = 'confirmed_config'
  GROUP BY s2.parent_sales_code
)
UPDATE sales_optimized s1
SET 
  total_team_orders = team_stats.team_orders,
  total_team_amount = team_stats.team_amount,
  team_size = (
    SELECT COUNT(*) 
    FROM sales_optimized 
    WHERE parent_sales_code = s1.sales_code
  ),
  -- 一级从团队获得的分销佣金 = 团队销售额 × (一级佣金率 - 平均二级佣金率)
  secondary_commission_amount = team_stats.team_amount * (s1.commission_rate - COALESCE(team_stats.avg_team_rate, 0.25)),
  -- 总佣金 = 直销佣金 + 分销佣金
  total_commission = s1.primary_commission_amount + team_stats.team_amount * (s1.commission_rate - COALESCE(team_stats.avg_team_rate, 0.25))
FROM team_stats
WHERE s1.sales_code = team_stats.parent_sales_code;

-- 4. 精确计算每个一级销售的分销佣金（按实际佣金率差额）
WITH team_commission AS (
  SELECT 
    s1.sales_code as parent_code,
    SUM(
      COALESCE(o.actual_payment_amount, o.amount, 0) * (s1.commission_rate - s2.commission_rate)
    ) as team_commission
  FROM orders_optimized o
  JOIN sales_optimized s2 ON o.sales_code = s2.sales_code
  JOIN sales_optimized s1 ON s2.parent_sales_code = s1.sales_code
  WHERE o.status = 'confirmed_config'
    AND s2.sales_type = 'secondary'
  GROUP BY s1.sales_code
)
UPDATE sales_optimized s
SET 
  secondary_commission_amount = tc.team_commission,
  total_commission = s.primary_commission_amount + tc.team_commission
FROM team_commission tc
WHERE s.sales_code = tc.parent_code;

-- 5. 查看更新结果
SELECT 
  sales_type,
  COUNT(*) as count,
  SUM(total_orders) as total_orders,
  SUM(total_amount) as total_amount,
  SUM(primary_commission_amount) as primary_commission,
  SUM(secondary_commission_amount) as secondary_commission,
  SUM(total_commission) as total_commission
FROM sales_optimized
GROUP BY sales_type
ORDER BY sales_type;

-- 6. 查看一级销售的详细数据（示例）
SELECT 
  wechat_name,
  sales_code,
  commission_rate,
  total_direct_orders,
  total_direct_amount,
  total_team_orders,
  total_team_amount,
  primary_commission_amount as direct_commission,
  secondary_commission_amount as team_commission,
  total_commission
FROM sales_optimized
WHERE sales_type = 'primary'
  AND (total_direct_amount > 0 OR total_team_amount > 0)
ORDER BY total_commission DESC
LIMIT 10;