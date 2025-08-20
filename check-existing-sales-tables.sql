-- 检查现有销售表的详细结构

-- 1. primary_sales 表结构
SELECT 
    '==================== PRIMARY_SALES 表结构 ====================' as section;

SELECT 
    ordinal_position as "序号",
    column_name as "字段名",
    data_type as "数据类型",
    character_maximum_length as "最大长度",
    is_nullable as "可为空",
    column_default as "默认值"
FROM information_schema.columns
WHERE table_name = 'primary_sales'
ORDER BY ordinal_position;

-- 2. secondary_sales 表结构
SELECT 
    '==================== SECONDARY_SALES 表结构 ====================' as section;

SELECT 
    ordinal_position as "序号",
    column_name as "字段名",
    data_type as "数据类型",
    character_maximum_length as "最大长度",
    is_nullable as "可为空",
    column_default as "默认值"
FROM information_schema.columns
WHERE table_name = 'secondary_sales'
ORDER BY ordinal_position;

-- 3. 查看primary_sales表的示例数据
SELECT 
    '==================== PRIMARY_SALES 示例数据 ====================' as section;

SELECT 
    id,
    sales_code,
    name,
    wechat_name,
    commission_rate,
    created_at
FROM primary_sales
LIMIT 5;

-- 4. 查看secondary_sales表的示例数据
SELECT 
    '==================== SECONDARY_SALES 示例数据 ====================' as section;

SELECT 
    s.id,
    s.sales_code,
    s.name,
    s.wechat_name,
    s.primary_sales_id,
    p.sales_code as "上级销售编号",
    s.commission_rate,
    s.created_at
FROM secondary_sales s
LEFT JOIN primary_sales p ON s.primary_sales_id = p.id
LIMIT 10;

-- 5. 统计数据量
SELECT 
    '==================== 数据量统计 ====================' as section;

SELECT 
    'primary_sales' as "表名",
    COUNT(*) as "记录数",
    COUNT(DISTINCT sales_code) as "唯一销售编号",
    MIN(created_at) as "最早记录",
    MAX(created_at) as "最新记录"
FROM primary_sales
UNION ALL
SELECT 
    'secondary_sales' as "表名",
    COUNT(*) as "记录数",
    COUNT(DISTINCT sales_code) as "唯一销售编号",
    MIN(created_at) as "最早记录",
    MAX(created_at) as "最新记录"
FROM secondary_sales;

-- 6. 分析secondary_sales的类型分布
SELECT 
    '==================== 二级销售类型分布 ====================' as section;

SELECT 
    CASE 
        WHEN primary_sales_id IS NULL THEN '独立销售'
        ELSE '有上级的二级销售'
    END as "销售类型",
    COUNT(*) as "数量",
    AVG(commission_rate) as "平均佣金率",
    MIN(commission_rate) as "最小佣金率",
    MAX(commission_rate) as "最大佣金率"
FROM secondary_sales
GROUP BY CASE 
    WHEN primary_sales_id IS NULL THEN '独立销售'
    ELSE '有上级的二级销售'
END;

-- 7. 检查佣金率数据格式
SELECT 
    '==================== 佣金率格式分析 ====================' as section;

SELECT 
    'primary_sales' as "表名",
    commission_rate,
    COUNT(*) as "数量",
    CASE 
        WHEN commission_rate > 1 THEN '百分比格式(如40)'
        WHEN commission_rate <= 1 THEN '小数格式(如0.4)'
        ELSE '其他'
    END as "格式类型"
FROM primary_sales
GROUP BY commission_rate
UNION ALL
SELECT 
    'secondary_sales' as "表名",
    commission_rate,
    COUNT(*) as "数量",
    CASE 
        WHEN commission_rate > 1 THEN '百分比格式(如25)'
        WHEN commission_rate <= 1 THEN '小数格式(如0.25)'
        ELSE '其他'
    END as "格式类型"
FROM secondary_sales
GROUP BY commission_rate
ORDER BY "表名", commission_rate;

-- 8. 检查索引情况
SELECT 
    '==================== 现有索引分析 ====================' as section;

SELECT 
    t.tablename as "表名",
    i.indexname as "索引名",
    i.indexdef as "索引定义"
FROM pg_indexes i
JOIN pg_tables t ON i.tablename = t.tablename
WHERE t.tablename IN ('primary_sales', 'secondary_sales')
ORDER BY t.tablename, i.indexname;

-- 9. 检查与orders表的关联
SELECT 
    '==================== 订单关联分析 ====================' as section;

SELECT 
    'orders表关联' as "分析项",
    COUNT(*) as "总订单数",
    COUNT(primary_sales_id) as "关联一级销售",
    COUNT(secondary_sales_id) as "关联二级销售",
    COUNT(*) - COUNT(primary_sales_id) - COUNT(secondary_sales_id) as "无销售关联"
FROM orders_optimized;

-- 10. 检查重复的sales_code
SELECT 
    '==================== 销售编号重复检查 ====================' as section;

WITH all_sales AS (
    SELECT sales_code, 'primary' as source FROM primary_sales
    UNION ALL
    SELECT sales_code, 'secondary' as source FROM secondary_sales
)
SELECT 
    sales_code,
    STRING_AGG(source, ', ') as "出现在表",
    COUNT(*) as "重复次数"
FROM all_sales
GROUP BY sales_code
HAVING COUNT(*) > 1;