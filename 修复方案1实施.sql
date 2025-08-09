-- 🔧 修复方案1实施：设置二级销售默认佣金率

-- 1. 查看当前佣金率分布
SELECT 
  CASE 
    WHEN primary_sales_id IS NULL THEN '独立销售'
    ELSE '二级销售'
  END as type,
  commission_rate,
  COUNT(*) as count
FROM secondary_sales
GROUP BY primary_sales_id IS NULL, commission_rate
ORDER BY type, commission_rate;

-- 2. 更新独立销售佣金率为30%（0.3）
UPDATE secondary_sales
SET commission_rate = 0.3
WHERE primary_sales_id IS NULL
  AND (commission_rate IS NULL OR commission_rate != 0.3);

-- 3. 更新二级销售佣金率为25%（0.25）- 只更新未设置的
UPDATE secondary_sales
SET commission_rate = 0.25
WHERE primary_sales_id IS NOT NULL
  AND commission_rate IS NULL;

-- 4. 验证更新结果
SELECT 
  wechat_name,
  sales_code,
  CASE 
    WHEN primary_sales_id IS NULL THEN '独立销售'
    ELSE '二级销售'
  END as type,
  commission_rate,
  commission_rate * 100 as rate_percent
FROM secondary_sales
ORDER BY primary_sales_id IS NULL, wechat_name;
