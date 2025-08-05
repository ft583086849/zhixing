-- 完整的销售代码标准化数据库修复脚本
-- 确保所有表都有正确的sales_code字段和数据关联

-- 1. 为primary_sales表添加标准字段
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS sales_code VARCHAR(16) UNIQUE COMMENT '一级销售的用户购买代码';
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS secondary_registration_code VARCHAR(16) UNIQUE COMMENT '二级销售注册代码';

-- 2. 为secondary_sales表添加标准字段  
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS sales_code VARCHAR(16) UNIQUE COMMENT '二级销售的用户购买代码';

-- 3. 为现有的primary_sales数据生成标准sales_code
UPDATE primary_sales 
SET sales_code = CONCAT('PS', LPAD(id, 6, '0'), SUBSTRING(MD5(CONCAT(id, wechat_name, UNIX_TIMESTAMP())), 1, 8))
WHERE sales_code IS NULL;

-- 4. 为现有的primary_sales数据生成secondary_registration_code
UPDATE primary_sales 
SET secondary_registration_code = CONCAT('SR', LPAD(id, 6, '0'), SUBSTRING(MD5(CONCAT(id, wechat_name, 'sec', UNIX_TIMESTAMP())), 1, 8))
WHERE secondary_registration_code IS NULL;

-- 5. 为现有的secondary_sales数据生成标准sales_code
UPDATE secondary_sales 
SET sales_code = CONCAT('SS', LPAD(id, 6, '0'), SUBSTRING(MD5(CONCAT(id, wechat_name, UNIX_TIMESTAMP())), 1, 8))
WHERE sales_code IS NULL;

-- 6. 验证primary_sales表字段
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zhixing' 
  AND TABLE_NAME = 'primary_sales' 
  AND COLUMN_NAME IN ('sales_code', 'secondary_registration_code');

-- 7. 验证secondary_sales表字段
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zhixing' 
  AND TABLE_NAME = 'secondary_sales' 
  AND COLUMN_NAME IN ('sales_code');

-- 8. 验证数据完整性 - primary_sales
SELECT id, wechat_name, sales_code, secondary_registration_code 
FROM primary_sales 
WHERE sales_code IS NOT NULL AND secondary_registration_code IS NOT NULL
LIMIT 5;

-- 9. 验证数据完整性 - secondary_sales  
SELECT id, wechat_name, sales_code, primary_sales_id
FROM secondary_sales 
WHERE sales_code IS NOT NULL
LIMIT 5;

-- 10. 检查orders表的关联字段是否正确
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zhixing' 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME IN ('sales_code', 'primary_sales_id', 'secondary_sales_id', 'sales_type');