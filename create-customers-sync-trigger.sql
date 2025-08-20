-- ======================================
-- 创建客户数据同步触发器
-- 保持 customers_optimized 表数据实时更新
-- ======================================

-- 1. 客户信息变更同步（customers表 -> customers_optimized表）
CREATE OR REPLACE FUNCTION sync_customer_to_optimized()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 插入新客户
        INSERT INTO customers_optimized (
            id, customer_name, customer_wechat, tradingview_username,
            phone, email, sales_id, status, notes, created_at, updated_at
        ) VALUES (
            NEW.id, NEW.customer_name, NEW.customer_wechat, NEW.tradingview_username,
            NEW.phone, NEW.email, NEW.sales_id, 
            COALESCE(NEW.status, 'active'), 
            NEW.notes, NEW.created_at, NEW.updated_at
        )
        ON CONFLICT (id) DO UPDATE SET
            customer_name = EXCLUDED.customer_name,
            customer_wechat = EXCLUDED.customer_wechat,
            tradingview_username = EXCLUDED.tradingview_username,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            sales_id = EXCLUDED.sales_id,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            updated_at = EXCLUDED.updated_at;
            
        -- 更新销售信息
        UPDATE customers_optimized co
        SET 
            sales_code = s.sales_code,
            sales_wechat_name = s.wechat_name,
            sales_type = s.sales_type,
            primary_sales_id = CASE 
                WHEN s.sales_type = 'secondary' THEN s.primary_sales_id
                WHEN s.sales_type = 'primary' THEN s.id
                ELSE NULL
            END,
            primary_sales_wechat = ps.wechat_name,
            secondary_sales_id = CASE 
                WHEN s.sales_type = 'secondary' THEN s.id
                ELSE NULL
            END,
            secondary_sales_wechat = CASE 
                WHEN s.sales_type = 'secondary' THEN s.wechat_name
                ELSE NULL
            END
        FROM sales s
        LEFT JOIN sales ps ON s.primary_sales_id = ps.id
        WHERE co.id = NEW.id AND s.id = NEW.sales_id;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- 更新客户信息
        UPDATE customers_optimized
        SET 
            customer_name = NEW.customer_name,
            customer_wechat = NEW.customer_wechat,
            tradingview_username = NEW.tradingview_username,
            phone = NEW.phone,
            email = NEW.email,
            sales_id = NEW.sales_id,
            status = COALESCE(NEW.status, 'active'),
            notes = NEW.notes,
            updated_at = NEW.updated_at,
            synced_at = NOW()
        WHERE id = NEW.id;
        
        -- 如果销售变更，更新销售信息
        IF OLD.sales_id IS DISTINCT FROM NEW.sales_id THEN
            UPDATE customers_optimized co
            SET 
                sales_code = s.sales_code,
                sales_wechat_name = s.wechat_name,
                sales_type = s.sales_type,
                primary_sales_id = CASE 
                    WHEN s.sales_type = 'secondary' THEN s.primary_sales_id
                    WHEN s.sales_type = 'primary' THEN s.id
                    ELSE NULL
                END,
                primary_sales_wechat = ps.wechat_name,
                secondary_sales_id = CASE 
                    WHEN s.sales_type = 'secondary' THEN s.id
                    ELSE NULL
                END,
                secondary_sales_wechat = CASE 
                    WHEN s.sales_type = 'secondary' THEN s.wechat_name
                    ELSE NULL
                END
            FROM sales s
            LEFT JOIN sales ps ON s.primary_sales_id = ps.id
            WHERE co.id = NEW.id AND s.id = NEW.sales_id;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- 删除客户（可选，看是否需要硬删除）
        DELETE FROM customers_optimized WHERE id = OLD.id;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_sync_customer ON customers;
CREATE TRIGGER trg_sync_customer
AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW
EXECUTE FUNCTION sync_customer_to_optimized();

-- 2. 订单变更时更新客户统计（orders_optimized表 -> customers_optimized表）
CREATE OR REPLACE FUNCTION update_customer_stats_on_order_change()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    -- 确定受影响的客户ID
    IF TG_OP = 'DELETE' THEN
        v_customer_id := OLD.customer_id;
    ELSE
        v_customer_id := NEW.customer_id;
    END IF;
    
    -- 更新客户统计信息
    UPDATE customers_optimized co
    SET 
        -- 订单数量统计
        total_orders = (
            SELECT COUNT(*) 
            FROM orders_optimized 
            WHERE customer_id = v_customer_id 
                AND status NOT IN ('cancelled', 'rejected')
        ),
        active_orders = (
            SELECT COUNT(*) 
            FROM orders_optimized 
            WHERE customer_id = v_customer_id 
                AND status IN ('active', 'confirmed_config')
        ),
        pending_orders = (
            SELECT COUNT(*) 
            FROM orders_optimized 
            WHERE customer_id = v_customer_id 
                AND status IN ('pending_payment', 'pending_config')
        ),
        
        -- 金额统计
        total_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM orders_optimized 
            WHERE customer_id = v_customer_id 
                AND status NOT IN ('cancelled', 'rejected')
        ),
        total_paid_amount = (
            SELECT COALESCE(SUM(COALESCE(alipay_amount, 0) + COALESCE(crypto_amount, 0)), 0)
            FROM orders_optimized 
            WHERE customer_id = v_customer_id 
                AND status NOT IN ('cancelled', 'rejected')
        ),
        total_commission = (
            SELECT COALESCE(SUM(commission_amount), 0)
            FROM orders_optimized 
            WHERE customer_id = v_customer_id 
                AND status NOT IN ('cancelled', 'rejected')
        ),
        
        -- 最近订单信息
        last_order_date = (
            SELECT MAX(created_at) 
            FROM orders_optimized 
            WHERE customer_id = v_customer_id 
                AND status NOT IN ('cancelled', 'rejected')
        ),
        last_order_status = (
            SELECT status 
            FROM orders_optimized 
            WHERE customer_id = v_customer_id 
                AND status NOT IN ('cancelled', 'rejected')
            ORDER BY created_at DESC 
            LIMIT 1
        ),
        last_order_amount = (
            SELECT amount 
            FROM orders_optimized 
            WHERE customer_id = v_customer_id 
                AND status NOT IN ('cancelled', 'rejected')
            ORDER BY created_at DESC 
            LIMIT 1
        ),
        
        -- 首单信息（如果是第一单）
        first_order_date = COALESCE(
            co.first_order_date,
            (SELECT MIN(created_at) FROM orders_optimized WHERE customer_id = v_customer_id)
        ),
        first_order_amount = COALESCE(
            co.first_order_amount,
            (SELECT amount FROM orders_optimized WHERE customer_id = v_customer_id ORDER BY created_at ASC LIMIT 1)
        ),
        
        -- 分析字段
        avg_order_amount = (
            SELECT 
                CASE 
                    WHEN COUNT(*) > 0 THEN SUM(amount) / COUNT(*)
                    ELSE 0
                END
            FROM orders_optimized 
            WHERE customer_id = v_customer_id 
                AND status NOT IN ('cancelled', 'rejected')
        ),
        days_since_last_order = (
            SELECT 
                CASE 
                    WHEN MAX(created_at) IS NOT NULL 
                    THEN EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER
                    ELSE NULL
                END
            FROM orders_optimized 
            WHERE customer_id = v_customer_id 
                AND status NOT IN ('cancelled', 'rejected')
        ),
        
        synced_at = NOW()
    WHERE co.id = v_customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_update_customer_stats ON orders_optimized;
CREATE TRIGGER trg_update_customer_stats
AFTER INSERT OR UPDATE OR DELETE ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION update_customer_stats_on_order_change();

-- 3. 销售信息变更同步（sales表 -> customers_optimized表）
CREATE OR REPLACE FUNCTION sync_sales_info_to_customers()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新所有使用该销售的客户信息
    UPDATE customers_optimized co
    SET 
        sales_code = NEW.sales_code,
        sales_wechat_name = NEW.wechat_name,
        sales_type = NEW.sales_type,
        primary_sales_id = CASE 
            WHEN NEW.sales_type = 'secondary' THEN NEW.primary_sales_id
            WHEN NEW.sales_type = 'primary' THEN NEW.id
            ELSE NULL
        END,
        primary_sales_wechat = ps.wechat_name,
        secondary_sales_id = CASE 
            WHEN NEW.sales_type = 'secondary' THEN NEW.id
            ELSE NULL
        END,
        secondary_sales_wechat = CASE 
            WHEN NEW.sales_type = 'secondary' THEN NEW.wechat_name
            ELSE NULL
        END,
        synced_at = NOW()
    FROM sales s
    LEFT JOIN sales ps ON s.primary_sales_id = ps.id
    WHERE co.sales_id = NEW.id AND s.id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_sync_sales_to_customers ON sales;
CREATE TRIGGER trg_sync_sales_to_customers
AFTER UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION sync_sales_info_to_customers();

-- 4. 验证触发器创建成功
SELECT 
    trigger_name as "触发器名",
    event_manipulation as "触发事件",
    event_object_table as "目标表",
    action_statement as "执行函数"
FROM information_schema.triggers
WHERE trigger_name IN (
    'trg_sync_customer',
    'trg_update_customer_stats',
    'trg_sync_sales_to_customers'
)
ORDER BY trigger_name;

-- 5. 测试触发器（可选）
-- 更新一个客户，看是否同步
-- UPDATE customers 
-- SET notes = CONCAT(notes, ' - 测试同步 ', NOW()::text)
-- WHERE id = (SELECT id FROM customers LIMIT 1);

-- 检查是否同步
-- SELECT 
--     c.id,
--     c.notes as "原表notes",
--     co.notes as "优化表notes",
--     co.synced_at as "同步时间"
-- FROM customers c
-- JOIN customers_optimized co ON c.id = co.id
-- WHERE c.id = (SELECT id FROM customers LIMIT 1);