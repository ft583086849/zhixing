-- 详细验证购买链接数据
-- 目标: 验证 SEC1754532576400 在数据库中确实存在

-- 1. 检查 secondary_sales 表中是否有这个记录
SELECT '=== 查找二级销售记录 ===' as test_section;

SELECT 
  id,
  sales_code,
  name,
  phone,
  email,
  sales_type,
  created_at
FROM secondary_sales 
WHERE sales_code = 'SEC1754532576400'
ORDER BY created_at DESC;

-- 2. 模糊搜索类似的sales_code
SELECT '=== 模糊搜索类似sales_code ===' as test_section;

SELECT 
  sales_code,
  name,
  created_at
FROM secondary_sales 
WHERE sales_code LIKE '%1754532576400%'
   OR sales_code LIKE 'SEC%1754532576400%'
ORDER BY created_at DESC;

-- 3. 检查所有今天的二级销售记录
SELECT '=== 今天所有二级销售记录 ===' as test_section;

SELECT 
  sales_code,
  name,
  phone,
  created_at
FROM secondary_sales 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- 4. 检查最近10条二级销售记录
SELECT '=== 最近10条二级销售记录 ===' as test_section;

SELECT 
  sales_code,
  name,
  created_at
FROM secondary_sales 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. 验证 sales_type 字段存在性
SELECT '=== 验证sales_type字段 ===' as test_section;

SELECT 
  sales_code,
  sales_type,
  name
FROM secondary_sales 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. 检查字段完整性
SELECT '=== 检查字段完整性 ===' as test_section;

SELECT 
  COUNT(*) as total_records,
  COUNT(sales_code) as has_sales_code,
  COUNT(name) as has_name,
  COUNT(sales_type) as has_sales_type
FROM secondary_sales;
