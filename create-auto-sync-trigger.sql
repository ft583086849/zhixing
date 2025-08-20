-- 创建自动同步触发器
-- 当orders表有新增或更新时，自动同步到orders_optimized表

-- 1. 创建同步函数
CREATE OR REPLACE FUNCTION sync_orders_to_optimized()
RETURNS TRIGGER AS $$
BEGIN
    -- 插入或更新orders_optimized表
    INSERT INTO orders_optimized (
        id,
        order_number,
        customer_name,
        customer_wechat,
        tradingview_username,
        sales_code,
        sales_type,
        duration,
        amount,
        payment_method,
        payment_status,
        payment_time,
        purchase_type,
        effective_time,
        expiry_time,
        status,
        alipay_amount,
        crypto_amount,
        commission_rate,
        commission_amount,
        primary_sales_id,
        secondary_sales_id,
        created_at,
        updated_at,
        -- 计算佣金拆分
        primary_commission_amount,
        secondary_commission_amount,
        secondary_commission_rate
    )
    VALUES (
        NEW.id,
        NEW.order_number,
        NEW.customer_name,
        NEW.customer_wechat,
        NEW.tradingview_username,
        NEW.sales_code,
        NEW.sales_type,
        NEW.duration,
        NEW.amount,
        NEW.payment_method,
        NEW.payment_status,
        NEW.payment_time,
        NEW.purchase_type,
        NEW.effective_time,
        NEW.expiry_time,
        NEW.status,
        NEW.alipay_amount,
        NEW.crypto_amount,
        NEW.commission_rate,
        NEW.commission_amount,
        NEW.primary_sales_id,
        NEW.secondary_sales_id,
        NEW.created_at,
        NEW.updated_at,
        -- 计算一级销售佣金
        CASE 
            WHEN NEW.sales_type = 'primary' THEN NEW.amount * 0.4
            WHEN NEW.sales_type = 'secondary' THEN NEW.amount * (0.4 - COALESCE(NEW.commission_rate, 0.25))
            ELSE 0
        END,
        -- 计算二级销售佣金
        CASE 
            WHEN NEW.sales_type = 'primary' THEN 0
            WHEN NEW.sales_type = 'secondary' THEN NEW.amount * COALESCE(NEW.commission_rate, 0.25)
            WHEN NEW.sales_type = 'independent' THEN NEW.amount * 0.4
            ELSE 0
        END,
        -- 二级销售佣金率
        CASE 
            WHEN NEW.sales_type = 'secondary' OR NEW.sales_type = 'independent' 
            THEN COALESCE(NEW.commission_rate, 0.25)
            ELSE 0
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        order_number = EXCLUDED.order_number,
        customer_name = EXCLUDED.customer_name,
        customer_wechat = EXCLUDED.customer_wechat,
        tradingview_username = EXCLUDED.tradingview_username,
        sales_code = EXCLUDED.sales_code,
        sales_type = EXCLUDED.sales_type,
        duration = EXCLUDED.duration,
        amount = EXCLUDED.amount,
        payment_method = EXCLUDED.payment_method,
        payment_status = EXCLUDED.payment_status,
        payment_time = EXCLUDED.payment_time,
        purchase_type = EXCLUDED.purchase_type,
        effective_time = EXCLUDED.effective_time,
        expiry_time = EXCLUDED.expiry_time,
        status = EXCLUDED.status,
        alipay_amount = EXCLUDED.alipay_amount,
        crypto_amount = EXCLUDED.crypto_amount,
        commission_rate = EXCLUDED.commission_rate,
        commission_amount = EXCLUDED.commission_amount,
        primary_sales_id = EXCLUDED.primary_sales_id,
        secondary_sales_id = EXCLUDED.secondary_sales_id,
        updated_at = EXCLUDED.updated_at,
        primary_commission_amount = EXCLUDED.primary_commission_amount,
        secondary_commission_amount = EXCLUDED.secondary_commission_amount,
        secondary_commission_rate = EXCLUDED.secondary_commission_rate;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建触发器
DROP TRIGGER IF EXISTS trg_sync_orders ON orders;
CREATE TRIGGER trg_sync_orders
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_orders_to_optimized();

-- 3. 验证触发器已创建
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trg_sync_orders';