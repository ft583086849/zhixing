-- 📊 插入规范化测试数据（统一命名规范）
-- 执行时间：2025-01-18
-- 说明：使用统一的命名规范插入测试数据，方便核算验证

-- =====================================================
-- 先清空现有测试数据
-- =====================================================
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE primary_sales CASCADE;
TRUNCATE TABLE secondary_sales CASCADE;

-- =====================================================
-- 步骤1: 插入一级销售数据
-- =====================================================
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
    ('一级销售张三', '张三', 'PS_ZHANG001', 'chain', 'TRC20_ZHANG_ADDRESS', 'TRC20', 0.4000, NOW()),
    ('一级销售李四', '李四', 'PS_LI001', 'chain', 'TRC20_LI_ADDRESS', 'TRC20', 0.4000, NOW());

-- =====================================================
-- 步骤2: 插入二级销售数据
-- =====================================================
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
    -- 一级销售张三下的二级销售（佣金率25%）
    ('一级下的二级王五', '王五', 'SS_WANG001', 'chain', 'TRC20_WANG_ADDRESS', 'TRC20', 0.2500, 
     (SELECT id FROM primary_sales WHERE sales_code = 'PS_ZHANG001'), NOW()),
    
    -- 一级销售张三下的二级销售（佣金率30%）
    ('一级下的二级赵六', '赵六', 'SS_ZHAO001', 'chain', 'TRC20_ZHAO_ADDRESS', 'TRC20', 0.3000, 
     (SELECT id FROM primary_sales WHERE sales_code = 'PS_ZHANG001'), NOW()),
    
    -- 一级销售李四下的二级销售（佣金率20%）
    ('一级下的二级钱七', '钱七', 'SS_QIAN001', 'chain', 'TRC20_QIAN_ADDRESS', 'TRC20', 0.2000, 
     (SELECT id FROM primary_sales WHERE sales_code = 'PS_LI001'), NOW()),
    
    -- 独立二级销售（固定30%）
    ('独立二级孙八', '孙八', 'SS_SUN001', 'chain', 'TRC20_SUN_ADDRESS', 'TRC20', 0.3000, NULL, NOW()),
    ('独立二级周九', '周九', 'SS_ZHOU001', 'chain', 'TRC20_ZHOU_ADDRESS', 'TRC20', 0.3000, NULL, NOW());

-- =====================================================
-- 步骤3: 插入订单数据
-- =====================================================
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
    config_confirmed  -- 添加配置确认字段
) VALUES 
    -- 一级销售张三的直接用户订单（40%佣金）
    ('ORD_2025_001', '客户A', 'PS_ZHANG001', '一级销售张三的客户A', 'tv_zhang_userA', '1month', 188.00, 188.00, 0.4000, 75.20, 'confirmed', NOW(), true),
    ('ORD_2025_002', '客户B', 'PS_ZHANG001', '一级销售张三的客户B', 'tv_zhang_userB', '3months', 488.00, 488.00, 0.4000, 195.20, 'confirmed', NOW(), true),
    
    -- 一级销售李四的直接用户订单（40%佣金）
    ('ORD_2025_003', '客户C', 'PS_LI001', '一级销售李四的客户C', 'tv_li_userC', '1month', 188.00, 188.00, 0.4000, 75.20, 'confirmed', NOW(), true),
    
    -- 一级下的二级王五的订单（25%佣金，一级获得15%）
    ('ORD_2025_004', '客户D', 'SS_WANG001', '二级王五的客户D', 'tv_wang_userD', '1month', 188.00, 188.00, 0.2500, 47.00, 'confirmed', NOW(), true),
    ('ORD_2025_005', '客户E', 'SS_WANG001', '二级王五的客户E', 'tv_wang_userE', '3months', 488.00, 488.00, 0.2500, 122.00, 'confirmed', NOW(), true),
    
    -- 一级下的二级赵六的订单（30%佣金，一级获得10%）
    ('ORD_2025_006', '客户F', 'SS_ZHAO001', '二级赵六的客户F', 'tv_zhao_userF', '6months', 688.00, 688.00, 0.3000, 206.40, 'confirmed', NOW(), true),
    
    -- 一级下的二级钱七的订单（20%佣金，一级获得20%）
    ('ORD_2025_007', '客户G', 'SS_QIAN001', '二级钱七的客户G', 'tv_qian_userG', '1month', 188.00, 188.00, 0.2000, 37.60, 'confirmed', NOW(), true),
    
    -- 独立二级孙八的订单（30%佣金）
    ('ORD_2025_008', '客户H', 'SS_SUN001', '独立二级孙八的客户H', 'tv_sun_userH', '1month', 188.00, 188.00, 0.3000, 56.40, 'confirmed', NOW(), true),
    ('ORD_2025_009', '客户I', 'SS_SUN001', '独立二级孙八的客户I', 'tv_sun_userI', '3months', 488.00, 488.00, 0.3000, 146.40, 'confirmed', NOW(), true),
    
    -- 独立二级周九的订单（30%佣金）
    ('ORD_2025_010', '客户J', 'SS_ZHOU001', '独立二级周九的客户J', 'tv_zhou_userJ', '1year', 1588.00, 1588.00, 0.3000, 476.40, 'confirmed', NOW(), true);

-- =====================================================
-- 步骤4: 验证数据和计算
-- =====================================================

-- 4.1 查看销售层级结构
SELECT 
    '一级销售' as 销售类型,
    wechat_name as 微信名,
    sales_code as 销售代码,
    commission_rate as 佣金率,
    commission_rate * 100 || '%' as 佣金率显示
FROM primary_sales
UNION ALL
SELECT 
    CASE 
        WHEN primary_sales_id IS NOT NULL THEN '一级下的二级'
        ELSE '独立二级'
    END as 销售类型,
    wechat_name as 微信名,
    sales_code as 销售代码,
    commission_rate as 佣金率,
    commission_rate * 100 || '%' as 佣金率显示
FROM secondary_sales
ORDER BY 销售类型, 微信名;

-- 4.2 统计各类型订单
SELECT 
    CASE 
        WHEN sales_code LIKE 'PS_%' THEN '一级销售直接订单'
        WHEN sales_code IN (
            SELECT sales_code FROM secondary_sales WHERE primary_sales_id IS NOT NULL
        ) THEN '一级下的二级订单'
        ELSE '独立二级订单'
    END as 订单类型,
    COUNT(*) as 订单数量,
    SUM(amount) as 总金额,
    SUM(commission_amount) as 总佣金
FROM orders
GROUP BY 订单类型;

-- 4.3 一级销售张三的综合统计（包含其下二级销售）
WITH zhang_stats AS (
    -- 张三直接订单
    SELECT 
        '直接订单' as 来源,
        COUNT(*) as 订单数,
        SUM(amount) as 金额,
        SUM(commission_amount) as 佣金
    FROM orders 
    WHERE sales_code = 'PS_ZHANG001'
    
    UNION ALL
    
    -- 张三下的二级销售订单
    SELECT 
        '二级销售订单' as 来源,
        COUNT(*) as 订单数,
        SUM(o.amount) as 金额,
        SUM(o.amount * (0.4 - s.commission_rate)) as 佣金  -- 一级获得的部分
    FROM orders o
    JOIN secondary_sales s ON o.sales_code = s.sales_code
    WHERE s.primary_sales_id = (SELECT id FROM primary_sales WHERE sales_code = 'PS_ZHANG001')
)
SELECT 
    '一级销售张三' as 销售名称,
    SUM(订单数) as 总订单数,
    SUM(金额) as 总金额,
    SUM(佣金) as 总佣金,
    ROUND(SUM(佣金) / SUM(金额) * 100, 2) || '%' as 综合佣金率
FROM zhang_stats;

-- 4.4 验证佣金计算
SELECT 
    sales_code as 销售代码,
    customer_wechat as 客户,
    amount as 订单金额,
    commission_rate * 100 || '%' as 佣金率,
    commission_amount as 实际佣金,
    ROUND(amount * commission_rate, 2) as 计算佣金,
    CASE 
        WHEN ROUND(amount * commission_rate, 2) = commission_amount THEN '✅ 正确'
        ELSE '❌ 错误'
    END as 验证结果
FROM orders
ORDER BY sales_code;

-- =====================================================
-- 步骤5: 显示核算结果
-- =====================================================
DO $$
DECLARE
    v_primary_direct_count INTEGER;
    v_primary_direct_amount DECIMAL;
    v_secondary_linked_count INTEGER;
    v_secondary_linked_amount DECIMAL;
    v_secondary_independent_count INTEGER;
    v_secondary_independent_amount DECIMAL;
BEGIN
    -- 统计一级销售直接订单
    SELECT COUNT(*), COALESCE(SUM(amount), 0) INTO v_primary_direct_count, v_primary_direct_amount
    FROM orders WHERE sales_code LIKE 'PS_%';
    
    -- 统计一级下的二级订单
    SELECT COUNT(*), COALESCE(SUM(o.amount), 0) 
    INTO v_secondary_linked_count, v_secondary_linked_amount
    FROM orders o
    JOIN secondary_sales s ON o.sales_code = s.sales_code
    WHERE s.primary_sales_id IS NOT NULL;
    
    -- 统计独立二级订单
    SELECT COUNT(*), COALESCE(SUM(o.amount), 0)
    INTO v_secondary_independent_count, v_secondary_independent_amount
    FROM orders o
    JOIN secondary_sales s ON o.sales_code = s.sales_code
    WHERE s.primary_sales_id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 数据核算结果';
    RAISE NOTICE '=================================';
    RAISE NOTICE '一级销售直接订单：% 个，金额 $%', v_primary_direct_count, v_primary_direct_amount;
    RAISE NOTICE '一级下的二级订单：% 个，金额 $%', v_secondary_linked_count, v_secondary_linked_amount;
    RAISE NOTICE '独立二级销售订单：% 个，金额 $%', v_secondary_independent_count, v_secondary_independent_amount;
    RAISE NOTICE '=================================';
    RAISE NOTICE '总计：% 个订单，总金额 $%', 
        v_primary_direct_count + v_secondary_linked_count + v_secondary_independent_count,
        v_primary_direct_amount + v_secondary_linked_amount + v_secondary_independent_amount;
    RAISE NOTICE '';
    RAISE NOTICE '✅ 测试数据已插入，可以开始核算验证！';
END $$;
