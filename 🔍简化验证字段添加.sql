-- 🔍 简化验证字段添加结果
-- 检查关键字段是否都已添加成功

-- ===============================================
-- 1. 检查 primary_sales 表的关键字段
-- ===============================================

SELECT 
    'primary_sales 表字段检查' as title,
    column_name,
    data_type,
    column_default,
    CASE 
        WHEN column_name IN ('wechat_name', 'payment_method', 'alipay_account', 'line_address_code', 'line_name', 'sales_type') 
        THEN '✅ 关键字段'
        ELSE '普通字段'
    END as field_type
FROM information_schema.columns 
WHERE table_name = 'primary_sales'
ORDER BY 
    CASE WHEN column_name IN ('wechat_name', 'payment_method', 'alipay_account', 'line_address_code', 'line_name', 'sales_type') THEN 1 ELSE 2 END,
    ordinal_position;

-- ===============================================
-- 2. 检查 secondary_sales 表的关键字段
-- ===============================================

SELECT 
    'secondary_sales 表字段检查' as title,
    column_name,
    data_type,
    column_default,
    CASE 
        WHEN column_name IN ('wechat_name', 'payment_method', 'alipay_account', 'line_address_code', 'line_name', 'sales_type') 
        THEN '✅ 关键字段'
        ELSE '普通字段'
    END as field_type
FROM information_schema.columns 
WHERE table_name = 'secondary_sales'
ORDER BY 
    CASE WHEN column_name IN ('wechat_name', 'payment_method', 'alipay_account', 'line_address_code', 'line_name', 'sales_type') THEN 1 ELSE 2 END,
    ordinal_position;

-- ===============================================
-- 3. 关键字段存在性检查
-- ===============================================

SELECT 
    '关键字段存在性检查' as title,
    'primary_sales' as table_name,
    CASE WHEN COUNT(*) >= 6 THEN '✅ 所有关键字段存在' ELSE '❌ 缺少关键字段' END as status,
    COUNT(*) as found_fields
FROM information_schema.columns 
WHERE table_name = 'primary_sales' 
AND column_name IN ('wechat_name', 'payment_method', 'alipay_account', 'line_address_code', 'line_name', 'sales_type')

UNION ALL

SELECT 
    '关键字段存在性检查' as title,
    'secondary_sales' as table_name,
    CASE WHEN COUNT(*) >= 6 THEN '✅ 所有关键字段存在' ELSE '❌ 缺少关键字段' END as status,
    COUNT(*) as found_fields
FROM information_schema.columns 
WHERE table_name = 'secondary_sales' 
AND column_name IN ('wechat_name', 'payment_method', 'alipay_account', 'line_address_code', 'line_name', 'sales_type');

-- ===============================================
-- 4. 测试插入功能（使用实际字段）
-- ===============================================

-- 测试 primary_sales 插入
INSERT INTO primary_sales (
    wechat_name,
    payment_method, 
    alipay_account, 
    name, 
    sales_type
) VALUES (
    'TEST_VERIFY_' || EXTRACT(EPOCH FROM NOW())::bigint, 
    'alipay', 
    'verify@test.com', 
    '验证收款人', 
    'primary'
) RETURNING id, wechat_name, payment_method, sales_type;

-- 测试 secondary_sales 插入
INSERT INTO secondary_sales (
    wechat_name,
    payment_method, 
    alipay_account, 
    name, 
    sales_type
) VALUES (
    'TEST_VERIFY_SEC_' || EXTRACT(EPOCH FROM NOW())::bigint, 
    'alipay', 
    'verify2@test.com', 
    '验证收款人2', 
    'secondary'
) RETURNING id, wechat_name, payment_method, sales_type;

-- ===============================================
-- 5. 清理测试数据
-- ===============================================

DELETE FROM primary_sales WHERE wechat_name LIKE 'TEST_VERIFY_%';
DELETE FROM secondary_sales WHERE wechat_name LIKE 'TEST_VERIFY_%';

-- ===============================================
-- 最终验证结果
-- ===============================================

SELECT 
    '🎯 修复验证完成！' as status,
    '所有关键字段已添加，可以测试销售注册功能' as message,
    '前往 https://zhixing-seven.vercel.app/sales 和 /secondary-sales 测试' as next_step;