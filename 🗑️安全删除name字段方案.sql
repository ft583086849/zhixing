-- 🗑️ 安全删除name字段方案
-- 请在Supabase SQL Editor中按顺序执行

-- =============================================
-- 第1步：检查name字段的使用情况
-- =============================================
SELECT 
    'primary_sales' as table_name,
    COUNT(*) as total_records,
    COUNT(name) as records_with_name,
    COUNT(*) - COUNT(name) as records_without_name
FROM primary_sales
UNION ALL
SELECT 
    'secondary_sales',
    COUNT(*),
    COUNT(name),
    COUNT(*) - COUNT(name)
FROM secondary_sales;

-- =============================================
-- 第2步：备份name字段数据（以防需要）
-- =============================================
-- 创建备份表
CREATE TABLE IF NOT EXISTS sales_name_backup AS
SELECT 
    'primary' as sales_type,
    id,
    sales_code,
    wechat_name,
    name,
    current_timestamp as backup_time
FROM primary_sales
WHERE name IS NOT NULL
UNION ALL
SELECT 
    'secondary' as sales_type,
    id,
    sales_code,
    wechat_name,
    name,
    current_timestamp as backup_time
FROM secondary_sales
WHERE name IS NOT NULL;

-- 查看备份结果
SELECT COUNT(*) as backed_up_records FROM sales_name_backup;

-- =============================================
-- 第3步：删除所有相关的触发器
-- =============================================
-- 删除primary_sales表的触发器
DROP TRIGGER IF EXISTS smart_handle_sales_name_trigger ON primary_sales;
DROP TRIGGER IF EXISTS handle_primary_sales_name_trigger ON primary_sales;
DROP TRIGGER IF EXISTS ensure_primary_sales_name ON primary_sales;
DROP TRIGGER IF EXISTS ensure_sales_name_trigger ON primary_sales;

-- 删除secondary_sales表的触发器（如果有）
DROP TRIGGER IF EXISTS smart_handle_sales_name_trigger ON secondary_sales;
DROP TRIGGER IF EXISTS handle_secondary_sales_name_trigger ON secondary_sales;
DROP TRIGGER IF EXISTS ensure_secondary_sales_name ON secondary_sales;

-- 删除相关函数
DROP FUNCTION IF EXISTS smart_handle_sales_name();
DROP FUNCTION IF EXISTS handle_primary_sales_name();
DROP FUNCTION IF EXISTS ensure_sales_name();
DROP FUNCTION IF EXISTS fix_primary_sales_name();
DROP FUNCTION IF EXISTS handle_secondary_sales_name();

-- =============================================
-- 第4步：删除name字段
-- =============================================
-- 从primary_sales表删除name字段
ALTER TABLE primary_sales 
DROP COLUMN IF EXISTS name;

-- 从secondary_sales表删除name字段
ALTER TABLE secondary_sales 
DROP COLUMN IF EXISTS name;

-- =============================================
-- 第5步：验证删除结果
-- =============================================
-- 检查表结构
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('primary_sales', 'secondary_sales')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =============================================
-- 第6步：测试插入（确保删除后能正常工作）
-- =============================================
-- 测试插入primary_sales
INSERT INTO primary_sales (
    wechat_name,
    sales_code,
    payment_method,
    crypto_address,
    commission_rate
) VALUES (
    'test_after_delete_' || extract(epoch from now())::text,
    'PRI' || extract(epoch from now())::text,
    'crypto',
    '0xTest' || extract(epoch from now())::text,
    40
) RETURNING *;

-- 测试插入secondary_sales
INSERT INTO secondary_sales (
    wechat_name,
    sales_code,
    payment_method,
    crypto_address,
    commission_rate
) VALUES (
    'test_secondary_' || extract(epoch from now())::text,
    'SEC' || extract(epoch from now())::text,
    'crypto',
    '0xTest' || extract(epoch from now())::text,
    30
) RETURNING *;

-- 清理测试数据
DELETE FROM primary_sales WHERE wechat_name LIKE 'test_after_delete_%';
DELETE FROM secondary_sales WHERE wechat_name LIKE 'test_secondary_%';

-- =============================================
-- 完成！
-- =============================================
SELECT '✅ name字段已成功删除' as status;

-- =============================================
-- 如果需要回滚（恢复name字段）
-- =============================================
/*
-- 重新添加name字段
ALTER TABLE primary_sales 
ADD COLUMN name VARCHAR(255);

ALTER TABLE secondary_sales 
ADD COLUMN name VARCHAR(255);

-- 从备份恢复数据
UPDATE primary_sales p
SET name = b.name
FROM sales_name_backup b
WHERE b.sales_type = 'primary' 
AND b.id = p.id;

UPDATE secondary_sales s
SET name = b.name
FROM sales_name_backup b
WHERE b.sales_type = 'secondary' 
AND b.id = s.id;
*/
