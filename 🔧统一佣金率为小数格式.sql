-- 🔧 统一佣金率字段为小数格式
-- 执行时间：2025-01-18
-- 说明：将所有佣金率字段统一为小数格式 DECIMAL(5,4)

-- =====================================================
-- 步骤1: 修改表结构（统一为小数格式）
-- =====================================================

-- 1.1 修改 primary_sales 表
ALTER TABLE primary_sales 
ALTER COLUMN commission_rate TYPE DECIMAL(5,4);

-- 设置默认值为 0.4（40%）
ALTER TABLE primary_sales 
ALTER COLUMN commission_rate SET DEFAULT 0.4000;

-- 1.2 修改 secondary_sales 表
ALTER TABLE secondary_sales 
ALTER COLUMN commission_rate TYPE DECIMAL(5,4);

-- 设置默认值为 0.3（30%）
ALTER TABLE secondary_sales 
ALTER COLUMN commission_rate SET DEFAULT 0.3000;

-- 1.3 orders 表已经是 DECIMAL(5,4)，确认默认值
ALTER TABLE orders 
ALTER COLUMN commission_rate SET DEFAULT 0.3000;

-- =====================================================
-- 步骤2: 清理现有假数据并重置为正确的小数值
-- =====================================================

-- 2.1 清空所有表（因为都是假数据）
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE primary_sales CASCADE;
TRUNCATE TABLE secondary_sales CASCADE;

-- =====================================================
-- 步骤3: 插入测试数据（使用正确的小数格式）
-- =====================================================

-- 3.1 插入一级销售测试数据
INSERT INTO primary_sales (
    wechat_name,
    name,  -- 收款人姓名（必填字段）
    sales_code, 
    payment_method, 
    payment_address,
    chain_name,  -- 链名（chain支付时需要）
    commission_rate,
    created_at
) VALUES 
    ('primary_test_1', '测试一', 'PS_TEST001', 'chain', 'TRC20_TEST_ADDRESS_001', 'TRC20', 0.4000, NOW()),
    ('primary_test_2', '测试二', 'PS_TEST002', 'chain', 'TRC20_TEST_ADDRESS_002', 'TRC20', 0.4000, NOW());

-- 3.2 插入二级销售测试数据
INSERT INTO secondary_sales (
    wechat_name,
    name,  -- 收款人姓名（必填字段）
    sales_code,
    payment_method,
    payment_address,
    chain_name,  -- 链名（chain支付时需要）
    commission_rate,
    primary_sales_id,
    created_at
) VALUES 
    -- 一级销售下的二级销售（佣金率25%）
    ('secondary_test_1', '测试三', 'SS_TEST001', 'chain', 'TRC20_TEST_ADDRESS_003', 'TRC20', 0.2500, 
     (SELECT id FROM primary_sales WHERE sales_code = 'PS_TEST001'), NOW()),
    -- 一级销售下的二级销售（佣金率30%）
    ('secondary_test_2', '测试四', 'SS_TEST002', 'chain', 'TRC20_TEST_ADDRESS_004', 'TRC20', 0.3000, 
     (SELECT id FROM primary_sales WHERE sales_code = 'PS_TEST001'), NOW()),
    -- 独立二级销售（固定30%）
    ('secondary_test_3', '测试五', 'SS_TEST003', 'chain', 'TRC20_TEST_ADDRESS_005', 'TRC20', 0.3000, NULL, NOW());

-- 3.3 插入测试订单
INSERT INTO orders (
    order_number,  -- 订单号（必填字段）
    customer_name,  -- 客户姓名（必填字段）
    sales_code,
    customer_wechat,
    tradingview_username,
    duration,
    amount,
    actual_payment_amount,
    commission_rate,
    commission_amount,
    status,
    created_at,
    config_confirmed
) VALUES 
    -- 一级销售直接订单（40%佣金）
    ('ORD_TEST_001', '测试客户1', 'PS_TEST001', 'customer1', 'tv_user1', '1month', 188.00, 188.00, 0.4000, 75.20, 'confirmed', NOW(), true),
    -- 二级销售订单（25%佣金）
    ('ORD_TEST_002', '测试客户2', 'SS_TEST001', 'customer2', 'tv_user2', '3months', 488.00, 488.00, 0.2500, 122.00, 'confirmed', NOW(), true),
    -- 独立二级销售订单（30%佣金）
    ('ORD_TEST_003', '测试客户3', 'SS_TEST003', 'customer3', 'tv_user3', '1month', 188.00, 188.00, 0.3000, 56.40, 'confirmed', NOW(), true);

-- =====================================================
-- 步骤4: 验证数据
-- =====================================================

-- 4.1 查看一级销售佣金率
SELECT 
    wechat_name,
    sales_code,
    commission_rate,
    commission_rate * 100 || '%' as rate_display
FROM primary_sales;

-- 4.2 查看二级销售佣金率
SELECT 
    wechat_name,
    sales_code,
    commission_rate,
    commission_rate * 100 || '%' as rate_display,
    CASE 
        WHEN primary_sales_id IS NULL THEN '独立二级销售'
        ELSE '一级销售下的二级销售'
    END as sales_type
FROM secondary_sales;

-- 4.3 查看订单佣金计算
SELECT 
    sales_code,
    customer_wechat,
    amount,
    commission_rate,
    commission_rate * 100 || '%' as rate_display,
    commission_amount,
    ROUND(amount * commission_rate, 2) as calculated_commission,
    CASE 
        WHEN ROUND(amount * commission_rate, 2) = commission_amount THEN '✅ 正确'
        ELSE '❌ 错误'
    END as check_result
FROM orders;

-- =====================================================
-- 步骤5: 添加注释说明
-- =====================================================

COMMENT ON COLUMN primary_sales.commission_rate IS '佣金率（小数格式，如0.4表示40%）';
COMMENT ON COLUMN secondary_sales.commission_rate IS '佣金率（小数格式，如0.3表示30%）';
COMMENT ON COLUMN orders.commission_rate IS '该订单使用的佣金率（小数格式）';

-- =====================================================
-- 完成提示
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ 佣金率字段已统一为小数格式！';
    RAISE NOTICE '';
    RAISE NOTICE '📊 数据格式说明：';
    RAISE NOTICE '   - 数据库存储：0.3000（小数）';
    RAISE NOTICE '   - API传输：0.3（小数）';
    RAISE NOTICE '   - 前端显示：30%（百分比）';
    RAISE NOTICE '   - 用户输入：30（输入百分比数字）';
    RAISE NOTICE '';
    RAISE NOTICE '💡 佣金计算示例：';
    RAISE NOTICE '   - 一级销售直接订单：$188 × 0.4 = $75.2';
    RAISE NOTICE '   - 二级销售订单（25%）：$188 × 0.25 = $47';
    RAISE NOTICE '   - 一级销售获得：$188 × (0.4 - 0.25) = $28.2';
    RAISE NOTICE '';
END $$;
