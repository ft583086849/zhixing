-- 安全地添加缺失的字段到orders表
-- 这个脚本只添加字段，不删除任何现有数据

-- 1. 添加 sales_code 字段（如果不存在）
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50) COMMENT '销售代码(link_code的新名称)';

-- 2. 添加 sales_type 字段（如果不存在）
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sales_type ENUM('primary', 'secondary') COMMENT '销售类型';

-- 3. 添加 primary_sales_id 字段（如果不存在）
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS primary_sales_id INT COMMENT '关联的一级销售ID';

-- 4. 添加 secondary_sales_id 字段（如果不存在）
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS secondary_sales_id INT COMMENT '关联的二级销售ID';

-- 5. 添加 config_confirmed 字段（如果不存在）
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS config_confirmed BOOLEAN DEFAULT FALSE COMMENT '配置确认状态';

-- 6. 更新 screenshot_path 为 LONGTEXT（如果是 VARCHAR）
ALTER TABLE orders 
MODIFY COLUMN screenshot_path LONGTEXT COMMENT '付款截图Base64数据';

-- 7. 数据迁移：将现有的 link_code 数据复制到 sales_code
UPDATE orders 
SET sales_code = link_code 
WHERE sales_code IS NULL AND link_code IS NOT NULL;

-- 8. 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_sales_code ON orders(sales_code);
CREATE INDEX IF NOT EXISTS idx_orders_sales_type ON orders(sales_type);
CREATE INDEX IF NOT EXISTS idx_orders_primary_sales_id ON orders(primary_sales_id);
CREATE INDEX IF NOT EXISTS idx_orders_secondary_sales_id ON orders(secondary_sales_id);

-- 查询验证
SELECT 'Fields added successfully' as status;