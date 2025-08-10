-- 🔧 创建config_confirmed自动同步触发器（修正版）
-- 目的：确保config_confirmed字段始终与status字段保持同步
-- 作者：System
-- 日期：2025-01-07

-- ============================================================================
-- 1. 先同步现有数据
-- ============================================================================
-- 同步所有不一致的数据
UPDATE orders 
SET config_confirmed = (
    status IN ('confirmed', 'confirmed_configuration', 'confirmed_config', 'active')
)
WHERE config_confirmed IS DISTINCT FROM (
    status IN ('confirmed', 'confirmed_configuration', 'confirmed_config', 'active')
);

-- 查看同步结果
SELECT 
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE config_confirmed = true) as confirmed_true,
    COUNT(*) FILTER (WHERE config_confirmed = false) as confirmed_false,
    COUNT(*) FILTER (WHERE config_confirmed IS NULL) as confirmed_null,
    COUNT(*) FILTER (WHERE 
        config_confirmed = (status IN ('confirmed', 'confirmed_configuration', 'confirmed_config', 'active'))
    ) as consistent_count,
    COUNT(*) FILTER (WHERE 
        config_confirmed IS DISTINCT FROM (status IN ('confirmed', 'confirmed_configuration', 'confirmed_config', 'active'))
    ) as inconsistent_count
FROM orders;

-- ============================================================================
-- 2. 创建触发器函数
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_config_confirmed()
RETURNS TRIGGER AS $$
BEGIN
    -- 根据status自动设置config_confirmed
    -- 只在这些状态下设置为true，其他都是false
    NEW.config_confirmed = NEW.status IN (
        'confirmed',                  -- 已确认
        'confirmed_configuration',    -- 已确认配置
        'confirmed_config',           -- 已确认配置（简写）
        'active'                      -- 活跃（已生效）
    );
    
    -- 记录日志（可选，用于调试）
    -- RAISE NOTICE 'sync_config_confirmed: status=%, config_confirmed=%', NEW.status, NEW.config_confirmed;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. 创建触发器
-- ============================================================================
-- 先删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS sync_config_confirmed_trigger ON orders;

-- 创建新触发器
-- BEFORE INSERT OR UPDATE: 在插入或更新之前执行
-- FOR EACH ROW: 对每一行都执行
CREATE TRIGGER sync_config_confirmed_trigger
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_config_confirmed();

-- ============================================================================
-- 4. 验证触发器工作
-- ============================================================================
-- 测试1：插入新订单（使用正确的字段）
DO $$
DECLARE
    test_order_id INT;
    test_order_number VARCHAR(50);
BEGIN
    -- 生成唯一的订单号
    test_order_number := 'TEST_TRIGGER_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- 插入测试订单（pending状态）
    INSERT INTO orders (
        sales_code,
        sales_type,
        tradingview_username,
        customer_wechat,
        duration,
        amount,
        payment_method,
        payment_time,
        status,
        created_at
    ) VALUES (
        'PRI123456789',           -- sales_code
        'primary',                -- sales_type
        'test_user',              -- tradingview_username
        'test_wechat',            -- customer_wechat
        '1month',                 -- duration
        100.00,                   -- amount
        'crypto',                 -- payment_method
        NOW(),                    -- payment_time
        'pending',                -- status
        NOW()                     -- created_at
    ) RETURNING id INTO test_order_id;
    
    -- 检查config_confirmed应该是false
    IF NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE id = test_order_id AND config_confirmed = false
    ) THEN
        RAISE EXCEPTION 'Trigger test failed: pending order should have config_confirmed=false';
    END IF;
    
    -- 更新为confirmed状态
    UPDATE orders SET status = 'confirmed' WHERE id = test_order_id;
    
    -- 检查config_confirmed应该是true
    IF NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE id = test_order_id AND config_confirmed = true
    ) THEN
        RAISE EXCEPTION 'Trigger test failed: confirmed order should have config_confirmed=true';
    END IF;
    
    -- 更新为rejected状态
    UPDATE orders SET status = 'rejected' WHERE id = test_order_id;
    
    -- 检查config_confirmed应该变回false
    IF NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE id = test_order_id AND config_confirmed = false
    ) THEN
        RAISE EXCEPTION 'Trigger test failed: rejected order should have config_confirmed=false';
    END IF;
    
    -- 清理测试数据
    DELETE FROM orders WHERE id = test_order_id;
    
    RAISE NOTICE '✅ 触发器测试通过！所有状态同步正常。';
END $$;

-- ============================================================================
-- 5. 最终验证
-- ============================================================================
-- 确认所有数据都是一致的
SELECT 
    CASE 
        WHEN COUNT(*) FILTER (WHERE 
            config_confirmed IS DISTINCT FROM (status IN ('confirmed', 'confirmed_configuration', 'confirmed_config', 'active'))
        ) = 0 
        THEN '✅ 所有数据一致性检查通过！'
        ELSE '❌ 发现不一致数据，请检查！'
    END as validation_result,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE 
        config_confirmed = (status IN ('confirmed', 'confirmed_configuration', 'confirmed_config', 'active'))
    ) as consistent_orders,
    COUNT(*) FILTER (WHERE 
        config_confirmed IS DISTINCT FROM (status IN ('confirmed', 'confirmed_configuration', 'confirmed_config', 'active'))
    ) as inconsistent_orders
FROM orders;

-- ============================================================================
-- 6. 查看触发器信息
-- ============================================================================
SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    proname as function_name,
    tgenabled as is_enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'orders'::regclass
AND tgname = 'sync_config_confirmed_trigger';

-- ============================================================================
-- 7. 显示同步规则
-- ============================================================================
SELECT 
    '同步规则说明' as info,
    '以下状态会设置config_confirmed=true: confirmed, confirmed_configuration, confirmed_config, active' as rule1,
    '其他所有状态会设置config_confirmed=false' as rule2;
