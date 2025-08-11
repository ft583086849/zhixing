
-- 查询guazigongshe和niu001002003的订单
SELECT id, order_number, customer_wechat, sales_code, primary_sales_id, secondary_sales_id
FROM orders 
WHERE customer_wechat IN ('guazigongshe', 'niu001002003');

-- 查询是否有销售微信为这两个值的记录
SELECT id, wechat_name, sales_code FROM primary_sales WHERE wechat_name IN ('guazigongshe', 'niu001002003');
SELECT id, wechat_name, sales_code FROM secondary_sales WHERE wechat_name IN ('guazigongshe', 'niu001002003');

