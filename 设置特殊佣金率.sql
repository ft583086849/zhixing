-- 🔧 设置特殊佣金率逻辑

-- 1. 查找张子俊的记录
SELECT 'primary_sales' as table_name, id, wechat_name, sales_code, commission_rate 
FROM primary_sales 
WHERE wechat_name LIKE '%张子俊%' OR wechat_name = '张子俊';

SELECT 'secondary_sales' as table_name, id, wechat_name, sales_code, commission_rate, primary_sales_id
FROM secondary_sales 
WHERE wechat_name LIKE '%张子俊%' OR wechat_name = '张子俊';

-- 2. 查找Liangjunhao889的记录
SELECT id, wechat_name, sales_code, commission_rate, primary_sales_id
FROM secondary_sales 
WHERE wechat_name = 'Liangjunhao889' OR wechat_name LIKE '%Liangjunhao%';

-- 3. 更新张子俊的佣金率为0%（如果在primary_sales表）
UPDATE primary_sales 
SET commission_rate = 0
WHERE wechat_name LIKE '%张子俊%' OR wechat_name = '张子俊';

-- 4. 更新张子俊的佣金率为0%（如果在secondary_sales表）
UPDATE secondary_sales 
SET commission_rate = 0
WHERE wechat_name LIKE '%张子俊%' OR wechat_name = '张子俊';

-- 5. 更新Liangjunhao889的佣金率为0%
UPDATE secondary_sales 
SET commission_rate = 0
WHERE wechat_name = 'Liangjunhao889' OR wechat_name LIKE '%Liangjunhao%';

-- 6. 验证更新结果
SELECT '===更新后的张子俊===' as info;
SELECT * FROM primary_sales WHERE wechat_name LIKE '%张子俊%';
SELECT * FROM secondary_sales WHERE wechat_name LIKE '%张子俊%';

SELECT '===更新后的Liangjunhao889===' as info;
SELECT * FROM secondary_sales WHERE wechat_name LIKE '%Liangjunhao%';
