-- 修复错误的销售记录
-- ⚠️ 请在执行前备份数据！

-- 1. 查看将被影响的订单
SELECT 
  o.id,
  o.order_number,
  o.customer_wechat,
  o.sales_code,
  ss.wechat_name as wrong_sales_name
FROM orders o
JOIN secondary_sales ss ON o.sales_code = ss.sales_code
WHERE ss.wechat_name IN ('niu001002003', 'guazigongshe');

-- 2. 备份这两个错误的销售记录（记录下来以防需要）
SELECT * FROM secondary_sales 
WHERE wechat_name IN ('niu001002003', 'guazigongshe');

-- 3. 清除订单中错误的sales_code关联
UPDATE orders 
SET 
  sales_code = NULL,
  secondary_sales_id = NULL,
  commission_amount = 0,
  commission_rate = 0
WHERE sales_code IN (
  SELECT sales_code 
  FROM secondary_sales 
  WHERE wechat_name IN ('niu001002003', 'guazigongshe')
);

-- 4. 删除错误的销售记录
DELETE FROM secondary_sales 
WHERE wechat_name IN ('niu001002003', 'guazigongshe');

-- 5. 验证修复结果
SELECT 
  id,
  order_number,
  customer_wechat,
  sales_code
FROM orders 
WHERE customer_wechat IN ('niu001002003', 'guazigongshe');
