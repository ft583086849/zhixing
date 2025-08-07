-- 🔍 验证 sales_type 字段添加结果
-- 检查 primary_sales 和 secondary_sales 表是否都有 sales_type 字段

-- ===============================================
-- 1. 检查 primary_sales 表的 sales_type 字段
-- ===============================================

SELECT 
    'primary_sales' as table_name,
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'primary_sales' AND column_name = 'sales_type';

-- ===============================================
-- 2. 检查 secondary_sales 表的 sales_type 字段
-- ===============================================

SELECT 
    'secondary_sales' as table_name,
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'secondary_sales' AND column_name = 'sales_type';

-- ===============================================
-- 3. 检查 sales_type_enum 枚举类型定义
-- ===============================================

SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'sales_type_enum'
ORDER BY e.enumsortorder;

-- ===============================================
-- 4. 检查两个表的完整字段列表（确认字段存在）
-- ===============================================

-- primary_sales 表所有字段
SELECT 
    'primary_sales' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'primary_sales'
ORDER BY ordinal_position;

-- secondary_sales 表所有字段
SELECT 
    'secondary_sales' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'secondary_sales'
ORDER BY ordinal_position;

-- ===============================================
-- 5. 测试插入验证（确认字段可用）
-- ===============================================

-- 测试 primary_sales 插入
INSERT INTO primary_sales (
    wechat_name, 
    payment_method, 
    alipay_account, 
    name, 
    sales_type
) VALUES (
    'VERIFY_PRIMARY_' || EXTRACT(EPOCH FROM NOW())::bigint, 
    'alipay', 
    'verify@test.com', 
    '验证收款人', 
    'primary'
) RETURNING id, wechat_name, sales_type;

-- 测试 secondary_sales 插入
INSERT INTO secondary_sales (
    wechat_name, 
    payment_method, 
    alipay_account, 
    name, 
    sales_type
) VALUES (
    'VERIFY_SECONDARY_' || EXTRACT(EPOCH FROM NOW())::bigint, 
    'alipay', 
    'verify2@test.com', 
    '验证收款人2', 
    'secondary'
) RETURNING id, wechat_name, sales_type;

-- ===============================================
-- 6. 清理验证数据
-- ===============================================

-- 删除刚才插入的验证数据
DELETE FROM primary_sales WHERE wechat_name LIKE 'VERIFY_PRIMARY_%';
DELETE FROM secondary_sales WHERE wechat_name LIKE 'VERIFY_SECONDARY_%';

-- ===============================================
-- 验证结果总结
-- ===============================================

SELECT 
    '✅ sales_type字段验证完成！' as status,
    '如果没有错误，说明字段添加成功，可以测试销售注册功能了' as message;