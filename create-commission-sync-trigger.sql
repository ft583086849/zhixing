-- =====================================================
-- 创建触发器：同步佣金率到订单表
-- 当sales_optimized表的佣金率更新时，更新未来订单的佣金计算
-- =====================================================

-- 1. 创建函数：当新订单创建时，自动填充佣金率和佣金金额
CREATE OR REPLACE FUNCTION calculate_order_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate DECIMAL(5,4);
  v_sales_type VARCHAR(20);
BEGIN
  -- 如果订单被拒绝，佣金为0
  IF NEW.status = 'rejected' THEN
    NEW.commission_rate := 0;
    NEW.commission_amount := 0;
    NEW.secondary_commission_amount := 0;
    RETURN NEW;
  END IF;
  
  -- 从sales_optimized表获取销售的佣金率
  SELECT commission_rate, sales_type INTO v_commission_rate, v_sales_type
  FROM sales_optimized
  WHERE sales_code = NEW.sales_code;
  
  -- 如果找不到销售信息，使用默认值
  IF v_commission_rate IS NULL THEN
    IF v_sales_type = 'primary' THEN
      v_commission_rate := 0.4; -- 一级销售默认40%
    ELSE
      v_commission_rate := 0.25; -- 二级/独立销售默认25%
    END IF;
  END IF;
  
  -- 设置佣金率和计算佣金金额
  NEW.commission_rate := v_commission_rate;
  NEW.commission_amount := COALESCE(NEW.amount, 0) * v_commission_rate;
  
  -- 如果是二级销售的订单，计算一级销售的分成
  IF v_sales_type = 'secondary' THEN
    DECLARE
      v_parent_rate DECIMAL(5,4);
    BEGIN
      -- 获取一级销售的佣金率
      SELECT s1.commission_rate INTO v_parent_rate
      FROM sales_optimized s1
      JOIN sales_optimized s2 ON s1.sales_code = s2.parent_sales_code
      WHERE s2.sales_code = NEW.sales_code;
      
      IF v_parent_rate IS NOT NULL THEN
        -- 一级销售的分成 = 订单金额 * (一级佣金率 - 二级佣金率)
        NEW.secondary_commission_amount := COALESCE(NEW.amount, 0) * (v_parent_rate - v_commission_rate);
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建触发器：在订单插入或更新时计算佣金
DROP TRIGGER IF EXISTS trg_calculate_order_commission ON orders_optimized;
CREATE TRIGGER trg_calculate_order_commission
BEFORE INSERT OR UPDATE ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION calculate_order_commission();

-- 3. 创建函数：当销售佣金率更新时，更新未来订单
CREATE OR REPLACE FUNCTION update_future_orders_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- 只更新生效日期之后创建的订单
  UPDATE orders_optimized
  SET 
    commission_rate = NEW.commission_rate,
    commission_amount = amount * NEW.commission_rate,
    updated_at = NOW()
  WHERE sales_code = NEW.sales_code
    AND created_at >= NOW() -- 只影响未来的订单
    AND status != 'rejected';
  
  -- 如果是二级销售，还需要更新一级销售的分成
  IF NEW.sales_type = 'secondary' AND NEW.parent_sales_code IS NOT NULL THEN
    DECLARE
      v_parent_rate DECIMAL(5,4);
    BEGIN
      -- 获取一级销售的佣金率
      SELECT commission_rate INTO v_parent_rate
      FROM sales_optimized
      WHERE sales_code = NEW.parent_sales_code;
      
      IF v_parent_rate IS NOT NULL THEN
        UPDATE orders_optimized
        SET 
          secondary_commission_amount = amount * (v_parent_rate - NEW.commission_rate),
          updated_at = NOW()
        WHERE sales_code = NEW.sales_code
          AND created_at >= NOW()
          AND status != 'rejected';
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器：当sales_optimized表的佣金率更新时
DROP TRIGGER IF EXISTS trg_update_orders_commission ON sales_optimized;
CREATE TRIGGER trg_update_orders_commission
AFTER UPDATE OF commission_rate ON sales_optimized
FOR EACH ROW
WHEN (OLD.commission_rate IS DISTINCT FROM NEW.commission_rate)
EXECUTE FUNCTION update_future_orders_commission();

-- 5. 修复现有订单的佣金数据（一次性执行）
UPDATE orders_optimized o
SET 
  commission_rate = s.commission_rate,
  commission_amount = o.amount * s.commission_rate
FROM sales_optimized s
WHERE o.sales_code = s.sales_code
  AND o.status != 'rejected'
  AND (o.commission_rate IS NULL OR o.commission_rate = 0);

-- 6. 处理二级销售订单的一级分成
UPDATE orders_optimized o
SET 
  secondary_commission_amount = o.amount * (s1.commission_rate - s2.commission_rate)
FROM sales_optimized s2
JOIN sales_optimized s1 ON s1.sales_code = s2.parent_sales_code
WHERE o.sales_code = s2.sales_code
  AND s2.sales_type = 'secondary'
  AND o.status != 'rejected';

-- 查看修复结果
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN commission_rate > 0 THEN 1 END) as orders_with_commission,
  AVG(commission_rate) as avg_commission_rate
FROM orders_optimized
WHERE status != 'rejected';