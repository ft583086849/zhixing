-- 🔍 检查佣金率和所有字段长度

-- 1. 检查佣金率相关字段
SELECT 
    '💰 佣金率字段检查' as check_type,
    commission_rate,
    commission_amount,
    COUNT(*) as count
FROM orders 
WHERE commission_rate IS NOT NULL OR commission_amount IS NOT NULL
GROUP BY commission_rate, commission_amount
ORDER BY count DESC;

-- 2. 佣金率统计
SELECT 
    '📊 佣金率统计' as stat_type,
    MIN(commission_rate) as min_rate,
    MAX(commission_rate) as max_rate,
    AVG(commission_rate) as avg_rate,
    COUNT(CASE WHEN commission_rate > 0 THEN 1 END) as has_commission_count
FROM orders;

-- 3. 一次性检查所有字符字段的最大长度
SELECT 
    'order_number' as field_name,
    MAX(LENGTH(order_number)) as max_length,
    50 as current_limit,
    CASE WHEN MAX(LENGTH(order_number)) > 50 THEN '❌ 超长' ELSE '✅ 正常' END as status
FROM orders 
WHERE order_number IS NOT NULL

UNION ALL

SELECT 
    'customer_name' as field_name,
    MAX(LENGTH(customer_name)) as max_length,
    100 as current_limit,
    CASE WHEN MAX(LENGTH(customer_name)) > 100 THEN '❌ 超长' ELSE '✅ 正常' END as status
FROM orders 
WHERE customer_name IS NOT NULL

UNION ALL

SELECT 
    'customer_phone' as field_name,
    MAX(LENGTH(customer_phone)) as max_length,
    20 as current_limit,
    CASE WHEN MAX(LENGTH(customer_phone)) > 20 THEN '❌ 超长' ELSE '✅ 正常' END as status
FROM orders 
WHERE customer_phone IS NOT NULL

UNION ALL

SELECT 
    'customer_wechat' as field_name,
    MAX(LENGTH(customer_wechat)) as max_length,
    50 as current_limit,
    CASE WHEN MAX(LENGTH(customer_wechat)) > 50 THEN '❌ 超长' ELSE '✅ 正常' END as status
FROM orders 
WHERE customer_wechat IS NOT NULL

UNION ALL

SELECT 
    'sales_code' as field_name,
    MAX(LENGTH(sales_code)) as max_length,
    50 as current_limit,
    CASE WHEN MAX(LENGTH(sales_code)) > 50 THEN '❌ 超长' ELSE '✅ 正常' END as status
FROM orders 
WHERE sales_code IS NOT NULL

UNION ALL

SELECT 
    'link_code' as field_name,
    MAX(LENGTH(link_code)) as max_length,
    50 as current_limit,
    CASE WHEN MAX(LENGTH(link_code)) > 50 THEN '❌ 超长' ELSE '✅ 正常' END as status
FROM orders 
WHERE link_code IS NOT NULL

ORDER BY field_name;

-- 4. 查看实际的佣金率值
SELECT 
    '🔍 佣金率样本' as sample_type,
    customer_name,
    sales_type,
    commission_rate,
    commission_amount,
    amount
FROM orders 
WHERE commission_rate > 0
LIMIT 10;