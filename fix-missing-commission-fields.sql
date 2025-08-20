-- 修复 sales_optimized 表缺少的佣金字段
-- 这些字段是佣金系统 v2.0 必需的

-- 检查当前表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_optimized' 
ORDER BY ordinal_position;

-- 添加缺失的佣金字段
-- 如果字段已存在，会忽略错误

-- 1. 直销佣金字段
ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS direct_commission DECIMAL(10,2) DEFAULT 0;
COMMENT ON COLUMN sales_optimized.direct_commission IS '直销佣金额';

-- 2. 平均二级佣金率字段  
ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS secondary_avg_rate DECIMAL(5,4) DEFAULT 0;
COMMENT ON COLUMN sales_optimized.secondary_avg_rate IS '平均二级佣金率';

-- 3. 二级佣金收益字段
ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS secondary_share_commission DECIMAL(10,2) DEFAULT 0;
COMMENT ON COLUMN sales_optimized.secondary_share_commission IS '二级佣金收益额';

-- 4. 二级销售订单总额字段
ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS secondary_orders_amount DECIMAL(10,2) DEFAULT 0;
COMMENT ON COLUMN sales_optimized.secondary_orders_amount IS '二级销售订单总额';

-- 5. 直销订单金额字段
ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS direct_orders_amount DECIMAL(10,2) DEFAULT 0;
COMMENT ON COLUMN sales_optimized.direct_orders_amount IS '直销订单金额';

-- 6. 基础佣金率字段（固定40%）
ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS base_commission_rate DECIMAL(5,4) DEFAULT 0.4;
COMMENT ON COLUMN sales_optimized.base_commission_rate IS '基础佣金率（固定40%）';

-- 7. 动态佣金率字段
ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS dynamic_commission_rate DECIMAL(5,4) DEFAULT 0.4;
COMMENT ON COLUMN sales_optimized.dynamic_commission_rate IS '动态计算佣金率';

-- 8. 月度直销佣金
ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS month_direct_commission DECIMAL(10,2) DEFAULT 0;
COMMENT ON COLUMN sales_optimized.month_direct_commission IS '本月直销佣金';

-- 9. 月度分销收益
ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS month_share_commission DECIMAL(10,2) DEFAULT 0;
COMMENT ON COLUMN sales_optimized.month_share_commission IS '本月分销收益';

-- 10. 当日直销佣金
ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS today_direct_commission DECIMAL(10,2) DEFAULT 0;
COMMENT ON COLUMN sales_optimized.today_direct_commission IS '当日直销佣金';

-- 11. 当日分销收益
ALTER TABLE sales_optimized ADD COLUMN IF NOT EXISTS today_share_commission DECIMAL(10,2) DEFAULT 0;
COMMENT ON COLUMN sales_optimized.today_share_commission IS '当日分销收益';

-- 验证字段是否添加成功
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_optimized' 
AND column_name IN (
    'direct_commission',
    'secondary_avg_rate', 
    'secondary_share_commission',
    'secondary_orders_amount',
    'direct_orders_amount',
    'base_commission_rate',
    'dynamic_commission_rate',
    'month_direct_commission',
    'month_share_commission', 
    'today_direct_commission',
    'today_share_commission'
)
ORDER BY column_name;

-- 为一级销售计算并更新这些字段的初始值
-- 注意：这个更新操作可能需要一些时间，建议在低峰期执行

UPDATE sales_optimized 
SET 
    direct_commission = COALESCE(total_amount * 0.4, 0),
    direct_orders_amount = COALESCE(total_amount, 0),
    base_commission_rate = 0.4,
    dynamic_commission_rate = COALESCE(commission_rate, 0.4),
    month_direct_commission = COALESCE(month_amount * 0.4, 0),
    today_direct_commission = COALESCE(today_amount * 0.4, 0)
WHERE sales_type = 'primary'
AND direct_commission IS NULL;

-- 输出完成信息
SELECT 'sales_optimized 表字段添加完成！' as status;
SELECT COUNT(*) as updated_records FROM sales_optimized WHERE direct_commission IS NOT NULL;