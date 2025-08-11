-- 直接修复qq4073969订单的方案

-- 方案1：如果PRI17548273477088006不存在，找个默认销售
-- 查看是否有默认的一级销售可以关联
SELECT id, sales_code, wechat_name 
FROM primary_sales 
WHERE wechat_name IN ('WML792355703', '张子俊', 'futureshineday')
LIMIT 1;

-- 方案2：如果sales_code存在但没关联上，手动关联
UPDATE orders o
SET primary_sales_id = (
  SELECT id FROM primary_sales 
  WHERE sales_code = 'PRI17548273477088006'
  LIMIT 1
)
WHERE customer_wechat = 'qq4073969' 
  AND sales_code = 'PRI17548273477088006'
  AND primary_sales_id IS NULL;

-- 方案3：清空错误的sales_code（如果不存在）
-- 先确认sales_code确实不存在再执行
UPDATE orders 
SET sales_code = NULL
WHERE customer_wechat = 'qq4073969'
  AND sales_code = 'PRI17548273477088006'
  AND NOT EXISTS (
    SELECT 1 FROM primary_sales 
    WHERE sales_code = 'PRI17548273477088006'
  );

-- 验证结果
SELECT 
  o.*,
  ps.wechat_name as linked_sales
FROM orders o
LEFT JOIN primary_sales ps ON o.primary_sales_id = ps.id
WHERE o.customer_wechat = 'qq4073969';
