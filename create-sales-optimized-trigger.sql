-- =====================================================
-- 创建触发器：自动更新 sales_optimized 表
-- 当 orders_optimized 表有变化时自动重新计算销售统计
-- =====================================================

-- 1. 创建更新销售统计的函数
CREATE OR REPLACE FUNCTION update_sales_optimized_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_sales_code VARCHAR(50);
  v_parent_sales_code VARCHAR(50);
BEGIN
  -- 获取受影响的销售代码
  IF TG_OP = 'DELETE' THEN
    v_sales_code := OLD.sales_code;
  ELSE
    v_sales_code := NEW.sales_code;
  END IF;
  
  -- 如果销售代码为空，直接返回
  IF v_sales_code IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- 更新该销售的直销统计
  WITH direct_stats AS (
    SELECT 
      COUNT(*) as order_count,
      COALESCE(SUM(COALESCE(actual_payment_amount, amount, 0)), 0) as total_amount,
      COALESCE(SUM(COALESCE(commission_amount, 0)), 0) as commission_amount
    FROM orders_optimized
    WHERE sales_code = v_sales_code
      AND status != 'rejected'
  )
  UPDATE sales_optimized
  SET 
    total_orders = direct_stats.order_count,
    total_amount = direct_stats.total_amount,
    total_direct_orders = direct_stats.order_count,
    total_direct_amount = direct_stats.total_amount,
    primary_commission_amount = direct_stats.commission_amount,
    updated_at = NOW()
  FROM direct_stats
  WHERE sales_optimized.sales_code = v_sales_code;
  
  -- 获取该销售的上级（如果是二级销售）
  SELECT parent_sales_code INTO v_parent_sales_code
  FROM sales_optimized
  WHERE sales_code = v_sales_code;
  
  -- 如果有上级，更新上级的团队统计
  IF v_parent_sales_code IS NOT NULL THEN
    WITH team_stats AS (
      SELECT 
        COUNT(DISTINCT o.id) as team_orders,
        COALESCE(SUM(COALESCE(o.actual_payment_amount, o.amount, 0)), 0) as team_amount,
        COALESCE(SUM(COALESCE(o.secondary_commission_amount, 0)), 0) as team_commission
      FROM orders_optimized o
      JOIN sales_optimized s ON o.sales_code = s.sales_code
      WHERE s.parent_sales_code = v_parent_sales_code
        AND o.status != 'rejected'
    )
    UPDATE sales_optimized
    SET 
      total_team_orders = team_stats.team_orders,
      total_team_amount = team_stats.team_amount,
      secondary_commission_amount = team_stats.team_commission,
      updated_at = NOW()
    FROM team_stats
    WHERE sales_optimized.sales_code = v_parent_sales_code;
    
    -- 更新上级的总佣金
    UPDATE sales_optimized
    SET total_commission = COALESCE(primary_commission_amount, 0) + COALESCE(secondary_commission_amount, 0)
    WHERE sales_code = v_parent_sales_code;
  END IF;
  
  -- 更新当前销售的总佣金
  UPDATE sales_optimized
  SET total_commission = COALESCE(primary_commission_amount, 0) + COALESCE(secondary_commission_amount, 0)
  WHERE sales_code = v_sales_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建触发器
DROP TRIGGER IF EXISTS trigger_update_sales_optimized ON orders_optimized;

CREATE TRIGGER trigger_update_sales_optimized
AFTER INSERT OR UPDATE OR DELETE ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION update_sales_optimized_stats();

-- 3. 创建批量更新函数（用于初始化或批量重算）
CREATE OR REPLACE FUNCTION recalculate_all_sales_optimized()
RETURNS void AS $$
BEGIN
  -- 清空现有统计
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
  
  -- 重新计算直销统计
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
    primary_commission_amount = d.commission_amount,
    total_commission = d.commission_amount
  FROM direct_sales_stats d
  WHERE s.sales_code = d.sales_code;
  
  -- 重新计算团队统计（一级销售）
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
    secondary_commission_amount = t.team_commission,
    total_commission = s.primary_commission_amount + t.team_commission,
    total_orders = s.total_direct_orders + t.team_orders,
    total_amount = s.total_direct_amount + t.team_amount
  FROM team_commission_stats t
  WHERE s.sales_code = t.primary_sales_code
    AND s.sales_type = 'primary';
  
  -- 更新团队人数
  WITH team_size_stats AS (
    SELECT 
      parent_sales_code,
      COUNT(*) as team_size
    FROM sales_optimized
    WHERE parent_sales_code IS NOT NULL
    GROUP BY parent_sales_code
  )
  UPDATE sales_optimized s
  SET team_size = t.team_size
  FROM team_size_stats t
  WHERE s.sales_code = t.parent_sales_code;
  
END;
$$ LANGUAGE plpgsql;

-- 4. 执行初始化（重新计算所有数据）
SELECT recalculate_all_sales_optimized();

-- 5. 验证触发器是否创建成功
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgtype as trigger_type,
  tgenabled as is_enabled
FROM pg_trigger
WHERE tgname = 'trigger_update_sales_optimized';