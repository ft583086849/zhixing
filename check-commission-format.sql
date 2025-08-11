-- 检查所有表的佣金率格式
-- 1. 检查primary_sales表
SELECT 
    'primary_sales' as table_name,
    COUNT(*) as total_count,
    SUM(CASE WHEN commission_rate > 1 THEN 1 ELSE 0 END) as wrong_format_count,
    MIN(commission_rate) as min_rate,
    MAX(commission_rate) as max_rate,
    STRING_AGG(DISTINCT 
        CASE 
            WHEN commission_rate > 1 THEN sales_code || '(' || commission_rate || ')'
            ELSE NULL
        END, ', '
    ) as wrong_format_examples
FROM primary_sales
UNION ALL
-- 2. 检查secondary_sales表
SELECT 
    'secondary_sales' as table_name,
    COUNT(*) as total_count,
    SUM(CASE WHEN commission_rate > 1 THEN 1 ELSE 0 END) as wrong_format_count,
    MIN(commission_rate) as min_rate,
    MAX(commission_rate) as max_rate,
    STRING_AGG(DISTINCT 
        CASE 
            WHEN commission_rate > 1 THEN sales_code || '(' || commission_rate || ')'
            ELSE NULL
        END, ', '
    ) as wrong_format_examples
FROM secondary_sales
UNION ALL
-- 3. 检查orders表
SELECT 
    'orders' as table_name,
    COUNT(*) as total_count,
    SUM(CASE WHEN commission_rate > 1 THEN 1 ELSE 0 END) as wrong_format_count,
    MIN(commission_rate) as min_rate,
    MAX(commission_rate) as max_rate,
    STRING_AGG(DISTINCT 
        CASE 
            WHEN commission_rate > 1 THEN 'Order#' || id || '(' || commission_rate || ')'
            ELSE NULL
        END, ', '
    ) as wrong_format_examples
FROM orders;

-- 特别检查WML792355703的情况
SELECT 
    '===WML792355703佣金率===' as info,
    sales_code,
    wechat_name,
    commission_rate,
    CASE 
        WHEN commission_rate = 0.4 THEN '正确(40%)'
        WHEN commission_rate = 0.15 THEN '错误(15%)'
        ELSE '其他值'
    END as status
FROM primary_sales
WHERE sales_code = 'WML792355703';
