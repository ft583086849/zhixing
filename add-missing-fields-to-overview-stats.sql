-- 给overview_stats表添加缺失的字段

-- 添加销售业绩相关字段
ALTER TABLE overview_stats 
ADD COLUMN IF NOT EXISTS primary_sales_amount DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS linked_secondary_sales_amount DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS independent_sales_amount DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS linked_secondary_sales_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS independent_sales_count INTEGER DEFAULT 0;

-- 如果secondary_sales_count字段不存在，添加它
ALTER TABLE overview_stats 
ADD COLUMN IF NOT EXISTS secondary_sales_count INTEGER DEFAULT 0;

-- 如果active_sales_count字段不存在，添加它
ALTER TABLE overview_stats 
ADD COLUMN IF NOT EXISTS active_sales_count INTEGER DEFAULT 0;