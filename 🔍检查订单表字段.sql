-- 🔍 检查订单表是否有 primary_sales_id 和 secondary_sales_id 字段
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 查看orders表的所有列
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('primary_sales_id', 'secondary_sales_id', 'sales_code', 'sales_type')
ORDER BY ordinal_position;

-- 2. 检查实际订单数据
SELECT 
    id,
    order_number,
    sales_code,
    sales_type,
    primary_sales_id,
    secondary_sales_id,
    commission_rate,
    commission_amount,
    amount,
    status,
    created_at
FROM orders
LIMIT 5;

-- 3. 统计各种类型的订单
SELECT 
    COUNT(*) as total_orders,
    COUNT(primary_sales_id) as has_primary_id,
    COUNT(secondary_sales_id) as has_secondary_id,
    COUNT(sales_code) as has_sales_code,
    COUNT(sales_type) as has_sales_type
FROM orders;

-- 4. 查看有销售ID的订单
SELECT 
    id,
    order_number,
    sales_code,
    sales_type,
    primary_sales_id,
    secondary_sales_id,
    amount,
    commission_amount
FROM orders
WHERE primary_sales_id IS NOT NULL 
   OR secondary_sales_id IS NOT NULL
LIMIT 10;
