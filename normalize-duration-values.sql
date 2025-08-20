-- ========================================
-- Duration字段规范化脚本
-- ========================================
-- 将orders_optimized表中的duration字段统一为中文格式
-- 目标格式：'7天', '1个月', '3个月', '6个月', '1年'

-- 首先查看当前的duration值分布
SELECT 
    duration,
    COUNT(*) as count
FROM orders_optimized
WHERE duration IS NOT NULL
GROUP BY duration
ORDER BY count DESC;

-- 开始规范化
BEGIN;

-- 7天免费试用 -> 7天
UPDATE orders_optimized 
SET duration = '7天'
WHERE duration IN ('7天免费', '7days', '7 days', '7日', '七天');

-- 1个月
UPDATE orders_optimized
SET duration = '1个月'
WHERE duration IN ('1月', '1month', '1 month', '一个月', '30天', '30 days');

-- 3个月
UPDATE orders_optimized
SET duration = '3个月'  
WHERE duration IN ('3月', '3months', '3 months', '三个月', '90天', '90 days');

-- 6个月
UPDATE orders_optimized
SET duration = '6个月'
WHERE duration IN ('6月', '6months', '6 months', '六个月', '180天', '180 days', '半年');

-- 1年
UPDATE orders_optimized
SET duration = '1年'
WHERE duration IN ('1year', '1 year', '一年', '12个月', '12 months', '365天', '365 days');

COMMIT;

-- 验证规范化结果
SELECT 
    duration,
    COUNT(*) as count
FROM orders_optimized
WHERE duration IS NOT NULL
GROUP BY duration
ORDER BY count DESC;

-- 预期结果：只有这些中文值
-- '7天', '1个月', '3个月', '6个月', '1年'