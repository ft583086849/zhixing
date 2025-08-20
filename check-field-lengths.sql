-- 🔍 检查原表中各字段的最大长度
-- 找出哪些字段超过了新表的限制

-- 检查order_number长度 (限制50)
SELECT 
    '📏 order_number长度检查' as field_check,
    MAX(LENGTH(order_number)) as max_length,
    MIN(LENGTH(order_number)) as min_length,
    AVG(LENGTH(order_number))::NUMERIC(5,2) as avg_length
FROM orders 
WHERE order_number IS NOT NULL;

-- 检查customer_name长度 (限制100)
SELECT 
    '📏 customer_name长度检查' as field_check,
    MAX(LENGTH(customer_name)) as max_length,
    MIN(LENGTH(customer_name)) as min_length,
    AVG(LENGTH(customer_name))::NUMERIC(5,2) as avg_length
FROM orders 
WHERE customer_name IS NOT NULL;

-- 检查customer_phone长度 (限制20)
SELECT 
    '📏 customer_phone长度检查' as field_check,
    MAX(LENGTH(customer_phone)) as max_length,
    MIN(LENGTH(customer_phone)) as min_length,
    AVG(LENGTH(customer_phone))::NUMERIC(5,2) as avg_length
FROM orders 
WHERE customer_phone IS NOT NULL;

-- 检查customer_wechat长度 (限制50)
SELECT 
    '📏 customer_wechat长度检查' as field_check,
    MAX(LENGTH(customer_wechat)) as max_length,
    MIN(LENGTH(customer_wechat)) as min_length,
    AVG(LENGTH(customer_wechat))::NUMERIC(5,2) as avg_length
FROM orders 
WHERE customer_wechat IS NOT NULL;

-- 检查sales_code长度 (限制50)
SELECT 
    '📏 sales_code长度检查' as field_check,
    MAX(LENGTH(sales_code)) as max_length,
    MIN(LENGTH(sales_code)) as min_length,
    AVG(LENGTH(sales_code))::NUMERIC(5,2) as avg_length
FROM orders 
WHERE sales_code IS NOT NULL;

-- 检查link_code长度 (限制50)
SELECT 
    '📏 link_code长度检查' as field_check,
    MAX(LENGTH(link_code)) as max_length,
    MIN(LENGTH(link_code)) as min_length,
    AVG(LENGTH(link_code))::NUMERIC(5,2) as avg_length
FROM orders 
WHERE link_code IS NOT NULL;

-- 找出最长的几个字段值
SELECT 
    '🔍 最长的order_number' as sample_type,
    order_number,
    LENGTH(order_number) as length
FROM orders 
WHERE order_number IS NOT NULL
ORDER BY LENGTH(order_number) DESC
LIMIT 3;

SELECT 
    '🔍 最长的sales_code' as sample_type,
    sales_code,
    LENGTH(sales_code) as length
FROM orders 
WHERE sales_code IS NOT NULL
ORDER BY LENGTH(sales_code) DESC
LIMIT 3;