-- 🔍 精确测试购买链接逻辑
-- 模拟完整的API调用流程

-- ===============================================
-- 1. 测试确切的sales_code查询
-- ===============================================
SELECT 
    '测试销售代码查询' as test_name,
    'SEC1754532576400' as searching_for,
    sales_code,
    wechat_name,
    name,
    payment_method,
    payment_address,
    sales_type,
    created_at
FROM secondary_sales 
WHERE sales_code = 'SEC1754532576400';

-- ===============================================
-- 2. 检查是否能在primary_sales中找到
-- ===============================================
SELECT 
    '检查primary_sales表' as test_name,
    'SEC1754532576400' as searching_for,
    sales_code,
    wechat_name,
    name,
    created_at
FROM primary_sales 
WHERE sales_code = 'SEC1754532576400';

-- ===============================================
-- 3. 检查所有可能的sales_code变体
-- ===============================================
SELECT 
    '检查类似的sales_code' as test_name,
    sales_code,
    wechat_name,
    CASE 
        WHEN sales_code = 'SEC1754532576400' THEN '完全匹配'
        WHEN sales_code LIKE '%1754532576400%' THEN '部分匹配'
        ELSE '不匹配'
    END as match_status
FROM secondary_sales 
WHERE sales_code LIKE '%1754532576400%' OR sales_code = 'SEC1754532576400';

-- ===============================================
-- 4. 检查数据类型和长度
-- ===============================================
SELECT 
    '检查字段属性' as test_name,
    sales_code,
    LENGTH(sales_code) as code_length,
    TRIM(sales_code) as trimmed_code,
    sales_code = 'SEC1754532576400' as exact_match
FROM secondary_sales 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;

-- ===============================================
-- 5. 测试大小写敏感性
-- ===============================================
SELECT 
    '测试大小写敏感' as test_name,
    sales_code,
    UPPER(sales_code) = UPPER('SEC1754532576400') as case_insensitive_match,
    sales_code = 'SEC1754532576400' as case_sensitive_match
FROM secondary_sales 
WHERE UPPER(sales_code) = UPPER('SEC1754532576400');

-- ===============================================
-- 6. 检查是否有隐藏字符
-- ===============================================
SELECT 
    '检查隐藏字符' as test_name,
    sales_code,
    ASCII(SUBSTRING(sales_code, 1, 1)) as first_char_ascii,
    ASCII(SUBSTRING(sales_code, -1, 1)) as last_char_ascii,
    CHAR_LENGTH(sales_code) as char_length,
    OCTET_LENGTH(sales_code) as byte_length
FROM secondary_sales 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;
