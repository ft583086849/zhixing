-- 修复secondary_sales表结构，支持独立注册
-- 允许primary_sales_id为NULL，支持独立二级销售

ALTER TABLE secondary_sales 
MODIFY COLUMN primary_sales_id INT NULL COMMENT '一级销售ID，独立注册时为NULL';

-- 删除外键约束（如果存在）
ALTER TABLE secondary_sales 
DROP FOREIGN KEY IF EXISTS secondary_sales_ibfk_1;

-- 重新添加外键约束（允许NULL）
ALTER TABLE secondary_sales 
ADD CONSTRAINT fk_secondary_primary 
FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id) ON DELETE SET NULL;

-- 验证修改结果
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'secondary_sales' 
  AND COLUMN_NAME = 'primary_sales_id';