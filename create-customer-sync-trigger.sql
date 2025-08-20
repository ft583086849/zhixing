-- =============================================
-- 创建触发器：订单变更时自动更新客户数据
-- =============================================

-- 创建更新客户统计的函数
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_sales_wechat VARCHAR(100);
  v_sales_type VARCHAR(20);
  v_primary_sales_name VARCHAR(100);
  v_total_orders INT;
  v_valid_orders INT;
  v_total_amount DECIMAL(10,2);
  v_actual_amount DECIMAL(10,2);
  v_commission_amount DECIMAL(10,2);
  v_latest_order RECORD;
  v_first_order RECORD;
BEGIN
  -- 获取销售信息
  SELECT 
    COALESCE(s.wechat_name, ps.wechat_name, ss.wechat_name) as sales_wechat,
    CASE 
      WHEN ps.id IS NOT NULL THEN 'primary'
      WHEN ss.id IS NOT NULL THEN 'secondary'
      ELSE 'independent'
    END as sales_type,
    ps2.wechat_name as primary_name
  INTO v_sales_wechat, v_sales_type, v_primary_sales_name
  FROM (SELECT NEW.sales_code as code) t
  LEFT JOIN sales_optimized s ON s.sales_code = t.code
  LEFT JOIN primary_sales ps ON ps.sales_code = t.code
  LEFT JOIN secondary_sales ss ON ss.sales_code = t.code
  LEFT JOIN primary_sales ps2 ON ps2.id = ss.primary_sales_id;

  -- 统计订单数据
  SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status IN ('confirmed_payment', 'confirmed_config', 'active') THEN 1 END) as valid_orders,
    COALESCE(SUM(amount), 0) as total_amount,
    COALESCE(SUM(actual_payment_amount), 0) as actual_amount,
    COALESCE(SUM(commission_amount), 0) as commission_amount
  INTO v_total_orders, v_valid_orders, v_total_amount, v_actual_amount, v_commission_amount
  FROM orders_optimized
  WHERE customer_wechat = NEW.customer_wechat 
    AND tradingview_username = NEW.tradingview_username
    AND status != 'rejected';

  -- 获取最新订单信息
  SELECT * INTO v_latest_order
  FROM orders_optimized
  WHERE customer_wechat = NEW.customer_wechat 
    AND tradingview_username = NEW.tradingview_username
    AND status != 'rejected'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 获取首单信息
  SELECT * INTO v_first_order
  FROM orders_optimized
  WHERE customer_wechat = NEW.customer_wechat 
    AND tradingview_username = NEW.tradingview_username
    AND status != 'rejected'
  ORDER BY created_at ASC
  LIMIT 1;

  -- 插入或更新客户记录
  INSERT INTO customers_optimized (
    customer_wechat,
    tradingview_username,
    sales_code,
    sales_wechat_name,
    sales_type,
    primary_sales_name,
    total_orders,
    valid_orders,
    total_amount,
    actual_payment_amount,
    commission_amount,
    latest_order_id,
    latest_order_time,
    latest_order_status,
    latest_order_amount,
    latest_expiry_time,
    latest_duration,
    first_order_id,
    first_order_time,
    first_order_amount,
    days_since_last_order,
    created_at,
    updated_at
  ) VALUES (
    NEW.customer_wechat,
    NEW.tradingview_username,
    NEW.sales_code,
    v_sales_wechat,
    v_sales_type,
    v_primary_sales_name,
    v_total_orders,
    v_valid_orders,
    v_total_amount,
    v_actual_amount,
    v_commission_amount,
    v_latest_order.id,
    v_latest_order.created_at,
    v_latest_order.status,
    v_latest_order.amount,
    v_latest_order.expiry_time,
    v_latest_order.duration,
    v_first_order.id,
    v_first_order.created_at,
    v_first_order.amount,
    EXTRACT(DAY FROM NOW() - v_latest_order.created_at),
    NOW(),
    NOW()
  )
  ON CONFLICT (customer_wechat, tradingview_username)
  DO UPDATE SET
    sales_code = EXCLUDED.sales_code,
    sales_wechat_name = EXCLUDED.sales_wechat_name,
    sales_type = EXCLUDED.sales_type,
    primary_sales_name = EXCLUDED.primary_sales_name,
    total_orders = EXCLUDED.total_orders,
    valid_orders = EXCLUDED.valid_orders,
    total_amount = EXCLUDED.total_amount,
    actual_payment_amount = EXCLUDED.actual_payment_amount,
    commission_amount = EXCLUDED.commission_amount,
    latest_order_id = EXCLUDED.latest_order_id,
    latest_order_time = EXCLUDED.latest_order_time,
    latest_order_status = EXCLUDED.latest_order_status,
    latest_order_amount = EXCLUDED.latest_order_amount,
    latest_expiry_time = EXCLUDED.latest_expiry_time,
    latest_duration = EXCLUDED.latest_duration,
    days_since_last_order = EXCLUDED.days_since_last_order,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS sync_customer_on_order_change ON orders_optimized;
CREATE TRIGGER sync_customer_on_order_change
AFTER INSERT OR UPDATE ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION update_customer_stats();