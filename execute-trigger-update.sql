-- =====================================================
-- 修复触发器：确保佣金计算逻辑正确
-- 核心原则：只有 confirmed_config 状态的订单才有佣金
-- 执行时间：2025/8/19 12:57:45
-- =====================================================

-- 1. 更新触发器函数
CREATE OR REPLACE FUNCTION update_order_commission_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate DECIMAL(5,4);
  v_sales_type VARCHAR(20);
  v_parent_sales_code VARCHAR(50);
  v_parent_rate DECIMAL(5,4);
  v_amount DECIMAL(10,2);
BEGIN
  -- 只在状态变化时处理
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- 计算使用的金额（优先使用实付金额）
    v_amount := COALESCE(NEW.actual_payment_amount, NEW.amount, 0);
    
    -- 状态不是 confirmed_config，所有佣金字段都清零
    IF NEW.status != 'confirmed_config' THEN
      NEW.commission_rate := 0;
      NEW.commission_amount := 0;
      NEW.primary_commission_amount := 0;
      NEW.secondary_commission_amount := 0;
      
    -- 状态变为 confirmed_config，计算佣金
    ELSIF NEW.status = 'confirmed_config' AND v_amount > 0 THEN
      -- 获取销售信息
      SELECT commission_rate, sales_type, parent_sales_code 
      INTO v_commission_rate, v_sales_type, v_parent_sales_code
      FROM sales_optimized
      WHERE sales_code = NEW.sales_code;
      
      -- 如果找到销售信息
      IF v_commission_rate IS NOT NULL THEN
        -- 设置佣金率
        NEW.commission_rate := v_commission_rate;
        
        -- 根据销售类型计算佣金
        IF v_sales_type = 'primary' THEN
          -- 一级销售：所有佣金归自己
          NEW.commission_amount := v_amount * v_commission_rate;
          NEW.primary_commission_amount := NEW.commission_amount;
          NEW.secondary_commission_amount := 0;
          
        ELSIF v_sales_type = 'secondary' AND v_parent_sales_code IS NOT NULL THEN
          -- 二级销售：需要给上级分成
          NEW.commission_amount := v_amount * v_commission_rate;
          
          -- 获取一级销售的佣金率
          SELECT commission_rate INTO v_parent_rate
          FROM sales_optimized
          WHERE sales_code = v_parent_sales_code;
          
          IF v_parent_rate IS NOT NULL AND v_parent_rate > v_commission_rate THEN
            -- 一级销售的分成 = 订单金额 * (一级佣金率 - 二级佣金率)
            NEW.primary_commission_amount := v_amount * (v_parent_rate - v_commission_rate);
            NEW.secondary_commission_amount := NEW.primary_commission_amount;
          ELSE
            NEW.primary_commission_amount := 0;
            NEW.secondary_commission_amount := 0;
          END IF;
          
        ELSE
          -- 独立销售：所有佣金归自己
          NEW.commission_amount := v_amount * v_commission_rate;
          NEW.primary_commission_amount := NEW.commission_amount;
          NEW.secondary_commission_amount := 0;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 重建触发器
DROP TRIGGER IF EXISTS trg_update_order_commission_on_status ON orders_optimized;
CREATE TRIGGER trg_update_order_commission_on_status
BEFORE UPDATE OF status ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION update_order_commission_on_status_change();

-- 3. 验证触发器创建成功
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders_optimized'
  AND trigger_name = 'trg_update_order_commission_on_status'
ORDER BY trigger_name;

-- 4. 测试说明
-- 执行完成后，可以测试：
-- UPDATE orders_optimized SET status = 'rejected' WHERE id = [某个测试订单ID];
-- 检查该订单的所有佣金字段是否都变为0