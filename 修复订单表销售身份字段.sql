-- 修复订单表销售身份字段
-- 确保orders表有正确的销售身份字段用于订单归类

-- 1. 添加销售身份字段（如果不存在）
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sales_type ENUM('primary', 'secondary', 'legacy') DEFAULT NULL COMMENT '销售类型：一级/二级/遗留',
ADD COLUMN IF NOT EXISTS primary_sales_id INT DEFAULT NULL COMMENT '一级销售ID',
ADD COLUMN IF NOT EXISTS secondary_sales_id INT DEFAULT NULL COMMENT '二级销售ID';

-- 2. 添加索引优化查询性能
ALTER TABLE orders 
ADD INDEX IF NOT EXISTS idx_sales_type (sales_type),
ADD INDEX IF NOT EXISTS idx_primary_sales_id (primary_sales_id),
ADD INDEX IF NOT EXISTS idx_secondary_sales_id (secondary_sales_id);

-- 3. 添加外键约束（如果primary_sales和secondary_sales表存在）
-- 注意：只有在确认表存在时才执行
-- ALTER TABLE orders 
-- ADD CONSTRAINT IF NOT EXISTS fk_orders_primary_sales 
--   FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id) ON DELETE SET NULL,
-- ADD CONSTRAINT IF NOT EXISTS fk_orders_secondary_sales 
--   FOREIGN KEY (secondary_sales_id) REFERENCES secondary_sales(id) ON DELETE SET NULL;

-- 4. 为现有订单补充销售身份信息
-- 注意：这个更新脚本需要在确认字段存在后执行

-- 4.1 处理通过一级销售销售代码的订单
UPDATE orders o
JOIN primary_sales ps ON o.link_code = ps.sales_code
SET 
  o.sales_type = 'primary',
  o.primary_sales_id = ps.id,
  o.secondary_sales_id = NULL
WHERE o.sales_type IS NULL;

-- 4.2 处理通过一级销售临时代码的订单（ps_123格式）
UPDATE orders o
JOIN primary_sales ps ON CONCAT('ps_', ps.id) = o.link_code
SET 
  o.sales_type = 'primary',
  o.primary_sales_id = ps.id,
  o.secondary_sales_id = NULL
WHERE o.sales_type IS NULL;

-- 4.3 处理通过二级销售销售代码的订单
UPDATE orders o
JOIN secondary_sales ss ON o.link_code = ss.sales_code
SET 
  o.sales_type = 'secondary',
  o.primary_sales_id = ss.primary_sales_id,
  o.secondary_sales_id = ss.id
WHERE o.sales_type IS NULL;

-- 4.4 处理通过二级销售临时代码的订单（ss_123格式）
UPDATE orders o
JOIN secondary_sales ss ON CONCAT('ss_', ss.id) = o.link_code
SET 
  o.sales_type = 'secondary',
  o.primary_sales_id = ss.primary_sales_id,
  o.secondary_sales_id = ss.id
WHERE o.sales_type IS NULL;

-- 4.5 处理遗留销售表的订单
UPDATE orders o
JOIN sales s ON o.link_code = s.link_code
SET 
  o.sales_type = 'secondary', -- 默认作为二级销售处理
  o.primary_sales_id = NULL,
  o.secondary_sales_id = NULL -- 遗留销售没有新表ID
WHERE o.sales_type IS NULL;

-- 5. 检查修复结果
SELECT 
  sales_type,
  COUNT(*) as order_count,
  COUNT(CASE WHEN primary_sales_id IS NOT NULL THEN 1 END) as has_primary_id,
  COUNT(CASE WHEN secondary_sales_id IS NOT NULL THEN 1 END) as has_secondary_id
FROM orders 
GROUP BY sales_type
WITH ROLLUP;