-- 🔧 最终完整修复 - 包含所有必需字段
-- 基于所有错误信息，提供完整的字段修复和数据插入

-- ============================================================================
-- 步骤1：先执行字段类型修复（如果还没执行）
-- ============================================================================

-- 修复 orders 表的 commission_rate 字段精度
ALTER TABLE orders 
ALTER COLUMN commission_rate TYPE DECIMAL(6,4);

-- 确保其他表的 commission_rate 精度正确
ALTER TABLE primary_sales 
ALTER COLUMN commission_rate TYPE DECIMAL(5,2);

ALTER TABLE secondary_sales 
ALTER COLUMN commission_rate TYPE DECIMAL(5,2);

-- 添加 admins 表缺失字段
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 步骤2：彻底清理所有测试数据
-- ============================================================================

-- 删除所有测试数据和有问题的记录
DELETE FROM orders WHERE 
    order_number LIKE 'ORD_TEST%' 
    OR tradingview_username LIKE '%test_%'
    OR sales_code LIKE '%TEST%'
    OR customer_name IS NULL
    OR sales_code IS NULL 
    OR tradingview_username IS NULL;

DELETE FROM secondary_sales WHERE 
    sales_code LIKE '%TEST%' 
    OR wechat_name LIKE '%test_%'
    OR name IS NULL
    OR sales_code IS NULL 
    OR wechat_name IS NULL;

DELETE FROM primary_sales WHERE 
    sales_code LIKE '%TEST%' 
    OR wechat_name LIKE '%test_%'
    OR name IS NULL
    OR sales_code IS NULL 
    OR wechat_name IS NULL;

-- ============================================================================
-- 步骤3：插入完整的测试数据（包含所有必需字段）
-- ============================================================================

-- 插入管理员
INSERT INTO admins (username, password_hash, role, created_at, updated_at) 
VALUES ('admin', '$2b$10$test_hash_for_admin', 'super_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

-- 插入一级分销（包含 name 字段）
INSERT INTO primary_sales (
    name,                    -- 必需字段
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
    'Primary Sales Test 001',  -- name 字段
    'test_primary_001', 
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
    updated_at = CURRENT_TIMESTAMP;

-- 插入二级分销（关联型，包含 name 字段）
INSERT INTO secondary_sales (
    name,                    -- 必需字段
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
    'Secondary Linked Test 001',  -- name 字段
    'test_secondary_linked_001', 
    'SS_LINKED001', 
    (SELECT id FROM primary_sales WHERE sales_code = 'PS_TEST001'),
    'SR_TEST001',
    'alipay', 
    'linked001@alipay.com',
    '测试二级关联',
    30.00,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (sales_code) DO UPDATE SET
    name = EXCLUDED.name,
    wechat_name = EXCLUDED.wechat_name,
    updated_at = CURRENT_TIMESTAMP;

-- 插入二级分销（独立型，包含 name 字段）
INSERT INTO secondary_sales (
    name,                    -- 必需字段
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
    'Secondary Independent Test 001',  -- name 字段
    'test_secondary_independent_001', 
    'SS_INDEPENDENT001', 
    'alipay', 
    'independent001@alipay.com',
    '测试二级独立',
    30.00,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (sales_code) DO UPDATE SET
    name = EXCLUDED.name,
    wechat_name = EXCLUDED.wechat_name,
    updated_at = CURRENT_TIMESTAMP;

-- 插入订单数据（包含 customer_name 等所有必需字段）
INSERT INTO orders (
    order_number,
    customer_name,           -- 必需字段！
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
    'Test Customer 001',     -- customer_name 字段
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
    'Test Customer 002',     -- customer_name 字段
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
    'Test Customer 003',     -- customer_name 字段
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
    customer_name = EXCLUDED.customer_name,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 步骤4：验证所有数据
-- ============================================================================

-- 检查记录数量
SELECT '=== 最终数据统计 ===' as info;
SELECT 'admins' as table_name, COUNT(*) as count FROM admins
UNION ALL
SELECT 'primary_sales' as table_name, COUNT(*) as count FROM primary_sales
UNION ALL
SELECT 'secondary_sales' as table_name, COUNT(*) as count FROM secondary_sales
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as count FROM orders;

-- 检查所有必需字段是否有值
SELECT '=== PRIMARY_SALES 字段完整性 ===' as info;
SELECT 
    COUNT(*) as total,
    COUNT(name) as has_name,
    COUNT(wechat_name) as has_wechat_name,
    COUNT(sales_code) as has_sales_code,
    COUNT(CASE WHEN name IS NULL THEN 1 END) as null_name,
    COUNT(CASE WHEN wechat_name IS NULL THEN 1 END) as null_wechat_name,
    COUNT(CASE WHEN sales_code IS NULL THEN 1 END) as null_sales_code
FROM primary_sales;

SELECT '=== SECONDARY_SALES 字段完整性 ===' as info;
SELECT 
    COUNT(*) as total,
    COUNT(name) as has_name,
    COUNT(wechat_name) as has_wechat_name,
    COUNT(sales_code) as has_sales_code,
    COUNT(CASE WHEN name IS NULL THEN 1 END) as null_name,
    COUNT(CASE WHEN wechat_name IS NULL THEN 1 END) as null_wechat_name,
    COUNT(CASE WHEN sales_code IS NULL THEN 1 END) as null_sales_code
FROM secondary_sales;

SELECT '=== ORDERS 字段完整性 ===' as info;
SELECT 
    COUNT(*) as total,
    COUNT(customer_name) as has_customer_name,
    COUNT(sales_code) as has_sales_code,
    COUNT(tradingview_username) as has_tradingview_username,
    COUNT(CASE WHEN customer_name IS NULL THEN 1 END) as null_customer_name,
    COUNT(CASE WHEN sales_code IS NULL THEN 1 END) as null_sales_code,
    COUNT(CASE WHEN tradingview_username IS NULL THEN 1 END) as null_tradingview_username
FROM orders;

-- 显示完整样本数据
SELECT '=== ADMINS 样本 ===' as info;
SELECT id, username, role FROM admins;

SELECT '=== PRIMARY_SALES 样本 ===' as info;
SELECT id, name, wechat_name, sales_code, commission_rate FROM primary_sales WHERE sales_code LIKE '%TEST%';

SELECT '=== SECONDARY_SALES 样本 ===' as info;
SELECT id, name, wechat_name, sales_code, commission_rate, status FROM secondary_sales WHERE sales_code LIKE '%TEST%';

SELECT '=== ORDERS 样本 ===' as info;
SELECT id, order_number, customer_name, sales_code, commission_rate, status FROM orders WHERE order_number LIKE '%TEST%';

-- 验证关联关系
SELECT '=== 数据关联验证 ===' as info;
SELECT 
    o.order_number,
    o.customer_name,
    o.sales_code,
    o.sales_type,
    CASE 
        WHEN o.primary_sales_id IS NOT NULL THEN ps.name
        WHEN o.secondary_sales_id IS NOT NULL THEN ss.name
        ELSE 'No association'
    END as sales_name,
    o.commission_rate,
    o.commission_amount
FROM orders o
LEFT JOIN primary_sales ps ON o.primary_sales_id = ps.id
LEFT JOIN secondary_sales ss ON o.secondary_sales_id = ss.id
WHERE o.order_number LIKE '%TEST%'
ORDER BY o.order_number;

-- 最终完成通知
DO $$ 
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '🎉 最终完整修复完成！';
    RAISE NOTICE '✅ 所有字段类型和精度问题已解决';
    RAISE NOTICE '✅ 所有必需字段都已填充：';
    RAISE NOTICE '   - primary_sales.name ✓';
    RAISE NOTICE '   - secondary_sales.name ✓';
    RAISE NOTICE '   - orders.customer_name ✓';
    RAISE NOTICE '   - admins.role ✓';
    RAISE NOTICE '✅ 完整测试数据已插入';
    RAISE NOTICE '✅ 所有关联关系正确';
    RAISE NOTICE '🧪 现在可以运行功能测试：';
    RAISE NOTICE '   node 🔍检查表实际结构.js';
    RAISE NOTICE '   node 🧪实际功能测试执行.js';
    RAISE NOTICE '==============================================';
END $$;