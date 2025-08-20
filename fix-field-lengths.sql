-- 🔧 修复字段长度限制
-- 根据实际数据调整字段长度

-- 扩大可能超长的字段
ALTER TABLE orders_optimized ALTER COLUMN order_number TYPE VARCHAR(100);
ALTER TABLE orders_optimized ALTER COLUMN customer_name TYPE VARCHAR(200);
ALTER TABLE orders_optimized ALTER COLUMN customer_phone TYPE VARCHAR(50);
ALTER TABLE orders_optimized ALTER COLUMN customer_email TYPE VARCHAR(200);
ALTER TABLE orders_optimized ALTER COLUMN customer_wechat TYPE VARCHAR(100);
ALTER TABLE orders_optimized ALTER COLUMN tradingview_username TYPE VARCHAR(100);
ALTER TABLE orders_optimized ALTER COLUMN sales_code TYPE VARCHAR(100);
ALTER TABLE orders_optimized ALTER COLUMN link_code TYPE VARCHAR(100);
ALTER TABLE orders_optimized ALTER COLUMN source_channel TYPE VARCHAR(100);
ALTER TABLE orders_optimized ALTER COLUMN referrer_code TYPE VARCHAR(100);
ALTER TABLE orders_optimized ALTER COLUMN campaign_id TYPE VARCHAR(100);

-- 确认字段类型修改成功
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'orders_optimized' 
    AND character_maximum_length IS NOT NULL
ORDER BY column_name;