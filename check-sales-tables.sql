-- 销售表诊断脚本
-- 检查现有销售表的结构、数据量、索引等问题

-- 1. 检查primary_sales表结构
SELECT 
    '======== PRIMARY_SALES 表分析 ========' as section;

SELECT 
    column_name as "字段名",
    data_type as "数据类型",
    character_maximum_length as "最大长度",
    is_nullable as "允许空值",
    column_default as "默认值"
FROM information_schema.columns
WHERE table_name = 'primary_sales'
ORDER BY ordinal_position;

-- 2. 检查secondary_sales表结构
SELECT 
    '======== SECONDARY_SALES 表分析 ========' as section;

SELECT 
    column_name as "字段名",
    data_type as "数据类型",
    character_maximum_length as "最大长度",
    is_nullable as "允许空值",
    column_default as "默认值"
FROM information_schema.columns
WHERE table_name = 'secondary_sales'
ORDER BY ordinal_position;

-- 3. 数据量统计
SELECT 
    '======== 数据量统计 ========' as section;

SELECT 
    'primary_sales' as "表名",
    COUNT(*) as "记录数",
    (SELECT COUNT(DISTINCT sales_code) FROM primary_sales) as "唯一销售编号数"
UNION ALL
SELECT 
    'secondary_sales' as "表名",
    COUNT(*) as "记录数",
    (SELECT COUNT(DISTINCT sales_code) FROM secondary_sales) as "唯一销售编号数";

-- 4. 检查索引情况
SELECT 
    '======== 索引分析 ========' as section;

SELECT 
    t.tablename as "表名",
    i.indexname as "索引名",
    i.indexdef as "索引定义"
FROM pg_indexes i
JOIN pg_tables t ON i.tablename = t.tablename
WHERE t.tablename IN ('primary_sales', 'secondary_sales')
ORDER BY t.tablename, i.indexname;

-- 5. 检查关联关系
SELECT 
    '======== 关联关系检查 ========' as section;

-- 检查二级销售的上级关系
SELECT 
    CASE 
        WHEN primary_sales_id IS NULL THEN '独立二级销售'
        ELSE '有上级的二级销售'
    END as "类型",
    COUNT(*) as "数量"
FROM secondary_sales
GROUP BY CASE WHEN primary_sales_id IS NULL THEN '独立二级销售' ELSE '有上级的二级销售' END;

-- 6. 检查佣金率字段问题
SELECT 
    '======== 佣金率数据问题 ========' as section;

-- 检查一级销售佣金率
SELECT 
    'primary_sales佣金率分布' as "检查项",
    commission_rate,
    COUNT(*) as "数量"
FROM primary_sales
GROUP BY commission_rate
ORDER BY commission_rate;

-- 检查二级销售佣金率
SELECT 
    'secondary_sales佣金率分布' as "检查项",
    commission_rate,
    COUNT(*) as "数量"
FROM secondary_sales
GROUP BY commission_rate
ORDER BY commission_rate;

-- 7. 检查与订单表的关联性能
SELECT 
    '======== 订单关联性能问题 ========' as section;

-- 检查订单表中销售字段的使用情况
SELECT 
    'orders表销售字段' as "检查项",
    COUNT(*) as "总订单数",
    COUNT(primary_sales_id) as "有一级销售的订单",
    COUNT(secondary_sales_id) as "有二级销售的订单"
FROM orders;

-- 8. 检查数据质量问题
SELECT 
    '======== 数据质量问题 ========' as section;

-- 检查重复的销售编号
SELECT 
    '重复销售编号检查' as "检查项",
    sales_code,
    COUNT(*) as "重复次数"
FROM (
    SELECT sales_code FROM primary_sales
    UNION ALL
    SELECT sales_code FROM secondary_sales
) all_sales
GROUP BY sales_code
HAVING COUNT(*) > 1;

-- 9. 性能热点查询模拟
SELECT 
    '======== 性能热点分析 ========' as section;

-- 这些是前端常用的查询，需要优化
-- 查询1: 获取所有销售列表（关联订单统计）
EXPLAIN (FORMAT TEXT)
SELECT 
    p.id,
    p.sales_code,
    p.wechat_name,
    COUNT(o.id) as order_count,
    SUM(o.amount) as total_amount
FROM primary_sales p
LEFT JOIN orders o ON o.primary_sales_id = p.id
GROUP BY p.id, p.sales_code, p.wechat_name;

-- 10. 统计字段缺失分析
SELECT 
    '======== 缺失的统计字段 ========' as section,
    '需要添加的字段：' as "说明",
    '- total_orders (总订单数)' as field1,
    '- total_amount (总销售额)' as field2,  
    '- month_orders (月订单数)' as field3,
    '- month_amount (月销售额)' as field4,
    '- total_commission (总佣金)' as field5,
    '- last_order_date (最后订单时间)' as field6;