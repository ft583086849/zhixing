-- 修复qq4073969的订单关联问题

-- 1. 先查看当前状态
SELECT 
  o.id,
  o.order_number,
  o.sales_code,
  o.primary_sales_id,
  ps.id as yii_id,
  ps.wechat_name
FROM orders o
LEFT JOIN primary_sales ps ON ps.sales_code = 'PRI17548273477088006'
WHERE o.customer_wechat = 'qq4073969';

-- 2. 修复有sales_code但没有primary_sales_id的订单
UPDATE orders 
SET primary_sales_id = (
  SELECT id FROM primary_sales 
  WHERE sales_code = 'PRI17548273477088006'
  LIMIT 1
)
WHERE customer_wechat = 'qq4073969' 
  AND sales_code = 'PRI17548273477088006'
  AND primary_sales_id IS NULL;

-- 3. 对于没有sales_code的订单，看用户想关联到谁
-- 选项A：关联到同一个销售Yii11111____
UPDATE orders 
SET 
  sales_code = 'PRI17548273477088006',
  primary_sales_id = (
    SELECT id FROM primary_sales 
    WHERE sales_code = 'PRI17548273477088006'
    LIMIT 1
  )
WHERE customer_wechat = 'qq4073969' 
  AND sales_code IS NULL;

-- 选项B：不关联（保持NULL）
-- 不执行UPDATE

-- 4. 验证修复结果
SELECT 
  o.id,
  o.order_number,
  o.sales_code,
  o.primary_sales_id,
  ps.wechat_name as linked_sales,
  o.amount,
  o.status
FROM orders o
LEFT JOIN primary_sales ps ON o.primary_sales_id = ps.id
WHERE o.customer_wechat = 'qq4073969';
