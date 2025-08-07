-- 🔧 统一佣金率为百分比格式
-- 将小数格式（0.4）转换为百分比格式（40）

-- 1. 查看当前佣金率数据
SELECT 'primary_sales' as table_name, sales_code, commission_rate 
FROM primary_sales
WHERE commission_rate IS NOT NULL
UNION ALL
SELECT 'secondary_sales' as table_name, sales_code, commission_rate 
FROM secondary_sales
WHERE commission_rate IS NOT NULL;

-- 2. 修复一级销售佣金率（如果是小数格式，转换为百分比）
UPDATE primary_sales 
SET commission_rate = commission_rate * 100
WHERE commission_rate > 0 AND commission_rate < 1;

-- 3. 修复二级销售佣金率（如果是小数格式，转换为百分比）
UPDATE secondary_sales 
SET commission_rate = commission_rate * 100
WHERE commission_rate > 0 AND commission_rate < 1;

-- 4. 验证修复结果
SELECT '修复后的数据:' as status;
SELECT 'primary_sales' as table_name, sales_code, commission_rate 
FROM primary_sales
WHERE commission_rate IS NOT NULL
UNION ALL
SELECT 'secondary_sales' as table_name, sales_code, commission_rate 
FROM secondary_sales
WHERE commission_rate IS NOT NULL;
