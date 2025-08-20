-- 简化的切换脚本 - 假设表已经存在

-- 1. 检查当前状态
SELECT 
    'orders' as "表名",
    COUNT(*) as "记录数",
    MAX(created_at) as "最新记录"
FROM orders
UNION ALL
SELECT 
    'orders_optimized' as "表名",
    COUNT(*) as "记录数",
    MAX(created_at) as "最新记录"
FROM orders_optimized;

-- 2. 同步缺失的数据（如果有）
INSERT INTO orders_optimized
SELECT * FROM orders 
WHERE id NOT IN (SELECT id FROM orders_optimized)
ON CONFLICT (id) DO UPDATE SET
    order_number = EXCLUDED.order_number,
    customer_name = EXCLUDED.customer_name,
    amount = EXCLUDED.amount,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

-- 3. 验证同步结果
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM orders) = (SELECT COUNT(*) FROM orders_optimized)
        THEN '✅ 数据已同步'
        ELSE '⚠️ 数据不一致，需要检查'
    END as "同步状态",
    (SELECT COUNT(*) FROM orders) as "orders表记录数",
    (SELECT COUNT(*) FROM orders_optimized) as "orders_optimized表记录数";