-- 知行财库系统数据库升级脚本
-- 执行日期: 2024年9月6日
-- 目的: Bug修复 + 产品体系升级

-- =============================================
-- 第一部分：Bug修复的数据库更新
-- =============================================

-- Bug #4: 修复生效时间数据不一致
UPDATE orders_optimized 
SET effective_time = COALESCE(payment_time, created_at)
WHERE status IN ('confirmed_config', 'active') 
AND effective_time IS NULL;

-- 添加生效时间自动设置触发器
CREATE OR REPLACE FUNCTION set_effective_time()
RETURNS TRIGGER AS $$
BEGIN
  -- 当订单状态变为confirmed_config时，自动设置生效时间
  IF NEW.status = 'confirmed_config' AND OLD.status != 'confirmed_config' AND NEW.effective_time IS NULL THEN
    NEW.effective_time = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 如果触发器不存在则创建
DROP TRIGGER IF EXISTS trigger_set_effective_time ON orders_optimized;
CREATE TRIGGER trigger_set_effective_time
  BEFORE UPDATE ON orders_optimized
  FOR EACH ROW
  EXECUTE FUNCTION set_effective_time();

-- =============================================
-- 第二部分：产品体系升级字段添加
-- =============================================

-- 检查字段是否已存在，不存在则添加
DO $$ 
BEGIN
    -- 添加产品类型字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders_optimized' AND column_name='product_type') THEN
        ALTER TABLE orders_optimized 
        ADD COLUMN product_type VARCHAR(20) DEFAULT '推币策略';
    END IF;
    
    -- 添加Discord ID字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders_optimized' AND column_name='discord_id') THEN
        ALTER TABLE orders_optimized 
        ADD COLUMN discord_id VARCHAR(50);
    END IF;
END $$;

-- 历史数据标记（确保所有现有订单都标记为推币策略）
UPDATE orders_optimized 
SET product_type = '推币策略'
WHERE product_type IS NULL OR product_type = '';

-- =============================================
-- 第三部分：性能优化索引
-- =============================================

-- 添加产品类型索引（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'orders_optimized' AND indexname = 'idx_orders_product_type') THEN
        CREATE INDEX idx_orders_product_type ON orders_optimized(product_type);
    END IF;
END $$;

-- 添加复合索引优化查询性能
DO $$
BEGIN
    -- 状态+创建时间索引（用于订单管理页面查询优化）
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'orders_optimized' AND indexname = 'idx_orders_status_created') THEN
        CREATE INDEX idx_orders_status_created ON orders_optimized(status, created_at DESC);
    END IF;
    
    -- 销售代码索引（用于销售统计优化）
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'orders_optimized' AND indexname = 'idx_orders_sales_code') THEN
        CREATE INDEX idx_orders_sales_code ON orders_optimized(sales_code);
    END IF;
    
    -- 产品+状态复合索引（用于产品统计优化）
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'orders_optimized' AND indexname = 'idx_orders_product_status') THEN
        CREATE INDEX idx_orders_product_status ON orders_optimized(product_type, status);
    END IF;
END $$;

-- =============================================
-- 第四部分：数据验证
-- =============================================

-- 验证生效时间修复结果
SELECT 
  'effective_time_check' as check_name,
  status,
  COUNT(*) as total,
  COUNT(effective_time) as has_effective_time,
  COUNT(*) - COUNT(effective_time) as missing_effective_time
FROM orders_optimized 
WHERE status IN ('confirmed_config', 'active')
GROUP BY status;

-- 验证产品类型设置结果
SELECT 
  'product_type_check' as check_name,
  product_type,
  COUNT(*) as order_count,
  MIN(created_at) as earliest_order,
  MAX(created_at) as latest_order
FROM orders_optimized 
GROUP BY product_type;

-- 验证索引创建结果
SELECT 
  'index_check' as check_name,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'orders_optimized' 
  AND indexname LIKE 'idx_orders_%'
ORDER BY indexname;

-- 执行完成提示
SELECT 
  '✅ 数据库升级完成' as status,
  NOW() as completed_at,
  'Bug修复 + 产品字段添加 + 性能优化索引' as changes;