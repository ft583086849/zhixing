-- 🔧 移除支付宝支付方式 - 数据库迁移脚本
-- 执行时间：2025-01-14
-- 目的：从系统中完全移除支付宝支付方式

-- ================================================
-- 第一步：备份现有支付宝相关数据
-- ================================================

-- 1. 备份使用支付宝的一级销售数据
CREATE TABLE IF NOT EXISTS backup_primary_sales_alipay AS
SELECT 
  id,
  sales_code,
  wechat_name,
  payment_method,
  payment_address,
  name,
  created_at
FROM primary_sales
WHERE payment_method = 'alipay';

-- 2. 备份使用支付宝的二级销售数据
CREATE TABLE IF NOT EXISTS backup_secondary_sales_alipay AS
SELECT 
  id,
  sales_code,
  wechat_name,
  payment_method,
  payment_address,
  name,
  created_at
FROM secondary_sales
WHERE payment_method = 'alipay';

-- 3. 备份使用支付宝的订单数据
CREATE TABLE IF NOT EXISTS backup_orders_alipay AS
SELECT 
  id,
  order_number,
  customer_name,
  payment_method,
  amount,
  status,
  created_at
FROM orders
WHERE payment_method = 'alipay';

-- 4. 备份管理员支付宝配置（如果表存在）
CREATE TABLE IF NOT EXISTS backup_payment_config_alipay AS
SELECT * FROM payment_config;

-- ================================================
-- 第二步：迁移现有数据到crypto
-- ================================================

-- 1. 更新一级销售的支付方式
UPDATE primary_sales
SET 
  payment_method = 'crypto',
  updated_at = NOW()
WHERE payment_method = 'alipay';

-- 2. 更新二级销售的支付方式
UPDATE secondary_sales
SET 
  payment_method = 'crypto',
  updated_at = NOW()
WHERE payment_method = 'alipay';

-- 3. 更新订单的支付方式
UPDATE orders
SET 
  payment_method = 'crypto',
  updated_at = NOW()
WHERE payment_method = 'alipay';

-- ================================================
-- 第三步：修改表结构
-- ================================================

-- 1. 修改orders表的payment_method字段（移除alipay选项）
-- 注意：Supabase可能不支持直接修改ENUM，需要重建字段
ALTER TABLE orders 
ADD COLUMN payment_method_new VARCHAR(20) DEFAULT 'crypto';

UPDATE orders 
SET payment_method_new = CASE 
  WHEN payment_method = 'alipay' THEN 'crypto'
  ELSE payment_method
END;

ALTER TABLE orders DROP COLUMN payment_method;
ALTER TABLE orders RENAME COLUMN payment_method_new TO payment_method;

-- 2. 修改payment_config表（移除支付宝相关字段）
ALTER TABLE payment_config
DROP COLUMN IF EXISTS alipay_account,
DROP COLUMN IF EXISTS alipay_name,
DROP COLUMN IF EXISTS alipay_qr_code;

-- ================================================
-- 第四步：添加约束确保数据一致性
-- ================================================

-- 为payment_method添加检查约束
ALTER TABLE orders
ADD CONSTRAINT check_payment_method 
CHECK (payment_method IN ('crypto'));

ALTER TABLE primary_sales
ADD CONSTRAINT check_payment_method_primary
CHECK (payment_method IN ('crypto'));

ALTER TABLE secondary_sales
ADD CONSTRAINT check_payment_method_secondary
CHECK (payment_method IN ('crypto'));

-- ================================================
-- 第五步：验证迁移结果
-- ================================================

-- 检查是否还有支付宝数据
SELECT 
  'primary_sales' as table_name,
  COUNT(*) as alipay_count
FROM primary_sales
WHERE payment_method = 'alipay'
UNION ALL
SELECT 
  'secondary_sales' as table_name,
  COUNT(*) as alipay_count
FROM secondary_sales
WHERE payment_method = 'alipay'
UNION ALL
SELECT 
  'orders' as table_name,
  COUNT(*) as alipay_count
FROM orders
WHERE payment_method = 'alipay';

-- 统计迁移后的数据
SELECT 
  'Total migrated primary sales:' as description,
  COUNT(*) as count
FROM primary_sales
WHERE payment_method = 'crypto'
UNION ALL
SELECT 
  'Total migrated secondary sales:' as description,
  COUNT(*) as count
FROM secondary_sales
WHERE payment_method = 'crypto'
UNION ALL
SELECT 
  'Total migrated orders:' as description,
  COUNT(*) as count
FROM orders
WHERE payment_method = 'crypto';

-- ================================================
-- 回滚脚本（如需要回滚，请执行以下SQL）
-- ================================================
/*
-- 恢复orders表的payment_method字段
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_payment_method;
ALTER TABLE orders 
ADD COLUMN payment_method_old VARCHAR(20);

UPDATE orders o
SET payment_method_old = (
  SELECT payment_method 
  FROM backup_orders_alipay b 
  WHERE b.id = o.id
);

-- 恢复primary_sales
ALTER TABLE primary_sales DROP CONSTRAINT IF EXISTS check_payment_method_primary;
UPDATE primary_sales p
SET payment_method = (
  SELECT payment_method 
  FROM backup_primary_sales_alipay b 
  WHERE b.id = p.id
)
WHERE EXISTS (
  SELECT 1 FROM backup_primary_sales_alipay b WHERE b.id = p.id
);

-- 恢复secondary_sales
ALTER TABLE secondary_sales DROP CONSTRAINT IF EXISTS check_payment_method_secondary;
UPDATE secondary_sales s
SET payment_method = (
  SELECT payment_method 
  FROM backup_secondary_sales_alipay b 
  WHERE b.id = s.id
)
WHERE EXISTS (
  SELECT 1 FROM backup_secondary_sales_alipay b WHERE b.id = s.id
);

-- 恢复payment_config表字段
ALTER TABLE payment_config
ADD COLUMN alipay_account VARCHAR(255),
ADD COLUMN alipay_name VARCHAR(100),
ADD COLUMN alipay_qr_code TEXT;
*/
