-- 添加实付金额字段到orders表
-- 解决按实付金额计算佣金的需求

-- 1. 添加实付金额字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_payment_amount NUMERIC(10,2);

-- 2. 为现有订单设置默认值（实付金额 = 订单金额）
UPDATE orders 
SET actual_payment_amount = amount 
WHERE actual_payment_amount IS NULL;

-- 3. 设置字段约束
ALTER TABLE orders 
ALTER COLUMN actual_payment_amount SET DEFAULT 0.00;

-- 4. 验证字段添加
SELECT 
    'actual_payment_amount' as field_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'actual_payment_amount'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 5. 查看几条数据验证
SELECT 
    order_number,
    amount,
    actual_payment_amount,
    commission_amount
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
