-- =====================================================
-- 修复 orders_optimized 表的ID序列问题
-- 问题：序列当前值小于表中最大ID，导致主键冲突
-- 解决：重置序列到正确的值
-- =====================================================

-- 1. 查看当前序列状态
SELECT 
    currval('orders_optimized_id_seq') as current_sequence_value,
    (SELECT MAX(id) FROM orders_optimized) as max_table_id;

-- 2. 重置序列到正确的值（最大ID + 1）
SELECT setval('orders_optimized_id_seq', (SELECT MAX(id) FROM orders_optimized) + 1, false);

-- 3. 验证修复结果
SELECT 
    currval('orders_optimized_id_seq') as new_sequence_value,
    (SELECT MAX(id) FROM orders_optimized) as max_table_id;