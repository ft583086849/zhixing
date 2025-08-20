-- 添加生效订单量字段到overview_stats表

-- 1. 添加新字段
ALTER TABLE overview_stats 
ADD COLUMN IF NOT EXISTS valid_orders INTEGER DEFAULT 0 COMMENT '生效订单量（排除拒绝的订单）';

-- 2. 更新现有数据，计算生效订单量
UPDATE overview_stats 
SET valid_orders = total_orders - rejected_orders
WHERE stat_type = 'realtime';

-- 3. 验证更新
SELECT 
  stat_period,
  total_orders as '总订单',
  rejected_orders as '拒绝订单',
  valid_orders as '生效订单',
  active_orders as '活跃订单'
FROM overview_stats 
WHERE stat_type = 'realtime';