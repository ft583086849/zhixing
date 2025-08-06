-- 🔧 然后插入测试数据
-- 在字段类型修复后，安全插入测试数据

-- ============================================================================
-- 步骤1：彻底清理现有测试数据
-- ============================================================================

-- 删除测试数据（按依赖关系顺序）
DELETE FROM orders WHERE 
    order_number LIKE 'ORD_TEST%' 
    OR tradingview_username LIKE '%test_%'
    OR sales_code LIKE '%TEST%';

DELETE FROM secondary_sales WHERE 
    sales_code LIKE '%TEST%' 
    OR wechat_name LIKE '%test_%';

DELETE FROM primary_sales WHERE 
    sales_code LIKE '%TEST%' 
    OR wechat_name LIKE '%test_%';

-- 删除任何有NULL值的记录
DELETE FROM orders WHERE 
    sales_code IS NULL 
    OR tradingview_username IS NULL 
    OR amount IS NULL 
    OR commission_rate IS NULL;

DELETE FROM primary_sales WHERE 
    sales_code IS NULL 
    OR wechat_name IS NULL 
    OR name IS NULL;

DELETE FROM secondary_sales WHERE 
    sales_code IS NULL 
    OR wechat_name IS NULL 
    OR name IS NULL;

-- ============================================================================
-- 步骤2：插入管理员测试数据
-- ============================================================================

INSERT INTO admins (username, password_hash, role, created_at, updated_at) 
VALUES ('admin', '$2b$10$test_hash_for_admin', 'super_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 步骤3：插入一级分销测试数据
-- ============================================================================

INSERT INTO primary_sales (
    name,
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
    'Primary Sales Test 001',
    'test_primary_001', 
    'PS_TEST001', 
    'SR_TEST001', 
    'alipay', 
    'test001@alipay.com',
    '测试一级',
    40.00,  -- DECIMAL(5,2) 格式：40.00%
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (sales_code) DO UPDATE SET
    name = EXCLUDED.name,
    wechat_name = EXCLUDED.wechat_name,
    payment_address = EXCLUDED.payment_address,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 步骤4：插入二级分销测试数据
-- ============================================================================

-- 关联型二级分销
INSERT INTO secondary_sales (
    name,
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
    'Secondary Linked Test 001',
    'test_secondary_linked_001', 
    'SS_LINKED001', 
    (SELECT id FROM primary_sales WHERE sales_code = 'PS_TEST001'),
    'SR_TEST001',
    'alipay', 
    'linked001@alipay.com',
    '测试二级关联',
    30.00,  -- DECIMAL(5,2) 格式：30.00%
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (sales_code) DO UPDATE SET
    name = EXCLUDED.name,
    wechat_name = EXCLUDED.wechat_name,
    updated_at = CURRENT_TIMESTAMP;

-- 独立型二级分销
INSERT INTO secondary_sales (
    name,
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
    'Secondary Independent Test 001',
    'test_secondary_independent_001', 
    'SS_INDEPENDENT001', 
    'alipay', 
    'independent001@alipay.com',
    '测试二级独立',
    30.00,  -- DECIMAL(5,2) 格式：30.00%
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (sales_code) DO UPDATE SET
    name = EXCLUDED.name,
    wechat_name = EXCLUDED.wechat_name,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 步骤5：插入订单测试数据（小心精度问题）
-- ============================================================================

-- 一级分销订单
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
    commission_rate,  -- DECIMAL(6,4) 格式
    commission_amount,
    primary_sales_id,
    secondary_sales_id,
    config_confirmed,
    created_at,
    updated_at
) VALUES (
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
    0.4000,  -- 40% 佣金率（小数形式，符合 DECIMAL(6,4)）
    39.60,   -- 99.00 * 0.40
    (SELECT id FROM primary_sales WHERE sales_code = 'PS_TEST001'),
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (order_number) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- 二级分销关联订单
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
    commission_rate,  -- DECIMAL(6,4) 格式
    commission_amount,
    primary_sales_id,
    secondary_sales_id,
    config_confirmed,
    created_at,
    updated_at
) VALUES (
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
    0.3000,  -- 30% 佣金率（小数形式，符合 DECIMAL(6,4)）
    29.70,   -- 99.00 * 0.30
    NULL,
    (SELECT id FROM secondary_sales WHERE sales_code = 'SS_LINKED001'),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (order_number) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- 二级分销独立订单
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
    commission_rate,  -- DECIMAL(6,4) 格式
    commission_amount,
    primary_sales_id,
    secondary_sales_id,
    config_confirmed,
    created_at,
    updated_at
) VALUES (
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
    0.3000,  -- 30% 佣金率（小数形式，符合 DECIMAL(6,4)）
    29.70,   -- 99.00 * 0.30
    NULL,
    (SELECT id FROM secondary_sales WHERE sales_code = 'SS_INDEPENDENT001'),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (order_number) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 步骤6：验证插入结果
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

-- 验证数据完整性
SELECT '=== PRIMARY_SALES 样本 ===' as info;
SELECT id, name, wechat_name, sales_code, commission_rate FROM primary_sales WHERE sales_code LIKE '%TEST%';

SELECT '=== SECONDARY_SALES 样本 ===' as info;
SELECT id, name, wechat_name, sales_code, commission_rate, status FROM secondary_sales WHERE sales_code LIKE '%TEST%';

SELECT '=== ORDERS 样本 ===' as info;
SELECT id, order_number, sales_code, commission_rate, commission_amount, status FROM orders WHERE order_number LIKE '%TEST%';

-- 验证关联关系
SELECT '=== 关联关系验证 ===' as info;
SELECT 
    o.order_number,
    o.sales_code,
    o.sales_type,
    CASE 
        WHEN o.primary_sales_id IS NOT NULL THEN ps.name
        WHEN o.secondary_sales_id IS NOT NULL THEN ss.name
        ELSE 'No association'
    END as sales_name
FROM orders o
LEFT JOIN primary_sales ps ON o.primary_sales_id = ps.id
LEFT JOIN secondary_sales ss ON o.secondary_sales_id = ss.id
WHERE o.order_number LIKE '%TEST%';

-- 完成通知
DO $$ 
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ 测试数据插入完成！';
    RAISE NOTICE '📊 数据统计：';
    RAISE NOTICE '   - 管理员：1个';
    RAISE NOTICE '   - 一级分销：1个';
    RAISE NOTICE '   - 二级分销：2个（1个关联+1个独立）';
    RAISE NOTICE '   - 订单：3个';
    RAISE NOTICE '🧪 所有精度问题已解决！';
    RAISE NOTICE '🎯 现在可以运行功能测试：';
    RAISE NOTICE '   node 🧪实际功能测试执行.js';
    RAISE NOTICE '==============================================';
END $$;