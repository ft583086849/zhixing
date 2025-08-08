-- 🔧 修复订单 sales_type 字段为 NULL 的问题
-- 请在 Supabase SQL Editor 中执行此脚本

-- =============================================
-- 1. 先查看当前数据情况
-- =============================================
SELECT 
    sales_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM orders
GROUP BY sales_type;

-- =============================================
-- 2. 分析订单的销售来源
-- =============================================
-- 查看有 sales_code 但 sales_type 为空的订单
SELECT 
    o.id,
    o.order_number,
    o.sales_code,
    o.sales_type,
    o.secondary_sales_id,
    o.amount,
    -- 判断是一级还是二级
    CASE 
        WHEN p.sales_code IS NOT NULL THEN '应该是primary'
        WHEN s.sales_code IS NOT NULL THEN '应该是secondary'
        ELSE '无法判断'
    END as suggested_type
FROM orders o
LEFT JOIN primary_sales p ON o.sales_code = p.sales_code
LEFT JOIN secondary_sales s ON o.sales_code = s.sales_code
WHERE o.sales_type IS NULL
LIMIT 20;

-- =============================================
-- 3. 修复 sales_type 为 NULL 的订单
-- =============================================

-- 3.1 修复一级销售的订单
UPDATE orders o
SET 
    sales_type = 'primary',
    updated_at = CURRENT_TIMESTAMP
FROM primary_sales p
WHERE o.sales_code = p.sales_code
AND o.sales_type IS NULL;

-- 查看修复了多少条
SELECT '修复一级销售订单' as action, COUNT(*) as affected_rows
FROM orders o
JOIN primary_sales p ON o.sales_code = p.sales_code
WHERE o.sales_type IS NULL;

-- 3.2 修复二级销售的订单
UPDATE orders o
SET 
    sales_type = 'secondary',
    updated_at = CURRENT_TIMESTAMP
FROM secondary_sales s
WHERE o.sales_code = s.sales_code
AND o.sales_type IS NULL;

-- 查看修复了多少条
SELECT '修复二级销售订单' as action, COUNT(*) as affected_rows
FROM orders o
JOIN secondary_sales s ON o.sales_code = s.sales_code
WHERE o.sales_type IS NULL;

-- 3.3 如果有 secondary_sales_id 的，肯定是二级销售订单
UPDATE orders
SET 
    sales_type = 'secondary',
    updated_at = CURRENT_TIMESTAMP
WHERE secondary_sales_id IS NOT NULL
AND sales_type IS NULL;

-- =============================================
-- 4. 处理没有 sales_code 的订单（如果有）
-- =============================================
-- 这些可能是很早期的订单，默认设为 primary
UPDATE orders
SET 
    sales_type = 'primary',
    updated_at = CURRENT_TIMESTAMP
WHERE sales_code IS NULL
AND sales_type IS NULL;

-- =============================================
-- 5. 验证修复结果
-- =============================================
SELECT 
    '修复后的统计' as status,
    sales_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM orders
GROUP BY sales_type
ORDER BY sales_type;

-- 应该没有 NULL 了
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ 修复成功！所有订单都有sales_type'
        ELSE '❌ 还有' || COUNT(*) || '个订单的sales_type为NULL'
    END as result
FROM orders
WHERE sales_type IS NULL;

-- =============================================
-- 6. 重新查看视图数据
-- =============================================
SELECT 
    sales_type,
    sales_display_name,
    COUNT(*) as order_count,
    SUM(amount) as total_amount
FROM orders_with_sales_names
GROUP BY sales_type, sales_display_name
ORDER BY sales_type, sales_display_name;
