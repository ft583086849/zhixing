-- 添加催单功能相关字段到orders表
-- 执行时间：2025-08-03

-- 1. 添加催单状态字段
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_reminded BOOLEAN DEFAULT FALSE COMMENT '是否已催单';

-- 2. 添加催单日期字段
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS reminder_date DATETIME NULL COMMENT '催单日期';

-- 3. 添加索引以提高查询性能
ALTER TABLE orders 
ADD INDEX IF NOT EXISTS idx_is_reminded (is_reminded),
ADD INDEX IF NOT EXISTS idx_reminder_date (reminder_date);

-- 4. 验证字段添加成功
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT, 
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'orders' 
AND COLUMN_NAME IN ('is_reminded', 'reminder_date'); 