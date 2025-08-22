-- =====================================================
-- 创建触发器：自动计算新订单的佣金
-- 当新订单插入时，自动从sales_optimized表获取佣金率
-- =====================================================

-- 1. 创建函数：计算订单佣金
CREATE OR REPLACE FUNCTION calculate_order_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate DECIMAL(5,4);
  v_sales_type VARCHAR(20);
  v_parent_sales_code VARCHAR(50);
  v_parent_rate DECIMAL(5,4);
BEGIN
  -- 只有配置成功且有实付金额的订单才有佣金
  -- 其他状态（pending_payment, pending_config, rejected）都没有佣金
  -- 使用实付金额（actual_payment_amount）计算，如果没有则使用订单金额（amount）
  IF NEW.status != 'confirmed_config' OR COALESCE(NEW.actual_payment_amount, NEW.amount, 0) = 0 THEN
    NEW.commission_rate := 0;
    NEW.commission_amount := 0;
    NEW.secondary_commission_amount := 0;
    RETURN NEW;
  END IF;
  /
  -- 从sales_optimized表获取销售信息
  SELECT commission_rate, sales_type, parent_sales_code 
  INTO v_commission_rate, v_sales_type, v_parent_sales_code
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
  
  -- 设置佣金率和计算佣金金额（使用实付金额，如果没有则使用订单金额）
  NEW.commission_rate := v_commission_rate;
  NEW.commission_amount := COALESCE(NEW.actual_payment_amount, NEW.amount, 0) * v_commission_rate;
  
  -- 如果是二级销售的订单，计算一级销售的分成
  IF v_sales_type = 'secondary' AND v_parent_sales_code IS NOT NULL THEN
    -- 获取一级销售的佣金率
    SELECT commission_rate INTO v_parent_rate
    FROM sales_optimized
    WHERE sales_code = v_parent_sales_code;
    
    IF v_parent_rate IS NOT NULL THEN
      -- 一级销售的分成 = 实付金额 * (一级佣金率 - 二级佣金率)
      NEW.secondary_commission_amount := COALESCE(NEW.actual_payment_amount, NEW.amount, 0) * (v_parent_rate - v_commission_rate);
    ELSE
      NEW.secondary_commission_amount := 0;
    END IF;
  ELSE
    NEW.secondary_commission_amount := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建触发器：在订单插入时计算佣金
DROP TRIGGER IF EXISTS trg_calculate_order_commission ON orders_optimized;
CREATE TRIGGER trg_calculate_order_commission
BEFORE INSERT ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION calculate_order_commission();

-- 3. 创建触发器：在订单状态更新时重新计算佣金
CREATE OR REPLACE FUNCTION update_order_commission_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate DECIMAL(5,4);
  v_sales_type VARCHAR(20);
  v_parent_sales_code VARCHAR(50);
  v_parent_rate DECIMAL(5,4);
BEGIN
  -- 只在状态变化时处理
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- 如果变为拒绝状态，佣金设为0
    IF NEW.status = 'rejected' THEN
      NEW.commission_rate := 0;
      NEW.commission_amount := 0;
      NEW.secondary_commission_amount := 0;
    -- 如果从拒绝状态变为其他状态，重新计算佣金
    ELSIF OLD.status = 'rejected' AND NEW.status != 'rejected' AND NEW.amount > 0 THEN
      -- 获取销售信息
      SELECT commission_rate, sales_type, parent_sales_code 
      INTO v_commission_rate, v_sales_type, v_parent_sales_code
      FROM sales_optimized
      WHERE sales_code = NEW.sales_code;
      
      IF v_commission_rate IS NOT NULL THEN
        NEW.commission_rate := v_commission_rate;
        NEW.commission_amount := NEW.amount * v_commission_rate;
        
        -- 处理二级销售的分成
        IF v_sales_type = 'secondary' AND v_parent_sales_code IS NOT NULL THEN
          SELECT commission_rate INTO v_parent_rate
          FROM sales_optimized
          WHERE sales_code = v_parent_sales_code;
          
          IF v_parent_rate IS NOT NULL THEN
            NEW.secondary_commission_amount := NEW.amount * (v_parent_rate - v_commission_rate);
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器：在订单状态更新时
DROP TRIGGER IF EXISTS trg_update_order_commission_on_status ON orders_optimized;
CREATE TRIGGER trg_update_order_commission_on_status
BEFORE UPDATE OF status ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION update_order_commission_on_status_change();

-- 5. 验证触发器是否创建成功
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'orders_optimized'
ORDER BY trigger_name;