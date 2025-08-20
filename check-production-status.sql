-- 检查生产环境的实际状态

-- 1. 检查orders_optimized表是否存在
SELECT 
    'orders_optimized表' as "检查项",
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_optimized')
        THEN '✅ 已存在'
        ELSE '❌ 不存在'
    END as "状态";

-- 2. 比较两个表的记录数
SELECT 
    'orders' as "表名",
    COUNT(*) as "记录数",
    MAX(created_at) as "最新记录时间"
FROM orders
UNION ALL
SELECT 
    'orders_optimized' as "表名",
    COUNT(*) as "记录数",
    MAX(created_at) as "最新记录时间"
FROM orders_optimized;

-- 3. 检查orders_optimized表的字段
SELECT 
    column_name as "字段名",
    data_type as "数据类型",
    character_maximum_length as "最大长度"
FROM information_schema.columns
WHERE table_name = 'orders_optimized'
AND column_name IN ('commission_amount', 'primary_commission_amount', 'secondary_commission_amount', 'duration_text')
ORDER BY column_name;

-- 4. 检查是否有同步触发器
SELECT 
    trigger_name as "触发器名",
    event_manipulation as "触发事件",
    event_object_table as "目标表",
    CASE 
        WHEN trigger_name = 'trg_sync_orders' THEN '✅ 自动同步已配置'
        ELSE '⚠️ 需要配置'
    END as "状态"
FROM information_schema.triggers
WHERE event_object_table = 'orders'
AND trigger_name LIKE '%sync%';

-- 5. 检查最近的数据差异
WITH data_diff AS (
    SELECT 
        o.id,
        o.order_number,
        o.created_at,
        'orders表独有' as status
    FROM orders o
    LEFT JOIN orders_optimized oo ON o.id = oo.id
    WHERE oo.id IS NULL
    
    UNION ALL
    
    SELECT 
        oo.id,
        oo.order_number,
        oo.created_at,
        'orders_optimized表独有' as status
    FROM orders_optimized oo
    LEFT JOIN orders o ON oo.id = o.id
    WHERE o.id IS NULL
)
SELECT 
    status as "数据差异",
    COUNT(*) as "记录数"
FROM data_diff
GROUP BY status;

-- 6. 检查当前前端使用的是哪个表（需要查看代码确认）
SELECT 
    '前端代码状态' as "检查项",
    '需要检查代码中的.from()语句确认当前使用的表' as "说明";