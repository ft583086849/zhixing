-- 🔧 修复status约束问题
-- 先检查原表中所有的status值

SELECT 
    '原表status值统计' as info,
    status,
    COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- 修改约束包含所有实际使用的status值
ALTER TABLE orders_optimized 
DROP CONSTRAINT IF EXISTS chk_status;

ALTER TABLE orders_optimized 
ADD CONSTRAINT chk_status 
CHECK (status IN (
    'pending', 
    'confirmed', 
    'cancelled', 
    'expired', 
    'confirmed_config', 
    'pending_payment', 
    'pending_config',
    'rejected',  -- 添加缺失的status
    'completed',  -- 可能还有的状态
    'processing'  -- 可能还有的状态
));