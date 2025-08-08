-- 为 secondary_sales 表添加 registration_code 字段
-- 该字段用于存储二级销售注册时使用的注册码

ALTER TABLE secondary_sales 
ADD COLUMN IF NOT EXISTS registration_code TEXT;

-- 添加注释说明字段用途
COMMENT ON COLUMN secondary_sales.registration_code IS '二级销售注册时使用的注册码，用于关联到一级销售';
