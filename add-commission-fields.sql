-- 添加佣金拆分字段到 orders_optimized 表
-- 用于正确存储一级销售和二级销售的佣金

-- 1. 添加新字段
ALTER TABLE orders_optimized 
ADD COLUMN IF NOT EXISTS primary_commission_amount DECIMAL(10,2) DEFAULT 0 COMMENT '一级销售佣金金额',
ADD COLUMN IF NOT EXISTS secondary_commission_amount DECIMAL(10,2) DEFAULT 0 COMMENT '二级销售佣金金额',
ADD COLUMN IF NOT EXISTS secondary_commission_rate DECIMAL(5,4) DEFAULT 0.25 COMMENT '二级销售佣金率';

-- 2. 更新现有订单的佣金字段
UPDATE orders_optimized 
SET 
    -- 一级销售直接销售：一级拿40%
    primary_commission_amount = CASE 
        WHEN sales_type = 'primary' THEN amount * 0.4
        -- 二级销售销售：一级拿 (40% - 二级佣金率)
        WHEN sales_type = 'secondary' THEN amount * (0.4 - COALESCE(commission_rate, 0.25))
        -- 独立销售：无一级佣金
        ELSE 0
    END,
    
    -- 二级销售佣金
    secondary_commission_amount = CASE 
        -- 一级销售直接销售：无二级佣金
        WHEN sales_type = 'primary' THEN 0
        -- 二级销售销售：二级拿自己的佣金率
        WHEN sales_type = 'secondary' THEN amount * COALESCE(commission_rate, 0.25)
        -- 独立销售：拿全部40%
        WHEN sales_type = 'independent' THEN amount * 0.4
        ELSE 0
    END,
    
    -- 二级销售佣金率（用于记录）
    secondary_commission_rate = CASE 
        WHEN sales_type = 'secondary' OR sales_type = 'independent' 
        THEN COALESCE(commission_rate, 0.25)
        ELSE 0
    END
WHERE amount IS NOT NULL AND amount > 0;

-- 3. 创建触发器，自动计算新订单的佣金
CREATE OR REPLACE FUNCTION calculate_commission_split()
RETURNS TRIGGER AS $$
BEGIN
    -- 根据销售类型计算佣金拆分
    IF NEW.sales_type = 'primary' THEN
        -- 一级销售直接销售
        NEW.primary_commission_amount := NEW.amount * 0.4;
        NEW.secondary_commission_amount := 0;
        
    ELSIF NEW.sales_type = 'secondary' THEN
        -- 二级销售销售
        NEW.secondary_commission_rate := COALESCE(NEW.commission_rate, 0.25);
        NEW.secondary_commission_amount := NEW.amount * NEW.secondary_commission_rate;
        NEW.primary_commission_amount := NEW.amount * (0.4 - NEW.secondary_commission_rate);
        
    ELSIF NEW.sales_type = 'independent' THEN
        -- 独立销售
        NEW.primary_commission_amount := 0;
        NEW.secondary_commission_amount := NEW.amount * 0.4;
        NEW.secondary_commission_rate := 0.4;
        
    ELSE
        -- 默认情况
        NEW.primary_commission_amount := 0;
        NEW.secondary_commission_amount := 0;
    END IF;
    
    -- 更新总佣金金额（保持兼容）
    NEW.commission_amount := NEW.primary_commission_amount + NEW.secondary_commission_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器
DROP TRIGGER IF EXISTS trg_calculate_commission ON orders_optimized;
CREATE TRIGGER trg_calculate_commission
BEFORE INSERT OR UPDATE OF amount, sales_type, commission_rate
ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION calculate_commission_split();

-- 5. 验证更新结果
SELECT 
    id,
    tradingview_username,
    sales_type,
    amount,
    commission_rate,
    primary_commission_amount,
    secondary_commission_amount,
    secondary_commission_rate,
    commission_amount as total_commission
FROM orders_optimized
WHERE amount > 0
ORDER BY created_at DESC
LIMIT 10;