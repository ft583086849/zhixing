-- 修复overview_stats表的唯一约束
-- 在Supabase SQL编辑器中执行此脚本

-- 1. 删除现有数据（如果有）
DELETE FROM overview_stats WHERE stat_type = 'realtime';

-- 2. 添加唯一约束
ALTER TABLE overview_stats 
ADD CONSTRAINT overview_stats_unique_key 
UNIQUE (stat_type, stat_period);

-- 3. 插入初始数据
INSERT INTO overview_stats (
  stat_type,
  stat_period,
  total_orders,
  today_orders,
  pending_payment_orders,
  confirmed_payment_orders,
  pending_config_orders,
  confirmed_config_orders,
  rejected_orders,
  active_orders,
  total_amount,
  today_amount,
  confirmed_amount,
  total_commission,
  paid_commission,
  pending_commission,
  primary_sales_count,
  secondary_sales_count,
  independent_sales_count,
  active_sales_count,
  free_trial_orders,
  one_month_orders,
  three_month_orders,
  six_month_orders,
  yearly_orders,
  free_trial_percentage,
  one_month_percentage,
  three_month_percentage,
  six_month_percentage,
  yearly_percentage,
  last_calculated_at,
  calculation_duration_ms,
  data_version
) VALUES 
('realtime', 'all', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NOW(), 0, 1),
('realtime', 'today', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NOW(), 0, 1),
('realtime', 'week', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NOW(), 0, 1),
('realtime', 'month', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NOW(), 0, 1),
('realtime', 'year', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NOW(), 0, 1);

-- 4. 验证数据
SELECT stat_type, stat_period, last_calculated_at 
FROM overview_stats 
WHERE stat_type = 'realtime'
ORDER BY stat_period;