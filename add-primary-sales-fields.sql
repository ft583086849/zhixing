-- 为primary_sales表添加sales_code相关字段
-- 执行环境：PlanetScale控制台

-- 1. 添加sales_code字段（用户购买代码）
ALTER TABLE primary_sales 
ADD COLUMN sales_code VARCHAR(16) UNIQUE COMMENT '用户购买时使用的销售代码';

-- 2. 添加secondary_registration_code字段（二级销售注册代码）
ALTER TABLE primary_sales 
ADD COLUMN secondary_registration_code VARCHAR(16) UNIQUE COMMENT '二级销售注册时使用的代码';

-- 3. 验证字段添加成功
DESCRIBE primary_sales;

-- 4. 检查表结构
SELECT 
  COLUMN_NAME, 
  COLUMN_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT, 
  COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zhixing' 
  AND TABLE_NAME = 'primary_sales'
ORDER BY ORDINAL_POSITION;

-- 5. 显示现有数据（确认影响范围）
SELECT COUNT(*) as total_records FROM primary_sales;

-- 执行完成后，一级销售创建功能将恢复正常！