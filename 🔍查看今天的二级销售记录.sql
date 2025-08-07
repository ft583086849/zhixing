-- 🔍 查看今天的二级销售记录详情
-- 重点检查最新记录的sales_code和完整信息

-- ===============================================
-- 1. 查看今天的记录详情
-- ===============================================
SELECT 
    'today_record' as info,
    id,
    wechat_name,
    sales_code,
    name,
    payment_method,
    payment_address,
    sales_type,
    created_at
FROM secondary_sales 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- ===============================================
-- 2. 获取今天记录的sales_code用于测试
-- ===============================================
SELECT 
    'sales_code_for_testing' as purpose,
    sales_code,
    wechat_name,
    '购买链接应该是: /purchase?sales_code=' || sales_code as purchase_link_format
FROM secondary_sales 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;

-- ===============================================
-- 3. 测试用这个sales_code查询（模拟购买页面）
-- ===============================================
-- 使用今天记录的sales_code测试查询
WITH today_code AS (
    SELECT sales_code 
    FROM secondary_sales 
    WHERE DATE(created_at) = CURRENT_DATE
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    'purchase_page_simulation' as test_type,
    s.sales_code,
    s.wechat_name,
    s.payment_method,
    s.payment_address,
    s.name,
    '查询成功 - 购买页面应该能获取到数据' as result
FROM secondary_sales s
CROSS JOIN today_code t
WHERE s.sales_code = t.sales_code;

-- ===============================================
-- 4. 检查sales_code格式和长度
-- ===============================================
SELECT 
    'sales_code_analysis' as analysis,
    sales_code,
    LENGTH(sales_code) as code_length,
    CASE 
        WHEN sales_code IS NULL THEN 'NULL - 这是问题!'
        WHEN LENGTH(sales_code) = 0 THEN '空字符串 - 这是问题!'
        WHEN LENGTH(sales_code) < 10 THEN '太短 - 可能有问题'
        ELSE '正常长度'
    END as code_status
FROM secondary_sales 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
