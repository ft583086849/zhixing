-- 完整数据库重构方案
-- 目标：将原始简单架构升级为完整的三层销售体系架构

-- ===================================
-- 第一部分：Orders表结构升级
-- ===================================

-- 1. 添加缺失的销售关联字段
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(100) COMMENT '标准化销售代码',
ADD COLUMN IF NOT EXISTS sales_type ENUM('primary', 'secondary', 'legacy') DEFAULT 'legacy' COMMENT '销售类型：一级/二级/遗留',
ADD COLUMN IF NOT EXISTS primary_sales_id INT DEFAULT NULL COMMENT '一级销售ID',
ADD COLUMN IF NOT EXISTS secondary_sales_id INT DEFAULT NULL COMMENT '二级销售ID',
ADD COLUMN IF NOT EXISTS config_confirmed BOOLEAN DEFAULT FALSE COMMENT '配置确认状态';

-- 2. 修改现有字段以支持更多状态
ALTER TABLE orders 
MODIFY COLUMN status ENUM('pending_payment', 'pending_config', 'confirmed_payment', 'confirmed_configuration', 'active', 'expired', 'cancelled', 'rejected') DEFAULT 'pending_payment' COMMENT '订单状态',
MODIFY COLUMN screenshot_path LONGTEXT COMMENT '付款截图数据（Base64格式）';

-- 3. 添加性能优化索引
ALTER TABLE orders 
ADD INDEX IF NOT EXISTS idx_sales_code (sales_code),
ADD INDEX IF NOT EXISTS idx_sales_type (sales_type),
ADD INDEX IF NOT EXISTS idx_primary_sales_id (primary_sales_id),
ADD INDEX IF NOT EXISTS idx_secondary_sales_id (secondary_sales_id),
ADD INDEX IF NOT EXISTS idx_config_confirmed (config_confirmed);

-- ===================================
-- 第二部分：数据迁移
-- ===================================

-- 4. 迁移现有订单的销售代码
UPDATE orders 
SET sales_code = link_code 
WHERE sales_code IS NULL;

-- 5. 根据销售代码确定销售类型和关联ID

-- 5.1 处理一级销售订单
UPDATE orders o
JOIN primary_sales ps ON o.sales_code = ps.sales_code
SET 
  o.sales_type = 'primary',
  o.primary_sales_id = ps.id,
  o.secondary_sales_id = NULL
WHERE o.sales_type = 'legacy';

-- 5.2 处理二级销售订单  
UPDATE orders o
JOIN secondary_sales ss ON o.sales_code = ss.sales_code
SET 
  o.sales_type = 'secondary',
  o.primary_sales_id = ss.primary_sales_id,
  o.secondary_sales_id = ss.id
WHERE o.sales_type = 'legacy';

-- 5.3 处理遗留销售订单（保持legacy状态）
UPDATE orders o
JOIN sales s ON o.sales_code = s.link_code
SET 
  o.sales_type = 'legacy',
  o.primary_sales_id = NULL,
  o.secondary_sales_id = NULL
WHERE o.sales_type = 'legacy' AND NOT EXISTS (
  SELECT 1 FROM primary_sales ps WHERE ps.sales_code = o.sales_code
) AND NOT EXISTS (
  SELECT 1 FROM secondary_sales ss WHERE ss.sales_code = o.sales_code
);

-- 6. 更新订单状态映射
UPDATE orders 
SET status = CASE 
  WHEN status = 'pending_review' THEN 'pending_payment'
  WHEN status = 'active' THEN 'confirmed_configuration'
  ELSE status
END;

-- 7. 根据订单状态设置config_confirmed
UPDATE orders 
SET config_confirmed = TRUE 
WHERE status IN ('confirmed_configuration', 'active');

-- ===================================
-- 第三部分：添加外键约束（可选）
-- ===================================

-- 8. 添加外键约束确保数据一致性
ALTER TABLE orders 
ADD CONSTRAINT IF NOT EXISTS fk_orders_primary_sales 
  FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id) ON DELETE SET NULL,
ADD CONSTRAINT IF NOT EXISTS fk_orders_secondary_sales 
  FOREIGN KEY (secondary_sales_id) REFERENCES secondary_sales(id) ON DELETE SET NULL;

-- ===================================
-- 第四部分：验证迁移结果
-- ===================================

-- 9. 检查迁移结果统计
SELECT 
  '=== 订单销售类型分布 ===' as check_point;

SELECT 
  sales_type,
  COUNT(*) as order_count,
  COUNT(CASE WHEN primary_sales_id IS NOT NULL THEN 1 END) as has_primary_id,
  COUNT(CASE WHEN secondary_sales_id IS NOT NULL THEN 1 END) as has_secondary_id,
  COUNT(CASE WHEN config_confirmed = TRUE THEN 1 END) as config_confirmed_count
FROM orders 
GROUP BY sales_type
WITH ROLLUP;

SELECT 
  '=== 订单状态分布 ===' as check_point;

SELECT 
  status,
  COUNT(*) as order_count
FROM orders 
GROUP BY status
ORDER BY order_count DESC;

SELECT 
  '=== 销售代码一致性检查 ===' as check_point;

SELECT 
  COUNT(CASE WHEN sales_code IS NULL THEN 1 END) as null_sales_code,
  COUNT(CASE WHEN sales_code != link_code THEN 1 END) as inconsistent_codes,
  COUNT(*) as total_orders
FROM orders;

-- ===================================
-- 第五部分：清理和优化
-- ===================================

-- 10. 更新表注释
ALTER TABLE orders COMMENT = '订单表 - 支持三层销售体系架构';

-- 完成提示
SELECT 
  '🎉 数据库重构完成！' as status,
  NOW() as completion_time;