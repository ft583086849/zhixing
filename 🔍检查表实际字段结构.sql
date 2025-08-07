-- 🔍 检查表实际字段结构
-- 对比当前表结构与代码期望的字段

-- ===============================================
-- 1. 检查 primary_sales 表的所有字段
-- ===============================================

SELECT 
    'primary_sales' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'primary_sales'
ORDER BY ordinal_position;

-- ===============================================
-- 2. 检查 secondary_sales 表的所有字段
-- ===============================================

SELECT 
    'secondary_sales' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'secondary_sales'
ORDER BY ordinal_position;

-- ===============================================
-- 3. 只验证 sales_type 字段是否存在
-- ===============================================

-- 检查 primary_sales 的 sales_type 字段
SELECT 
    'primary_sales' as table_name,
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'primary_sales' AND column_name = 'sales_type';

-- 检查 secondary_sales 的 sales_type 字段
SELECT 
    'secondary_sales' as table_name,
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'secondary_sales' AND column_name = 'sales_type';

-- ===============================================
-- 4. 简单测试 sales_type 字段 (使用现有字段)
-- ===============================================

-- 测试 primary_sales 插入 (只使用存在的字段)
INSERT INTO primary_sales (
    sales_code,
    name,
    sales_type
) VALUES (
    'VERIFY_PRI_' || EXTRACT(EPOCH FROM NOW())::bigint, 
    '验证收款人', 
    'primary'
) RETURNING id, sales_code, name, sales_type;

-- 清理测试数据
DELETE FROM primary_sales WHERE sales_code LIKE 'VERIFY_PRI_%';

-- ===============================================
-- 验证结果
-- ===============================================

SELECT 
    '✅ sales_type字段检查完成！' as status,
    '如果没有错误，说明sales_type字段添加成功' as message;