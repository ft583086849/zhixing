-- =====================================================
-- 销售统计自动更新触发器
-- 当订单创建、更新或删除时，自动更新 sales_optimized 表的统计数据
-- =====================================================

-- 1. 创建函数：更新销售统计
CREATE OR REPLACE FUNCTION update_sales_statistics()
RETURNS TRIGGER AS $$
DECLARE
    v_sales_code VARCHAR(50);
    v_primary_sales_id INTEGER;
    v_amount DECIMAL(10,2);
    v_commission DECIMAL(10,2);
    v_operation VARCHAR(10);
    v_today_start TIMESTAMP;
    v_today_end TIMESTAMP;
    v_primary_sales_code VARCHAR(50);
BEGIN
    -- 确定操作类型
    IF TG_OP = 'INSERT' THEN
        v_sales_code := NEW.sales_code;
        v_primary_sales_id := NEW.primary_sales_id;
        v_amount := COALESCE(NEW.total_amount, NEW.amount, 0);
        v_commission := COALESCE(NEW.commission_amount, 0);
        v_operation := 'ADD';
    ELSIF TG_OP = 'UPDATE' THEN
        -- 只在关键字段变化时更新
        IF OLD.sales_code IS DISTINCT FROM NEW.sales_code OR
           OLD.total_amount IS DISTINCT FROM NEW.total_amount OR
           OLD.amount IS DISTINCT FROM NEW.amount OR
           OLD.commission_amount IS DISTINCT FROM NEW.commission_amount OR
           OLD.status IS DISTINCT FROM NEW.status THEN
            
            -- 先减去旧值
            IF OLD.sales_code IS NOT NULL THEN
                PERFORM update_single_sales_stats(
                    OLD.sales_code, 
                    -COALESCE(OLD.total_amount, OLD.amount, 0),
                    -COALESCE(OLD.commission_amount, 0),
                    OLD.created_at,
                    'SUBTRACT'
                );
            END IF;
            
            -- 再加上新值
            v_sales_code := NEW.sales_code;
            v_primary_sales_id := NEW.primary_sales_id;
            v_amount := COALESCE(NEW.total_amount, NEW.amount, 0);
            v_commission := COALESCE(NEW.commission_amount, 0);
            v_operation := 'ADD';
        ELSE
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_sales_code := OLD.sales_code;
        v_primary_sales_id := OLD.primary_sales_id;
        v_amount := -COALESCE(OLD.total_amount, OLD.amount, 0);
        v_commission := -COALESCE(OLD.commission_amount, 0);
        v_operation := 'SUBTRACT';
    END IF;
    
    -- 更新销售统计
    IF v_sales_code IS NOT NULL THEN
        PERFORM update_single_sales_stats(
            v_sales_code,
            v_amount,
            v_commission,
            COALESCE(NEW.created_at, OLD.created_at),
            v_operation
        );
    END IF;
    
    -- 如果是二级销售的订单，也要更新一级销售的统计
    IF v_primary_sales_id IS NOT NULL AND NEW.sales_type = 'secondary' THEN
        -- 获取一级销售的 sales_code
        SELECT sales_code INTO v_primary_sales_code
        FROM primary_sales
        WHERE id = v_primary_sales_id;
        
        IF v_primary_sales_code IS NOT NULL THEN
            -- 更新一级销售的二级订单统计
            UPDATE sales_optimized
            SET 
                secondary_orders_amount = COALESCE(secondary_orders_amount, 0) + v_amount,
                updated_at = NOW()
            WHERE sales_code = v_primary_sales_code;
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建辅助函数：更新单个销售的统计
CREATE OR REPLACE FUNCTION update_single_sales_stats(
    p_sales_code VARCHAR(50),
    p_amount DECIMAL(10,2),
    p_commission DECIMAL(10,2),
    p_order_time TIMESTAMP,
    p_operation VARCHAR(10)
) RETURNS VOID AS $$
DECLARE
    v_china_today_start TIMESTAMP;
    v_china_today_end TIMESTAMP;
    v_is_today BOOLEAN;
    v_multiplier INTEGER;
BEGIN
    -- 设置乘数（ADD=1, SUBTRACT=-1）
    v_multiplier := CASE WHEN p_operation = 'SUBTRACT' THEN -1 ELSE 1 END;
    
    -- 计算中国时区的今日时间范围（UTC+8）
    -- 中国时间00:00 = UTC前一天16:00
    v_china_today_start := date_trunc('day', NOW() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'UTC';
    v_china_today_end := v_china_today_start + INTERVAL '1 day';
    
    -- 判断订单是否是今日的
    v_is_today := p_order_time >= v_china_today_start AND p_order_time < v_china_today_end;
    
    -- 更新销售统计
    UPDATE sales_optimized
    SET 
        -- 总计统计
        total_orders = GREATEST(0, COALESCE(total_orders, 0) + v_multiplier),
        total_amount = GREATEST(0, COALESCE(total_amount, 0) + p_amount),
        total_direct_orders = GREATEST(0, COALESCE(total_direct_orders, 0) + v_multiplier),
        total_direct_amount = GREATEST(0, COALESCE(total_direct_amount, 0) + p_amount),
        direct_commission = GREATEST(0, COALESCE(direct_commission, 0) + p_commission),
        total_commission = GREATEST(0, COALESCE(total_commission, 0) + p_commission),
        
        -- 今日统计（仅当订单是今日的）
        today_orders = CASE 
            WHEN v_is_today THEN GREATEST(0, COALESCE(today_orders, 0) + v_multiplier)
            ELSE today_orders 
        END,
        today_amount = CASE 
            WHEN v_is_today THEN GREATEST(0, COALESCE(today_amount, 0) + p_amount)
            ELSE today_amount 
        END,
        today_commission = CASE 
            WHEN v_is_today THEN GREATEST(0, COALESCE(today_commission, 0) + p_commission)
            ELSE today_commission 
        END,
        
        updated_at = NOW()
    WHERE sales_code = p_sales_code;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建触发器：订单插入时更新统计
DROP TRIGGER IF EXISTS trg_update_sales_stats_on_insert ON orders_optimized;
CREATE TRIGGER trg_update_sales_stats_on_insert
AFTER INSERT ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION update_sales_statistics();

-- 4. 创建触发器：订单更新时更新统计
DROP TRIGGER IF EXISTS trg_update_sales_stats_on_update ON orders_optimized;
CREATE TRIGGER trg_update_sales_stats_on_update
AFTER UPDATE ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION update_sales_statistics();

-- 5. 创建触发器：订单删除时更新统计
DROP TRIGGER IF EXISTS trg_update_sales_stats_on_delete ON orders_optimized;
CREATE TRIGGER trg_update_sales_stats_on_delete
AFTER DELETE ON orders_optimized
FOR EACH ROW
EXECUTE FUNCTION update_sales_statistics();

-- 6. 创建定时任务：每天凌晨重置今日统计（可选）
CREATE OR REPLACE FUNCTION reset_today_statistics()
RETURNS VOID AS $$
BEGIN
    -- 每天凌晨重置所有销售的今日统计
    UPDATE sales_optimized
    SET 
        today_orders = 0,
        today_amount = 0,
        today_commission = 0,
        updated_at = NOW()
    WHERE today_orders > 0 OR today_amount > 0 OR today_commission > 0;
END;
$$ LANGUAGE plpgsql;

-- 7. 验证触发器创建成功
SELECT 
    '==================== 销售统计触发器创建完成 ====================' as message;

SELECT 
    trigger_name as "触发器名称",
    event_manipulation as "触发事件",
    event_object_table as "监控表",
    action_timing as "执行时机"
FROM information_schema.triggers
WHERE trigger_name LIKE 'trg_update_sales_stats_%'
ORDER BY trigger_name;

-- 8. 使用说明
SELECT 
    '==================== 使用说明 ====================' as message,
    '1. 新订单创建时自动更新销售统计' as note1,
    '2. 订单金额或状态变更时自动重新计算' as note2,
    '3. 今日统计基于中国时区（UTC+8）' as note3,
    '4. 支持订单删除时的统计回滚' as note4,
    '5. 一级销售的二级订单统计也会自动更新' as note5;