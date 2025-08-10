-- 🔧 创建config_confirmed自动同步触发器（最终版）
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
    '数据同步完成' as step,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE config_confirmed = true) as confirmed_true,
    COUNT(*) FILTER (WHERE config_confirmed = false) as confirmed_false,
    COUNT(*) FILTER (WHERE config_confirmed IS NULL) as confirmed_null
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. 创建触发器
-- ============================================================================
-- 先删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS sync_config_confirmed_trigger ON orders;

-- 创建新触发器
CREATE TRIGGER sync_config_confirmed_trigger
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_config_confirmed();

-- ============================================================================
-- 4. 验证触发器工作（简化版测试）
-- ============================================================================
-- 方法1：查找一个现有订单进行测试
DO $$
DECLARE
    test_order_id INT;
    original_status VARCHAR(50);
    original_config BOOLEAN;
BEGIN
    -- 找一个现有订单进行测试
    SELECT id, status, config_confirmed 
    INTO test_order_id, original_status, original_config
    FROM orders 
    LIMIT 1;
    
    IF test_order_id IS NOT NULL THEN
        -- 测试1：更新为pending
        UPDATE orders SET status = 'pending' WHERE id = test_order_id;
        
        IF NOT EXISTS (
            SELECT 1 FROM orders 
            WHERE id = test_order_id AND config_confirmed = false
        ) THEN
            RAISE EXCEPTION 'Test failed: pending should have config_confirmed=false';
        END IF;
        
        -- 测试2：更新为confirmed
        UPDATE orders SET status = 'confirmed' WHERE id = test_order_id;
        
        IF NOT EXISTS (
            SELECT 1 FROM orders 
            WHERE id = test_order_id AND config_confirmed = true
        ) THEN
            RAISE EXCEPTION 'Test failed: confirmed should have config_confirmed=true';
        END IF;
        
        -- 测试3：更新为active
        UPDATE orders SET status = 'active' WHERE id = test_order_id;
        
        IF NOT EXISTS (
            SELECT 1 FROM orders 
            WHERE id = test_order_id AND config_confirmed = true
        ) THEN
            RAISE EXCEPTION 'Test failed: active should have config_confirmed=true';
        END IF;
        
        -- 测试4：更新为rejected
        UPDATE orders SET status = 'rejected' WHERE id = test_order_id;
        
        IF NOT EXISTS (
            SELECT 1 FROM orders 
            WHERE id = test_order_id AND config_confirmed = false
        ) THEN
            RAISE EXCEPTION 'Test failed: rejected should have config_confirmed=false';
        END IF;
        
        -- 恢复原始状态
        UPDATE orders 
        SET status = original_status
        WHERE id = test_order_id;
        
        RAISE NOTICE '✅ 触发器测试通过！所有状态同步正常。';
    ELSE
        RAISE NOTICE '⚠️ 没有找到测试订单，跳过测试。但触发器已创建成功。';
    END IF;
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
    '触发器信息' as info_type,
    tgname as trigger_name,
    proname as function_name,
    CASE tgenabled 
        WHEN 'O' THEN '✅ 已启用'
        WHEN 'D' THEN '❌ 已禁用'
        ELSE '未知状态'
    END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'orders'::regclass
AND tgname = 'sync_config_confirmed_trigger';

-- ============================================================================
-- 7. 显示同步规则
-- ============================================================================
SELECT 
    '触发器同步规则' as title,
    '当status为以下值时，config_confirmed自动设置为TRUE：' as description,
    string_agg(status, ', ') as true_statuses
FROM (
    VALUES 
        ('confirmed'),
        ('confirmed_configuration'),
        ('confirmed_config'),
        ('active')
) AS t(status)
UNION ALL
SELECT 
    '',
    '其他所有status值，config_confirmed自动设置为FALSE',
    '例如: pending, pending_payment, rejected, cancelled等';

-- ============================================================================
-- 8. 统计当前订单状态分布
-- ============================================================================
SELECT 
    status,
    COUNT(*) as count,
    CASE 
        WHEN status IN ('confirmed', 'confirmed_configuration', 'confirmed_config', 'active') 
        THEN '✅ config_confirmed = true'
        ELSE '❌ config_confirmed = false'
    END as expected_config
FROM orders
GROUP BY status
ORDER BY count DESC;
