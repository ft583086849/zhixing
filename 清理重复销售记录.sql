-- 🔍 查看重复的销售记录

-- 1. 查看所有张子俊的记录
SELECT 'primary_sales' as table_name, id, wechat_name, sales_code, commission_rate, created_at
FROM primary_sales 
WHERE wechat_name LIKE '%张子俊%' OR wechat_name LIKE '%张%'

UNION ALL

SELECT 'secondary_sales' as table_name, id, wechat_name, sales_code, commission_rate, created_at
FROM secondary_sales 
WHERE wechat_name LIKE '%张子俊%' OR wechat_name LIKE '%张%';

-- 2. 如果发现重复，可以删除不需要的记录
-- 例如：删除secondary_sales中的重复记录（请谨慎操作）
-- DELETE FROM secondary_sales WHERE wechat_name = '张子俊' AND id != (最早的ID);

-- 3. 查看所有销售记录统计
SELECT 
  (SELECT COUNT(*) FROM primary_sales) as primary_count,
  (SELECT COUNT(*) FROM secondary_sales) as secondary_count,
  (SELECT COUNT(*) FROM primary_sales) + (SELECT COUNT(*) FROM secondary_sales) as total_count;
