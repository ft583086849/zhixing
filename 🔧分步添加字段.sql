-- 🔧 分步添加 sales_type 字段 - 第2步
-- 第1步已完成：primary_sales ✅

-- 步骤2：为 secondary_sales 表添加 sales_type 字段
ALTER TABLE secondary_sales 
ADD COLUMN sales_type sales_type_enum DEFAULT 'secondary';