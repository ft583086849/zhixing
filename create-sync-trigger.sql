-- 创建自动同步触发器
-- 确保所有写入orders表的数据都同步到orders_optimized表

-- 1. 创建同步函数
CREATE OR REPLACE FUNCTION sync_orders_to_optimized()
RETURNS TRIGGER AS $$
BEGIN
  -- 插入或更新orders_optimized表
  INSERT INTO orders_optimized (
    id, order_number, customer_name, customer_phone, customer_email, 
    amount, status, sales_code, sales_type, commission_amount, 
    payment_status, created_at, updated_at, primary_sales_id, 
    tradingview_username, customer_wechat, duration, payment_method, 
    payment_time, purchase_type, effective_time, expiry_time, 
    submit_time, screenshot_path, commission_rate, secondary_sales_id, 
    alipay_amount, crypto_amount, config_confirmed, link_code, 
    screenshot_data, actual_payment_amount
  )
  VALUES (
    NEW.id, NEW.order_number, NEW.customer_name, NEW.customer_phone, NEW.customer_email,
    NEW.amount, NEW.status, NEW.sales_code, NEW.sales_type, NEW.commission_amount,
    NEW.payment_status, NEW.created_at, NEW.updated_at, NEW.primary_sales_id,
    NEW.tradingview_username, NEW.customer_wechat, 
    -- 规范化duration字段
    CASE NEW.duration
      WHEN '7days' THEN '7天'
      WHEN '1month' THEN '1个月'
      WHEN '3months' THEN '3个月'
      WHEN '6months' THEN '6个月'
      WHEN '1year' THEN '1年'
      ELSE NEW.duration
    END,
    NEW.payment_method,
    NEW.payment_time, NEW.purchase_type, NEW.effective_time, NEW.expiry_time,
    NEW.submit_time, NEW.screenshot_path, NEW.commission_rate, NEW.secondary_sales_id,
    NEW.alipay_amount, NEW.crypto_amount, NEW.config_confirmed, NEW.link_code,
    NEW.screenshot_data, NEW.actual_payment_amount
  )
  ON CONFLICT (id) DO UPDATE SET
    order_number = EXCLUDED.order_number,
    customer_name = EXCLUDED.customer_name,
    customer_phone = EXCLUDED.customer_phone,
    customer_email = EXCLUDED.customer_email,
    amount = EXCLUDED.amount,
    status = EXCLUDED.status,
    sales_code = EXCLUDED.sales_code,
    sales_type = EXCLUDED.sales_type,
    commission_amount = EXCLUDED.commission_amount,
    payment_status = EXCLUDED.payment_status,
    updated_at = EXCLUDED.updated_at,
    primary_sales_id = EXCLUDED.primary_sales_id,
    tradingview_username = EXCLUDED.tradingview_username,
    customer_wechat = EXCLUDED.customer_wechat,
    duration = EXCLUDED.duration,
    payment_method = EXCLUDED.payment_method,
    payment_time = EXCLUDED.payment_time,
    purchase_type = EXCLUDED.purchase_type,
    effective_time = EXCLUDED.effective_time,
    expiry_time = EXCLUDED.expiry_time,
    submit_time = EXCLUDED.submit_time,
    screenshot_path = EXCLUDED.screenshot_path,
    commission_rate = EXCLUDED.commission_rate,
    secondary_sales_id = EXCLUDED.secondary_sales_id,
    alipay_amount = EXCLUDED.alipay_amount,
    crypto_amount = EXCLUDED.crypto_amount,
    config_confirmed = EXCLUDED.config_confirmed,
    link_code = EXCLUDED.link_code,
    screenshot_data = EXCLUDED.screenshot_data,
    actual_payment_amount = EXCLUDED.actual_payment_amount;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建INSERT触发器
DROP TRIGGER IF EXISTS auto_sync_orders_insert ON orders;
CREATE TRIGGER auto_sync_orders_insert
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_orders_to_optimized();

-- 3. 创建UPDATE触发器
DROP TRIGGER IF EXISTS auto_sync_orders_update ON orders;
CREATE TRIGGER auto_sync_orders_update
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_orders_to_optimized();

-- 4. 添加说明注释
COMMENT ON TRIGGER auto_sync_orders_insert ON orders IS 
'自动同步新插入的订单到orders_optimized表，并规范化duration字段';

COMMENT ON TRIGGER auto_sync_orders_update ON orders IS 
'自动同步更新的订单到orders_optimized表';

-- 验证触发器创建成功
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE 'auto_sync_orders%';