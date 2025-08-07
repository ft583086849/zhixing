-- 创建完整的模拟数据用于测试管理后台功能
-- 目标: 创建一级销售、二级销售、订单数据用于功能验证

-- 1. 插入模拟一级销售数据
INSERT INTO primary_sales (
    sales_code, name, wechat_name, phone, email, 
    payment_method, payment_address, sales_type, 
    commission_rate, created_at, updated_at
) VALUES 
('PRI1754600000001', '张一级', 'zhang_primary_001', '13800000001', 'zhang@example.com', 
 'alipay', 'zhang_alipay@163.com', 'primary', 
 0.4000, NOW(), NOW()),
('PRI1754600000002', '李一级', 'li_primary_002', '13800000002', 'li@example.com', 
 'crypto', 'TRX123...ABC', 'primary', 
 0.4000, NOW(), NOW());

-- 2. 插入模拟二级销售数据
INSERT INTO secondary_sales (
    sales_code, name, wechat_name, phone, email, 
    payment_method, payment_address, sales_type,
    commission_rate, created_at, updated_at
) VALUES 
('SEC1754600000001', '王二级', 'wang_secondary_001', '13800000101', 'wang@example.com', 
 'alipay', 'wang_alipay@163.com', 'secondary', 
 0.3000, NOW(), NOW()),
('SEC1754600000002', '刘二级', 'liu_secondary_002', '13800000102', 'liu@example.com', 
 'crypto', 'TRX456...DEF', 'secondary', 
 0.3000, NOW(), NOW());

-- 3. 插入模拟订单数据
INSERT INTO orders (
    order_number, sales_code, sales_type,
    customer_name, customer_wechat, tradingview_username,
    duration, amount, payment_method, payment_time,
    purchase_type, status, payment_status,
    commission_rate, commission_amount,
    created_at, updated_at
) VALUES 
-- 一级销售的订单
('ORD1754600001', 'PRI1754600000001', 'primary',
 'customer001', 'customer_wx_001', 'tradingview_user_001',
 '1month', 188.00, 'alipay', NOW(),
 'immediate', 'confirmed', 'paid',
 0.4000, 75.20,
 NOW(), NOW()),

('ORD1754600002', 'PRI1754600000001', 'primary',
 'customer002', 'customer_wx_002', 'tradingview_user_002',
 '3months', 488.00, 'alipay', NOW(),
 'immediate', 'pending', 'pending',
 0.4000, 195.20,
 NOW(), NOW()),

-- 二级销售的订单
('ORD1754600003', 'SEC1754600000001', 'secondary',
 'customer003', 'customer_wx_003', 'tradingview_user_003',
 '7days', 0.00, 'alipay', NOW(),
 'immediate', 'confirmed', 'free',
 0.0000, 0.00,
 NOW(), NOW()),

('ORD1754600004', 'SEC1754600000001', 'secondary',
 'customer004', 'customer_wx_004', 'tradingview_user_004',
 '6months', 688.00, 'crypto', NOW(),
 'immediate', 'confirmed', 'paid',
 0.3000, 206.40,
 NOW(), NOW()),

('ORD1754600005', 'SEC1754600000002', 'secondary',
 'customer005', 'customer_wx_005', 'tradingview_user_005',
 '1year', 1588.00, 'crypto', NOW(),
 'advance', 'pending', 'pending',
 0.3000, 476.40,
 NOW(), NOW());

-- 4. 验证插入的数据
SELECT '=== 验证模拟数据 ===' as test_section;

-- 统计数据
SELECT 
    '一级销售数量' as 项目,
    COUNT(*) as 数量
FROM primary_sales
UNION ALL
SELECT 
    '二级销售数量' as 项目,
    COUNT(*) as 数量
FROM secondary_sales
UNION ALL
SELECT 
    '订单总数' as 项目,
    COUNT(*) as 数量
FROM orders
UNION ALL
SELECT 
    '订单总金额' as 项目,
    SUM(amount) as 数量
FROM orders
UNION ALL
SELECT 
    '佣金总额' as 项目,
    SUM(commission_amount) as 数量
FROM orders;
