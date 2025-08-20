-- =====================================================
-- 修复触发器：确保rejected状态时清零所有佣金字段
-- =====================================================

-- 更新触发器函数，确保处理primary_commission_amount字段
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
    -- 如果变为拒绝状态，所有佣金字段都设为0
    IF NEW.status = 'rejected' THEN
      NEW.commission_rate := 0;
      NEW.commission_amount := 0;
      NEW.primary_commission_amount := 0;  -- 确保清零
      NEW.secondary_commission_amount := 0;
    -- 如果从拒绝状态变为confirmed_config，重新计算佣金
    ELSIF OLD.status = 'rejected' AND NEW.status = 'confirmed_config' AND NEW.amount > 0 THEN
      -- 获取销售信息
      SELECT commission_rate, sales_type, parent_sales_code 
      INTO v_commission_rate, v_sales_type, v_parent_sales_code
      FROM sales_optimized
      WHERE sales_code = NEW.sales_code;
      
      IF v_commission_rate IS NOT NULL THEN
        NEW.commission_rate := v_commission_rate;
        NEW.commission_amount := COALESCE(NEW.actual_payment_amount, NEW.amount) * v_commission_rate;
        NEW.primary_commission_amount := NEW.commission_amount; -- 同时设置
        
        -- 处理二级销售的分成
        IF v_sales_type = 'secondary' AND v_parent_sales_code IS NOT NULL THEN
          SELECT commission_rate INTO v_parent_rate
          FROM sales_optimized
          WHERE sales_code = v_parent_sales_code;
          
          IF v_parent_rate IS NOT NULL THEN
            NEW.secondary_commission_amount := COALESCE(NEW.actual_payment_amount, NEW.amount) * (v_parent_rate - v_commission_rate);
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 查看触发器是否存在
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'orders_optimized'
  AND trigger_name = 'trg_update_order_commission_on_status';

-- 手动修复订单141的错误数据
UPDATE orders_optimized
SET primary_commission_amount = 0
WHERE id = 141 AND status = 'rejected';

-- 验证修复结果
SELECT id, tradingview_username, status, 
       commission_amount, primary_commission_amount, secondary_commission_amount
FROM orders_optimized
WHERE id = 141;