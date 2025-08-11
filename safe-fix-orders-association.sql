-- 安全修复订单关联的步骤

-- ==========================================
-- 步骤1：先查看将被影响的数据（不修改）
-- ==========================================

-- 1.1 查看有多少订单需要修复
SELECT 
  COUNT(*) as total_orders_to_fix,
  COUNT(CASE WHEN sales_code LIKE 'PRI%' THEN 1 END) as primary_orders,
  COUNT(CASE WHEN sales_code LIKE 'SEC%' THEN 1 END) as secondary_orders
FROM orders
WHERE sales_code IS NOT NULL 
  AND sales_code != ''
  AND primary_sales_id IS NULL 
  AND secondary_sales_id IS NULL;

-- 1.2 查看具体哪些订单会被修改（前20条）
SELECT 
  o.id,
  o.order_number,
  o.customer_wechat,
  o.sales_code,
  o.amount,
  ps.id as will_set_primary_id,
  ps.wechat_name as primary_sales_name,
  ss.id as will_set_secondary_id,
  ss.wechat_name as secondary_sales_name
FROM orders o
LEFT JOIN primary_sales ps ON ps.sales_code = o.sales_code
LEFT JOIN secondary_sales ss ON ss.sales_code = o.sales_code
WHERE o.sales_code IS NOT NULL 
  AND o.sales_code != ''
  AND o.primary_sales_id IS NULL 
  AND o.secondary_sales_id IS NULL
LIMIT 20;

-- ==========================================
-- 步骤2：备份要修改的数据（创建备份表）
-- ==========================================

-- 2.1 创建备份表（如果不存在）
CREATE TABLE IF NOT EXISTS orders_backup_20250110 AS
SELECT id, order_number, sales_code, primary_sales_id, secondary_sales_id
FROM orders
WHERE sales_code IS NOT NULL 
  AND (primary_sales_id IS NULL OR secondary_sales_id IS NULL);

-- ==========================================
-- 步骤3：执行修复（带事务保护）
-- ==========================================

BEGIN; -- 开始事务

-- 3.1 修复一级销售订单
UPDATE orders o
SET 
  primary_sales_id = ps.id,
  updated_at = NOW()
FROM primary_sales ps
WHERE o.sales_code = ps.sales_code
  AND o.sales_code LIKE 'PRI%'
  AND o.primary_sales_id IS NULL;

-- 查看影响的行数
-- GET DIAGNOSTICS rows_affected = ROW_COUNT;
-- RAISE NOTICE '更新了 % 条一级销售订单', rows_affected;

-- 3.2 修复二级销售订单
UPDATE orders o
SET 
  secondary_sales_id = ss.id,
  updated_at = NOW()
FROM secondary_sales ss
WHERE o.sales_code = ss.sales_code
  AND o.sales_code LIKE 'SEC%'
  AND o.secondary_sales_id IS NULL;

-- 3.3 验证修复结果
SELECT 
  COUNT(*) as remaining_unlinked_orders
FROM orders
WHERE sales_code IS NOT NULL 
  AND sales_code != ''
  AND primary_sales_id IS NULL 
  AND secondary_sales_id IS NULL;

-- 如果还有未关联的订单，说明有问题
-- 可以 ROLLBACK 回滚事务

COMMIT; -- 提交事务（如果一切正常）
-- ROLLBACK; -- 或者回滚（如果发现问题）

-- ==========================================
-- 步骤4：验证修复效果
-- ==========================================

-- 4.1 检查qq4073969的订单是否已修复
SELECT 
  id,
  order_number,
  customer_wechat,
  sales_code,
  primary_sales_id,
  secondary_sales_id,
  status,
  amount
FROM orders 
WHERE customer_wechat = 'qq4073969';

-- 4.2 统计修复后的整体情况
SELECT 
  COUNT(*) as total_orders,
  COUNT(sales_code) as orders_with_sales_code,
  COUNT(primary_sales_id) + COUNT(secondary_sales_id) as orders_with_ids,
  COUNT(CASE WHEN sales_code IS NOT NULL AND primary_sales_id IS NULL AND secondary_sales_id IS NULL THEN 1 END) as still_missing_ids
FROM orders;
