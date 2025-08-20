-- 添加催单相关字段到orders_optimized表
ALTER TABLE orders_optimized 
ADD COLUMN IF NOT EXISTS is_reminded BOOLEAN DEFAULT false;

ALTER TABLE orders_optimized 
ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMP WITH TIME ZONE;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_optimized_is_reminded 
ON orders_optimized(is_reminded);

CREATE INDEX IF NOT EXISTS idx_orders_optimized_reminded_at 
ON orders_optimized(reminded_at);

-- 添加注释
COMMENT ON COLUMN orders_optimized.is_reminded IS '是否已催单';
COMMENT ON COLUMN orders_optimized.reminded_at IS '催单时间';
EOF < /dev/null