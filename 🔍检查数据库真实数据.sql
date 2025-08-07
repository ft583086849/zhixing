-- 🔍检查数据库真实数据情况
-- 在Supabase SQL Editor中运行这些查询

-- === 1. 检查订单表金额字段情况 ===
-- 查看订单表的金额相关字段
SELECT 
    id,
    order_number,
    sales_code,
    status,
    amount,
    actual_payment_amount,
    commission_amount,
    payment_method,
    duration,
    created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- === 2. 统计订单金额字段分布 ===
-- 查看有多少订单有金额数据
SELECT 
    '总订单数' as 统计项,
    COUNT(*) as 数量
FROM orders
UNION ALL
SELECT 
    'amount字段有值的订单',
    COUNT(*) as 数量
FROM orders 
WHERE amount IS NOT NULL AND amount > 0
UNION ALL
SELECT 
    'actual_payment_amount字段有值的订单',
    COUNT(*) as 数量
FROM orders 
WHERE actual_payment_amount IS NOT NULL AND actual_payment_amount > 0
UNION ALL
SELECT 
    'commission_amount字段有值的订单',
    COUNT(*) as 数量
FROM orders 
WHERE commission_amount IS NOT NULL AND commission_amount > 0;

-- === 3. 检查销售表数据完整性 ===
-- 检查一级销售表
SELECT 
    id,
    sales_code,
    name,
    wechat_name,
    phone,
    created_at
FROM primary_sales 
ORDER BY created_at DESC 
LIMIT 5;

-- 检查二级销售表  
SELECT 
    id,
    sales_code,
    name,
    wechat_name,
    phone,
    primary_sales_id,
    created_at
FROM secondary_sales 
ORDER BY created_at DESC 
LIMIT 5;

-- === 4. 检查销售微信号字段分布 ===
-- 一级销售微信号完整性
SELECT 
    'primary_sales总数' as 统计项,
    COUNT(*) as 数量
FROM primary_sales
UNION ALL
SELECT 
    'wechat_name有值的一级销售',
    COUNT(*) as 数量
FROM primary_sales 
WHERE wechat_name IS NOT NULL AND wechat_name != ''
UNION ALL
SELECT 
    'name有值的一级销售',
    COUNT(*) as 数量
FROM primary_sales 
WHERE name IS NOT NULL AND name != ''
UNION ALL
SELECT 
    'phone有值的一级销售',
    COUNT(*) as 数量
FROM primary_sales 
WHERE phone IS NOT NULL AND phone != '';

-- 二级销售微信号完整性
SELECT 
    'secondary_sales总数' as 统计项,
    COUNT(*) as 数量
FROM secondary_sales
UNION ALL
SELECT 
    'wechat_name有值的二级销售',
    COUNT(*) as 数量
FROM secondary_sales 
WHERE wechat_name IS NOT NULL AND wechat_name != ''
UNION ALL
SELECT 
    'name有值的二级销售',
    COUNT(*) as 数量
FROM secondary_sales 
WHERE name IS NOT NULL AND name != ''
UNION ALL
SELECT 
    'phone有值的二级销售',
    COUNT(*) as 数量
FROM secondary_sales 
WHERE phone IS NOT NULL AND phone != '';

-- === 5. 检查订单与销售关联情况 ===
-- 查看订单表的sales_code与销售表是否能匹配
SELECT 
    o.id as order_id,
    o.sales_code,
    o.amount,
    o.actual_payment_amount,
    CASE 
        WHEN ps.sales_code IS NOT NULL THEN '找到一级销售'
        WHEN ss.sales_code IS NOT NULL THEN '找到二级销售'
        ELSE '未找到匹配销售'
    END as 关联状态,
    COALESCE(ps.wechat_name, ss.wechat_name, ps.name, ss.name) as 销售微信号
FROM orders o
LEFT JOIN primary_sales ps ON o.sales_code = ps.sales_code
LEFT JOIN secondary_sales ss ON o.sales_code = ss.sales_code
ORDER BY o.created_at DESC
LIMIT 10;

-- === 6. 检查订单状态分布 ===
-- 查看订单状态的真实分布情况
SELECT 
    status,
    COUNT(*) as 订单数量,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 2) as 百分比
FROM orders 
GROUP BY status
ORDER BY COUNT(*) DESC;

-- === 7. 检查金额字段的数据类型和格式 ===
-- 查看金额字段的具体值和格式
SELECT 
    id,
    amount,
    actual_payment_amount,
    commission_amount,
    pg_typeof(amount) as amount_type,
    pg_typeof(actual_payment_amount) as actual_payment_amount_type,
    pg_typeof(commission_amount) as commission_amount_type
FROM orders 
WHERE amount IS NOT NULL OR actual_payment_amount IS NOT NULL
LIMIT 5;

-- === 8. 检查是否有其他可能的金额字段 ===
-- 查看orders表的所有列名
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
