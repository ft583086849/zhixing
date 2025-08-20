-- 完整修复orders_optimized表缺失字段
-- 请在Supabase SQL Editor中执行

-- 1. 添加所有缺失字段
ALTER TABLE orders_optimized 
ADD COLUMN IF NOT EXISTS parent_link_code TEXT,
ADD COLUMN IF NOT EXISTS parent_sales_code TEXT,
ADD COLUMN IF NOT EXISTS tv_username TEXT,
ADD COLUMN IF NOT EXISTS payment_image_url TEXT,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS reject_reason TEXT;

-- 2. 特别注意：config_time字段可能已存在但有问题
-- 确保config_time字段存在且类型正确
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders_optimized' 
        AND column_name = 'config_time'
    ) THEN
        ALTER TABLE orders_optimized 
        ADD COLUMN config_time TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. 同步已有数据
-- 从orders表复制缺失字段的数据
UPDATE orders_optimized o
SET 
    parent_link_code = COALESCE(o.parent_link_code, ord.parent_link_code),
    parent_sales_code = COALESCE(o.parent_sales_code, ord.parent_sales_code),
    tv_username = COALESCE(o.tv_username, ord.tv_username),
    payment_image_url = COALESCE(o.payment_image_url, ord.payment_image_url),
    payment_amount = COALESCE(o.payment_amount, ord.payment_amount),
    reject_reason = COALESCE(o.reject_reason, ord.reject_reason)
FROM orders ord
WHERE o.id = ord.id
AND (
    o.parent_link_code IS NULL OR
    o.parent_sales_code IS NULL OR
    o.tv_username IS NULL OR
    o.payment_image_url IS NULL OR
    o.payment_amount IS NULL OR
    o.reject_reason IS NULL
);

-- 4. 创建必要的索引
CREATE INDEX IF NOT EXISTS idx_orders_optimized_config_time ON orders_optimized(config_time);
CREATE INDEX IF NOT EXISTS idx_orders_optimized_payment_time ON orders_optimized(payment_time);
CREATE INDEX IF NOT EXISTS idx_orders_optimized_parent_sales ON orders_optimized(parent_sales_code);

-- 5. 验证修复结果
SELECT 
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name = 'config_time' THEN 1 END) as has_config_time,
    COUNT(CASE WHEN column_name = 'reject_reason' THEN 1 END) as has_reject_reason,
    COUNT(CASE WHEN column_name = 'payment_amount' THEN 1 END) as has_payment_amount
FROM information_schema.columns
WHERE table_name = 'orders_optimized';

-- 6. 查看待审批订单（修复后应该能看到）
SELECT 
    id,
    tradingview_username,
    status,
    created_at,
    config_time,
    payment_amount
FROM orders_optimized
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;