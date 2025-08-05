-- 修复 secondary_sales 表结构以支持独立二级销售注册
-- 问题：primary_sales_id 字段当前为 NOT NULL，阻止独立注册
-- 解决方案：将 primary_sales_id 字段修改为可空（NULLABLE）

-- ===============================================
-- 二级销售表结构修复脚本
-- 创建时间：2025年8月5日
-- 目的：支持独立二级销售注册功能
-- ===============================================

USE zhixing;

-- 1. 检查当前表结构
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zhixing' 
AND TABLE_NAME = 'secondary_sales' 
AND COLUMN_NAME = 'primary_sales_id';

-- 2. 修改 primary_sales_id 字段为可空
-- 这是关键修复：允许独立二级销售注册时 primary_sales_id 为 NULL
ALTER TABLE secondary_sales 
MODIFY COLUMN primary_sales_id INT NULL 
COMMENT '关联的一级销售ID（独立注册时为NULL）';

-- 3. 验证修改后的表结构
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zhixing' 
AND TABLE_NAME = 'secondary_sales' 
AND COLUMN_NAME = 'primary_sales_id';

-- 4. 创建索引优化查询性能
-- 为支持独立注册和关联注册的混合查询
CREATE INDEX IF NOT EXISTS idx_secondary_sales_primary_id_nullable 
ON secondary_sales (primary_sales_id);

-- 5. 添加数据完整性检查
-- 确保关联注册的二级销售有有效的一级销售ID
-- 独立注册的二级销售 primary_sales_id 为 NULL

-- 验证现有数据的完整性
SELECT 
    COUNT(*) as total_secondary_sales,
    COUNT(primary_sales_id) as linked_sales,
    COUNT(*) - COUNT(primary_sales_id) as independent_sales
FROM secondary_sales;

-- 6. 检查外键约束（如果存在）
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'zhixing' 
AND TABLE_NAME = 'secondary_sales' 
AND COLUMN_NAME = 'primary_sales_id';

-- 7. 如果有外键约束，需要先删除再重新创建（可选）
-- 注意：只有在存在外键约束时才需要执行以下步骤

-- 删除现有外键约束（如果存在）
-- ALTER TABLE secondary_sales DROP FOREIGN KEY fk_secondary_primary_sales;

-- 重新创建外键约束，允许 NULL 值
-- ALTER TABLE secondary_sales 
-- ADD CONSTRAINT fk_secondary_primary_sales 
-- FOREIGN KEY (primary_sales_id) 
-- REFERENCES primary_sales(id) 
-- ON DELETE SET NULL 
-- ON UPDATE CASCADE;

-- ===============================================
-- 修复完成验证
-- ===============================================

-- 最终验证：检查表结构是否正确修复
DESCRIBE secondary_sales;

-- 检查 primary_sales_id 字段是否已改为 NULL
SELECT 
    CASE 
        WHEN IS_NULLABLE = 'YES' THEN '✅ 修复成功：primary_sales_id 字段已改为可空'
        ELSE '❌ 修复失败：primary_sales_id 字段仍为非空'
    END as fix_status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zhixing' 
AND TABLE_NAME = 'secondary_sales' 
AND COLUMN_NAME = 'primary_sales_id';

-- ===============================================
-- 使用说明
-- ===============================================

/*
修复完成后，系统将支持两种二级销售注册方式：

1. 独立注册：
   - URL: /secondary-sales
   - primary_sales_id: NULL
   - 不与任何一级销售关联

2. 关联注册：
   - URL: /secondary-sales?sales_code=SR...
   - primary_sales_id: 具体的一级销售ID
   - 与指定一级销售建立关联关系

数据示例：
- 独立销售：{id: 1, wechat_name: 'user1', primary_sales_id: NULL}
- 关联销售：{id: 2, wechat_name: 'user2', primary_sales_id: 5}
*/