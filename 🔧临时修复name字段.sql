-- 🔧 临时修复 name 字段问题
-- 为现有记录填充 name 字段

-- ============================================================================
-- 1. 为现有记录填充 name 字段
-- ============================================================================

-- 清理有问题的记录
DELETE FROM orders WHERE sales_code IN (
    SELECT sales_code FROM primary_sales WHERE name IS NULL
    UNION
    SELECT sales_code FROM secondary_sales WHERE name IS NULL
);

DELETE FROM secondary_sales WHERE primary_sales_id IN (
    SELECT id FROM primary_sales WHERE name IS NULL
);

DELETE FROM primary_sales WHERE name IS NULL;
DELETE FROM secondary_sales WHERE name IS NULL;

-- ============================================================================
-- 2. 重新插入完整的测试数据（包含 name 字段）
-- ============================================================================

-- 插入测试一级分销（添加 name 字段）
INSERT INTO primary_sales (
    name,                    -- 添加 name 字段
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
    'Primary Sales Test 001',  -- name 字段值
    'test_primary_sales_001', 
    'PS_TEST001', 
    'SR_TEST001', 
    'alipay', 
    'test001@alipay.com',
    '测试一级',
    40.00,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (sales_code) DO UPDATE SET
    name = EXCLUDED.name,
    wechat_name = EXCLUDED.wechat_name,
    payment_address = EXCLUDED.payment_address,
    updated_at = CURRENT_TIMESTAMP;

-- 插入测试二级分销（关联型，添加 name 字段）
INSERT INTO secondary_sales (
    name,                    -- 添加 name 字段
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
    'Secondary Sales Linked 001',  -- name 字段值
    'test_secondary_linked_001', 
    'SS_LINKED001', 
    (SELECT id FROM primary_sales WHERE sales_code = 'PS_TEST001'),
    'SR_TEST001',
    'alipay', 
    'test_secondary001@alipay.com',
    '测试二级关联',
    30.00,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (sales_code) DO UPDATE SET
    name = EXCLUDED.name,
    wechat_name = EXCLUDED.wechat_name,
    payment_address = EXCLUDED.payment_address,
    updated_at = CURRENT_TIMESTAMP;

-- 插入测试二级分销（独立型，添加 name 字段）
INSERT INTO secondary_sales (
    name,                    -- 添加 name 字段
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
    'Secondary Sales Independent 001',  -- name 字段值
    'test_secondary_independent_001', 
    'SS_INDEPENDENT001', 
    'alipay', 
    'test_independent001@alipay.com',
    '测试二级独立',
    30.00,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (sales_code) DO UPDATE SET
    name = EXCLUDED.name,
    wechat_name = EXCLUDED.wechat_name,
    payment_address = EXCLUDED.payment_address,
    updated_at = CURRENT_TIMESTAMP;

-- 插入测试订单数据
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
    0.4000,
    39.60,
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
    0.3000,
    29.70,
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
    0.3000,
    29.70,
    NULL,
    (SELECT id FROM secondary_sales WHERE sales_code = 'SS_INDEPENDENT001'),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (order_number) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 3. 验证结果
-- ============================================================================

-- 检查记录数量
SELECT '=== 表记录统计 ===' as info;
SELECT 'admins' as table_name, COUNT(*) as count FROM admins
UNION ALL
SELECT 'primary_sales' as table_name, COUNT(*) as count FROM primary_sales
UNION ALL
SELECT 'secondary_sales' as table_name, COUNT(*) as count FROM secondary_sales
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as count FROM orders;

-- 显示样本数据（包含 name 字段）
SELECT '=== PRIMARY_SALES 样本 ===' as info;
SELECT id, name, wechat_name, sales_code FROM primary_sales LIMIT 2;

SELECT '=== SECONDARY_SALES 样本 ===' as info;
SELECT id, name, wechat_name, sales_code, status FROM secondary_sales LIMIT 3;

SELECT '=== ORDERS 样本 ===' as info;
SELECT id, order_number, sales_code, commission_rate, status FROM orders LIMIT 3;

-- 完成通知
DO $$ 
BEGIN
    RAISE NOTICE '✅ name 字段问题修复完成！';
    RAISE NOTICE '✅ 所有测试数据插入完成！';
    RAISE NOTICE '🧪 现在可以运行功能测试验证';
END $$;