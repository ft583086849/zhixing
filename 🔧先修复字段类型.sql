-- 🔧 先修复字段类型，再插入数据
-- 分步骤解决：1.修复字段类型 2.清理数据 3.插入测试数据

-- ============================================================================
-- 步骤1：修复所有字段类型和精度问题
-- ============================================================================

-- 修复 orders 表的 commission_rate 字段精度
-- 从 DECIMAL(5,4) 改为 DECIMAL(6,4) 以支持 0.4000 这样的值
ALTER TABLE orders 
ALTER COLUMN commission_rate TYPE DECIMAL(6,4);

-- 确保 primary_sales 和 secondary_sales 的 commission_rate 精度正确
ALTER TABLE primary_sales 
ALTER COLUMN commission_rate TYPE DECIMAL(5,2);

ALTER TABLE secondary_sales 
ALTER COLUMN commission_rate TYPE DECIMAL(5,2);

-- 添加 admins 表缺失字段
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 为现有 admins 记录填充默认值
UPDATE admins 
SET 
    role = COALESCE(role, 'admin'),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE role IS NULL OR created_at IS NULL;

-- ============================================================================
-- 步骤2：检查并显示字段类型
-- ============================================================================

SELECT '=== 字段类型验证 ===' as info;
SELECT 
    table_name,
    column_name, 
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE (column_name = 'commission_rate' OR column_name = 'role' OR column_name = 'name')
  AND table_name IN ('primary_sales', 'secondary_sales', 'orders', 'admins')
ORDER BY table_name, column_name;

-- 检查当前数据状况
SELECT '=== 当前数据统计 ===' as info;
SELECT 'admins' as table_name, COUNT(*) as count FROM admins
UNION ALL
SELECT 'primary_sales' as table_name, COUNT(*) as count FROM primary_sales
UNION ALL
SELECT 'secondary_sales' as table_name, COUNT(*) as count FROM secondary_sales
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as count FROM orders;

-- 完成通知
DO $$ 
BEGIN
    RAISE NOTICE '✅ 字段类型修复完成！';
    RAISE NOTICE '📊 commission_rate 字段精度已调整：';
    RAISE NOTICE '   - orders: DECIMAL(6,4) - 可存储 0.0000 到 99.9999';
    RAISE NOTICE '   - primary_sales: DECIMAL(5,2) - 可存储 0.00 到 999.99';
    RAISE NOTICE '   - secondary_sales: DECIMAL(5,2) - 可存储 0.00 到 999.99';
    RAISE NOTICE '✅ admins 表字段已补全！';
    RAISE NOTICE '🎯 现在可以安全插入数据了！';
END $$;