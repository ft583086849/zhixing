-- 🔧 修复字段长度限制（处理视图依赖）
-- 先删除视图，修改字段，再重新创建视图

-- 1. 删除所有依赖的视图
DROP VIEW IF EXISTS orders_active CASCADE;
DROP VIEW IF EXISTS orders_paid CASCADE;
DROP VIEW IF EXISTS orders_pending CASCADE;
DROP VIEW IF EXISTS orders_sales_performance CASCADE;

-- 2. 扩大可能超长的字段
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

-- 3. 重新创建视图

-- 有效订单视图（未删除的订单）
CREATE VIEW orders_active AS 
SELECT * FROM orders_optimized 
WHERE is_deleted = FALSE;

-- 已支付订单视图
CREATE VIEW orders_paid AS 
SELECT * FROM orders_optimized 
WHERE payment_status = 'paid' AND is_deleted = FALSE;

-- 待处理订单视图
CREATE VIEW orders_pending AS 
SELECT * FROM orders_optimized 
WHERE payment_status = 'pending' AND is_deleted = FALSE;

-- 销售业绩视图
CREATE VIEW orders_sales_performance AS 
SELECT 
    sales_type,
    sales_code,
    primary_sales_id,
    secondary_sales_id,
    COUNT(*) as order_count,
    SUM(amount) as total_amount,
    SUM(commission_amount) as total_commission,
    AVG(amount) as avg_amount
FROM orders_optimized 
WHERE payment_status = 'paid' AND is_deleted = FALSE
GROUP BY sales_type, sales_code, primary_sales_id, secondary_sales_id;

-- 4. 确认字段类型修改成功
SELECT 
    '✅ 字段长度修改完成' as status,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'orders_optimized' 
    AND character_maximum_length IS NOT NULL
ORDER BY column_name;

-- 5. 确认视图重新创建成功
SELECT 
    '✅ 视图重新创建完成' as status,
    table_name as view_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE 'orders_%' 
    AND table_type = 'VIEW'
ORDER BY table_name;