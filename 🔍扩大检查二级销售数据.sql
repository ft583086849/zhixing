-- 🔍 扩大检查范围 - 查看所有二级销售数据
-- 没有近1小时的数据，扩大到所有时间

-- ===============================================
-- 1. 检查 secondary_sales 表是否有任何数据
-- ===============================================
SELECT 
    '总记录数检查' as info,
    COUNT(*) as total_records
FROM secondary_sales;

-- ===============================================
-- 2. 查看所有 secondary_sales 记录（如果有的话）
-- ===============================================
SELECT 
    id,
    wechat_name,
    sales_code,
    name,
    payment_method,
    sales_type,
    created_at
FROM secondary_sales 
ORDER BY created_at DESC 
LIMIT 10;

-- ===============================================
-- 3. 检查表结构确认字段存在
-- ===============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'secondary_sales'
ORDER BY ordinal_position;

-- ===============================================
-- 4. 检查是否有今天的任何注册记录
-- ===============================================
SELECT 
    '今天的记录' as info,
    COUNT(*) as today_records
FROM secondary_sales 
WHERE DATE(created_at) = CURRENT_DATE;

-- ===============================================
-- 5. 检查最近一周的记录
-- ===============================================
SELECT 
    DATE(created_at) as registration_date,
    COUNT(*) as records_count
FROM secondary_sales 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY registration_date DESC;
