-- =====================================================
-- 完整修复：确保佣金计算逻辑正确
-- 核心原则：只有 confirmed_config 状态的订单才有佣金
-- =====================================================

-- 1. 更新订单状态变更触发器函数
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
      
      -- 如果找不到销售信息，使用默认值
      IF v_commission_rate IS NULL THEN
        IF v_sales_type = 'primary' THEN
          v_commission_rate := 0.4; -- 一级销售默认40%
        ELSE
          v_commission_rate := 0.25; -- 二级/独立销售默认25%
        END IF;
      END IF;
      
      -- 设置佣金率
      NEW.commission_rate := v_commission_rate;
      
      -- 计算佣金
      IF v_sales_type = 'primary' THEN
        -- 一级销售
        NEW.commission_amount := v_amount * v_commission_rate;
        NEW.primary_commission_amount := NEW.commission_amount;
        NEW.secondary_commission_amount := 0;
        
      ELSIF v_sales_type = 'secondary' AND v_parent_sales_code IS NOT NULL THEN
        -- 二级销售
        NEW.commission_amount := v_amount * v_commission_rate;
        
        -- 获取一级销售的佣金率
        SELECT commission_rate INTO v_parent_rate
        FROM sales_optimized
        WHERE sales_code = v_parent_sales_code;
        
        IF v_parent_rate IS NOT NULL AND v_parent_rate > v_commission_rate THEN
          -- 一级销售的分成
          NEW.primary_commission_amount := v_amount * (v_parent_rate - v_commission_rate);
          NEW.secondary_commission_amount := NEW.primary_commission_amount;
        ELSE
          NEW.primary_commission_amount := 0;
          NEW.secondary_commission_amount := 0;
        END IF;
        
      ELSE
        -- 独立销售
        NEW.commission_amount := v_amount * v_commission_rate;
        NEW.primary_commission_amount := NEW.commission_amount;
        NEW.secondary_commission_amount := 0;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 确保触发器存在并正确配置
DROP TRIGGER IF EXISTS trg_update_order_commission_on_status ON orders_optimized;
CREATE TRIGGER trg_update_order_commission_on_status
BEFORE UPDATE OF status ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION update_order_commission_on_status_change();

-- 3. 修复所有现有的问题订单
-- 将所有非confirmed_config状态的订单佣金清零
UPDATE orders_optimized
SET 
  commission_rate = 0,
  commission_amount = 0,
  primary_commission_amount = 0,
  secondary_commission_amount = 0
WHERE status != 'confirmed_config'
  AND (
    commission_rate > 0 OR
    commission_amount > 0 OR
    primary_commission_amount > 0 OR
    secondary_commission_amount > 0
  );

-- 4. 验证修复结果
SELECT 
  'Orders with incorrect commission' as check_type,
  COUNT(*) as count
FROM orders_optimized
WHERE status != 'confirmed_config'
  AND (
    commission_rate > 0 OR
    commission_amount > 0 OR
    primary_commission_amount > 0 OR
    secondary_commission_amount > 0
  )
UNION ALL
SELECT 
  'Total non-confirmed orders' as check_type,
  COUNT(*) as count
FROM orders_optimized
WHERE status != 'confirmed_config'
UNION ALL
SELECT 
  'Total confirmed orders' as check_type,
  COUNT(*) as count
FROM orders_optimized
WHERE status = 'confirmed_config';

-- 5. 查看具体修复的订单
SELECT 
  id,
  tradingview_username,
  status,
  amount,
  commission_rate,
  commission_amount,
  primary_commission_amount,
  secondary_commission_amount
FROM orders_optimized
WHERE id IN (2, 141);