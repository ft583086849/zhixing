-- 🔧 修复数据精度问题
-- 调整 commission_rate 字段精度并重新插入数据

-- ============================================================================
-- 1. 修复字段精度问题
-- ============================================================================

-- 修改 orders 表的 commission_rate 字段精度
-- 从 DECIMAL(5,4) 改为 DECIMAL(6,4) 以支持 0.4000 这样的值
ALTER TABLE orders 
ALTER COLUMN commission_rate TYPE DECIMAL(6,4);

-- 确保 primary_sales 和 secondary_sales 的 commission_rate 精度正确
-- 这里应该存储百分比值，如 40.00 表示 40%
ALTER TABLE primary_sales 
ALTER COLUMN commission_rate TYPE DECIMAL(5,2);

ALTER TABLE secondary_sales 
ALTER COLUMN commission_rate TYPE DECIMAL(5,2);

-- ============================================================================
-- 2. 添加 admins 表缺失字段
-- ============================================================================

-- 添加缺失的字段
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 为现有记录填充默认值
UPDATE admins 
SET 
    role = COALESCE(role, 'admin'),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE role IS NULL OR created_at IS NULL;

-- ============================================================================
-- 3. 彻底清理测试数据
-- ============================================================================

-- 删除所有测试数据
DELETE FROM orders WHERE tradingview_username LIKE '%test_field_check%';
DELETE FROM primary_sales WHERE wechat_name LIKE '%test_field_check%';
DELETE FROM secondary_sales WHERE wechat_name LIKE '%test_field_check%';

-- 删除有空值的记录
DELETE FROM orders WHERE 
    sales_code IS NULL 
    OR tradingview_username IS NULL 
    OR amount IS NULL 
    OR payment_method IS NULL;

DELETE FROM primary_sales WHERE 
    sales_code IS NULL 
    OR wechat_name IS NULL 
    OR payment_method IS NULL;

DELETE FROM secondary_sales WHERE 
    sales_code IS NULL 
    OR wechat_name IS NULL 
    OR payment_method IS NULL;

-- ============================================================================
-- 4. 插入完整的测试数据（使用正确的精度）
-- ============================================================================

-- 插入测试管理员
INSERT INTO admins (username, password_hash, role, created_at, updated_at) 
VALUES ('admin', '$2b$10$test_hash_for_admin', 'super_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

-- 插入测试一级分销（commission_rate 存储为百分比，如 40.00 表示 40%）
INSERT INTO primary_sales (
    wechat_name, 
    sales_code, 
    secondary_registration_code, 
    payment_method, 
    payment_address,
    alipay_surname,
    commission_rate,
    created_at,
    updated_at
) VALUES (
    'test_primary_sales_001', 
    'PS_TEST001', 
    'SR_TEST001', 
    'alipay', 
    'test001@alipay.com',
    '测试一级',
    40.00,  -- 40% 佣金率
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (sales_code) DO UPDATE SET
    wechat_name = EXCLUDED.wechat_name,
    payment_address = EXCLUDED.payment_address,
    updated_at = CURRENT_TIMESTAMP;

-- 插入测试二级分销（关联型）
INSERT INTO secondary_sales (
    wechat_name, 
    sales_code, 
    primary_sales_id,
    primary_registration_code,
    payment_method, 
    payment_address,
    alipay_surname,
    commission_rate,
    status,
    created_at,
    updated_at
) VALUES (
    'test_secondary_linked_001', 
    'SS_LINKED001', 
    (SELECT id FROM primary_sales WHERE sales_code = 'PS_TEST001'),
    'SR_TEST001',
    'alipay', 
    'test_secondary001@alipay.com',
    '测试二级关联',
    30.00,  -- 30% 佣金率
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (sales_code) DO UPDATE SET
    wechat_name = EXCLUDED.wechat_name,
    payment_address = EXCLUDED.payment_address,
    updated_at = CURRENT_TIMESTAMP;

-- 插入测试二级分销（独立型）
INSERT INTO secondary_sales (
    wechat_name, 
    sales_code, 
    payment_method, 
    payment_address,
    alipay_surname,
    commission_rate,
    status,
    created_at,
    updated_at
) VALUES (
    'test_secondary_independent_001', 
    'SS_INDEPENDENT001', 
    'alipay', 
    'test_independent001@alipay.com',
    '测试二级独立',
    30.00,  -- 30% 佣金率
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (sales_code) DO UPDATE SET
    wechat_name = EXCLUDED.wechat_name,
    payment_address = EXCLUDED.payment_address,
    updated_at = CURRENT_TIMESTAMP;

-- 插入测试订单数据（commission_rate 存储为小数，如 0.4000 表示 40%）
INSERT INTO orders (
    order_number,
    sales_code,
    sales_type,
    tradingview_username,
    customer_wechat,
    duration,
    amount,
    payment_method,
    payment_time,
    purchase_type,
    submit_time,
    status,
    commission_rate,
    commission_amount,
    primary_sales_id,
    secondary_sales_id,
    config_confirmed,
    created_at,
    updated_at
) VALUES 
-- 一级分销订单
(
    'ORD_TEST001',
    'PS_TEST001',
    'primary',
    'test_user_001',
    'customer_wechat_001',
    '1month',
    99.00,
    'alipay',
    CURRENT_TIMESTAMP,
    'immediate',
    CURRENT_TIMESTAMP,
    'completed',
    0.4000,  -- 40% 佣金率（小数形式）
    39.60,   -- 99.00 * 0.40 = 39.60
    (SELECT id FROM primary_sales WHERE sales_code = 'PS_TEST001'),
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- 二级分销关联订单
(
    'ORD_TEST002',
    'SS_LINKED001',
    'secondary',
    'test_user_002',
    'customer_wechat_002',
    '1month',
    99.00,
    'alipay',
    CURRENT_TIMESTAMP,
    'immediate',
    CURRENT_TIMESTAMP,
    'completed',
    0.3000,  -- 30% 佣金率（小数形式）
    29.70,   -- 99.00 * 0.30 = 29.70
    NULL,
    (SELECT id FROM secondary_sales WHERE sales_code = 'SS_LINKED001'),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- 二级分销独立订单
(
    'ORD_TEST003',
    'SS_INDEPENDENT001',
    'secondary',
    'test_user_003',
    'customer_wechat_003',
    '1month',
    99.00,
    'alipay',
    CURRENT_TIMESTAMP,
    'immediate',
    CURRENT_TIMESTAMP,
    'completed',
    0.3000,  -- 30% 佣金率（小数形式）
    29.70,   -- 99.00 * 0.30 = 29.70
    NULL,
    (SELECT id FROM secondary_sales WHERE sales_code = 'SS_INDEPENDENT001'),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (order_number) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 5. 验证修复结果
-- ============================================================================

-- 检查字段精度
SELECT '=== 字段精度检查 ===' as info;
SELECT 
    table_name, 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale
FROM information_schema.columns 
WHERE column_name = 'commission_rate' 
  AND table_name IN ('primary_sales', 'secondary_sales', 'orders');

-- 检查记录数量
SELECT '=== 表记录统计 ===' as info;
SELECT 'admins' as table_name, COUNT(*) as count FROM admins
UNION ALL
SELECT 'primary_sales' as table_name, COUNT(*) as count FROM primary_sales
UNION ALL
SELECT 'secondary_sales' as table_name, COUNT(*) as count FROM secondary_sales
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as count FROM orders;

-- 显示样本数据
SELECT '=== ADMINS 样本 ===' as info;
SELECT id, username, role, created_at FROM admins LIMIT 2;

SELECT '=== PRIMARY_SALES 样本 ===' as info;
SELECT id, wechat_name, sales_code, commission_rate FROM primary_sales LIMIT 2;

SELECT '=== SECONDARY_SALES 样本 ===' as info;
SELECT id, wechat_name, sales_code, commission_rate, status FROM secondary_sales LIMIT 3;

SELECT '=== ORDERS 样本 ===' as info;
SELECT id, order_number, sales_code, commission_rate, commission_amount, status FROM orders LIMIT 3;

-- 完成通知
DO $$ 
BEGIN
    RAISE NOTICE '✅ 字段精度问题修复完成！';
    RAISE NOTICE '✅ 所有测试数据插入完成！';
    RAISE NOTICE '📊 字段精度设置：';
    RAISE NOTICE '   - primary_sales.commission_rate: DECIMAL(5,2) (如 40.00)';
    RAISE NOTICE '   - secondary_sales.commission_rate: DECIMAL(5,2) (如 30.00)';
    RAISE NOTICE '   - orders.commission_rate: DECIMAL(6,4) (如 0.4000)';
    RAISE NOTICE '🧪 现在可以运行功能测试验证';
END $$;