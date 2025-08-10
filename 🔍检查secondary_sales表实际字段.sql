-- 🔍 明确检查 secondary_sales 表的实际字段结构
-- 请在 Supabase SQL Editor 中执行此脚本

-- =============================================
-- 1. 查看 secondary_sales 表的所有字段
-- =============================================
SELECT 
    column_name as "字段名",
    data_type as "数据类型",
    is_nullable as "可否为空",
    column_default as "默认值"
FROM information_schema.columns
WHERE table_name = 'secondary_sales'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 2. 明确检查 payment 相关字段
-- =============================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'secondary_sales' 
            AND column_name = 'payment_account'
            AND table_schema = 'public'
        ) 
        THEN '✅ payment_account 字段【存在】' 
        ELSE '❌ payment_account 字段【不存在】' 
    END as "payment_account字段状态",
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'secondary_sales' 
            AND column_name = 'payment_address'
            AND table_schema = 'public'
        ) 
        THEN '✅ payment_address 字段【存在】' 
        ELSE '❌ payment_address 字段【不存在】' 
    END as "payment_address字段状态",
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'secondary_sales' 
            AND column_name = 'payment_method'
            AND table_schema = 'public'
        ) 
        THEN '✅ payment_method 字段【存在】' 
        ELSE '❌ payment_method 字段【不存在】' 
    END as "payment_method字段状态";

-- =============================================
-- 3. 查看表中的实际数据示例（前3条）
-- =============================================
SELECT * FROM secondary_sales LIMIT 3;

-- =============================================
-- 4. 统计各字段的数据情况
-- =============================================
SELECT 
    COUNT(*) as "总记录数",
    COUNT(payment_address) as "payment_address有值数量",
    COUNT(payment_method) as "payment_method有值数量",
    COUNT(wechat_name) as "wechat_name有值数量"
FROM secondary_sales;

-- =============================================
-- 5. 查看表的完整DDL定义（如果权限允许）
-- =============================================
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'secondary_sales'
AND table_schema = 'public'
ORDER BY ordinal_position;
