-- 添加缺失的销售代码字段到primary_sales表
-- 这些字段是sales_code标准的核心

-- 1. 添加sales_code字段 - 用户购买时使用的代码
ALTER TABLE primary_sales ADD COLUMN sales_code VARCHAR(16) UNIQUE COMMENT '一级销售的用户购买代码';

-- 2. 添加secondary_registration_code字段 - 二级销售注册时使用的代码  
ALTER TABLE primary_sales ADD COLUMN secondary_registration_code VARCHAR(16) UNIQUE COMMENT '二级销售注册代码';

-- 3. 为现有数据生成sales_code（如果有的话）
UPDATE primary_sales 
SET sales_code = CONCAT('PS', LPAD(id, 6, '0'), SUBSTRING(MD5(CONCAT(id, wechat_name)), 1, 8))
WHERE sales_code IS NULL;

-- 4. 为现有数据生成secondary_registration_code（如果有的话）
UPDATE primary_sales 
SET secondary_registration_code = CONCAT('SR', LPAD(id, 6, '0'), SUBSTRING(MD5(CONCAT(id, wechat_name, 'sec')), 1, 8))
WHERE secondary_registration_code IS NULL;

-- 5. 验证字段已添加
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zhixing' 
  AND TABLE_NAME = 'primary_sales' 
  AND COLUMN_NAME IN ('sales_code', 'secondary_registration_code');

-- 6. 验证数据完整性
SELECT id, wechat_name, sales_code, secondary_registration_code 
FROM primary_sales 
LIMIT 5;