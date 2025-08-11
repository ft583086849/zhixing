-- 批量修复历史订单的销售ID关联

-- 1. 先统计需要修复的订单数量
SELECT 
  'total_to_fix' as metric,
  COUNT(*) as count
FROM orders
WHERE sales_code IS NOT NULL 
  AND sales_code != ''
  AND primary_sales_id IS NULL 
  AND secondary_sales_id IS NULL;

-- 2. 创建备份（重要！）
CREATE TABLE IF NOT EXISTS orders_id_backup_20250110 AS
SELECT 
  id,
  order_number,
  sales_code,
  primary_sales_id,
  secondary_sales_id,
  updated_at
FROM orders
WHERE sales_code IS NOT NULL;

-- 3. 批量修复一级销售订单
WITH fix_primary AS (
  UPDATE orders o
  SET 
    primary_sales_id = ps.id,
    updated_at = NOW()
  FROM primary_sales ps
  WHERE o.sales_code = ps.sales_code
    AND o.sales_code LIKE 'PRI%'
    AND o.primary_sales_id IS NULL
  RETURNING o.id
)
SELECT COUNT(*) as fixed_primary_count FROM fix_primary;

-- 4. 批量修复二级销售订单
WITH fix_secondary AS (
  UPDATE orders o
  SET 
    secondary_sales_id = ss.id,
    updated_at = NOW()
  FROM secondary_sales ss
  WHERE o.sales_code = ss.sales_code
    AND o.sales_code LIKE 'SEC%'
    AND o.secondary_sales_id IS NULL
  RETURNING o.id
)
SELECT COUNT(*) as fixed_secondary_count FROM fix_secondary;

-- 5. 验证修复结果
SELECT 
  'after_fix' as status,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN sales_code IS NOT NULL THEN 1 END) as with_sales_code,
  COUNT(CASE WHEN primary_sales_id IS NOT NULL OR secondary_sales_id IS NOT NULL THEN 1 END) as with_id,
  COUNT(CASE WHEN sales_code IS NOT NULL AND primary_sales_id IS NULL AND secondary_sales_id IS NULL THEN 1 END) as still_missing
FROM orders;

-- 6. 查看还有哪些订单无法修复（sales_code不存在）
SELECT 
  order_number,
  customer_wechat,
  sales_code,
  created_at
FROM orders
WHERE sales_code IS NOT NULL 
  AND sales_code != ''
  AND primary_sales_id IS NULL 
  AND secondary_sales_id IS NULL
LIMIT 10;
