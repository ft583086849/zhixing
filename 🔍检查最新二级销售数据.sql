-- 🔍 检查最新二级销售注册数据
-- 验证数据是否正确存储，sales_code是否生成

-- ===============================================
-- 1. 查看最新的 secondary_sales 记录
-- ===============================================
SELECT 
    id,
    wechat_name,
    sales_code,
    name,
    payment_method,
    payment_address,
    sales_type,
    created_at
FROM secondary_sales 
ORDER BY created_at DESC 
LIMIT 5;

-- ===============================================
-- 2. 检查 sales_code 生成情况
-- ===============================================
SELECT 
    'secondary_sales sales_code 检查' as table_info,
    COUNT(*) as total_records,
    COUNT(sales_code) as has_sales_code,
    COUNT(*) - COUNT(sales_code) as missing_sales_code
FROM secondary_sales;

-- ===============================================
-- 3. 检查最新记录的完整信息
-- ===============================================
SELECT 
    'latest_secondary_sales' as info,
    *
FROM secondary_sales 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- ===============================================
-- 4. 检查是否有重复的 sales_code
-- ===============================================
SELECT 
    sales_code,
    COUNT(*) as count
FROM secondary_sales 
WHERE sales_code IS NOT NULL
GROUP BY sales_code
HAVING COUNT(*) > 1;

-- ===============================================
-- 5. 获取最新的 sales_code
-- ===============================================
SELECT 
    '最新sales_code检查' as info,
    sales_code as latest_sales_code,
    wechat_name,
    created_at
FROM secondary_sales 
ORDER BY created_at DESC 
LIMIT 1;

-- ===============================================
-- 6. 模拟购买页面查询（使用最新的sales_code测试）
-- ===============================================
-- 请将上面查询结果中的 sales_code 值复制到下面的查询中测试
-- SELECT sales_code, wechat_name, payment_method, name, payment_address
-- FROM secondary_sales 
-- WHERE sales_code = 'YOUR_SALES_CODE_HERE';

-- ===============================================
-- 7. 检查字段完整性
-- ===============================================
SELECT 
    'field_completeness' as check_type,
    COUNT(CASE WHEN wechat_name IS NULL THEN 1 END) as missing_wechat_name,
    COUNT(CASE WHEN sales_code IS NULL THEN 1 END) as missing_sales_code,
    COUNT(CASE WHEN name IS NULL THEN 1 END) as missing_name,
    COUNT(CASE WHEN payment_method IS NULL THEN 1 END) as missing_payment_method,
    COUNT(CASE WHEN sales_type IS NULL THEN 1 END) as missing_sales_type
FROM secondary_sales 
WHERE created_at >= NOW() - INTERVAL '1 hour';
