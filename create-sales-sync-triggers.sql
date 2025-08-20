-- ========================================
-- 销售表自动同步触发器
-- 保持 primary_sales/secondary_sales 与 sales_optimized 同步
-- ========================================

-- ==================== PRIMARY_SALES 同步触发器 ====================

-- 1. 创建 primary_sales INSERT 触发器函数
CREATE OR REPLACE FUNCTION sync_primary_sales_insert()
RETURNS TRIGGER AS $$
DECLARE

    new_uuid UUID;
BEGIN
    -- 生成新的UUID
    new_uuid := gen_random_uuid();
    
    -- 插入到 sales_optimized
    INSERT INTO sales_optimized (
        id,
        sales_code,
        wechat_name,
        name,
        sales_type,
        sales_level,
        commission_rate,
        payment_method,
        payment_info,
        referral_code,
        status,
        is_active,
        phone,
        email,
        created_at,
        updated_at,
        original_table,
        original_id
    )
    VALUES (
        new_uuid,
        NEW.sales_code,
        NEW.wechat_name,
        NEW.name,
        'primary',
        1,
        CASE 
            WHEN NEW.commission_rate > 1 THEN NEW.commission_rate / 100
            ELSE COALESCE(NEW.commission_rate, 0.4)
        END,
        NEW.payment_method,
        NEW.payment_address,
        NEW.secondary_registration_code,
        'active',
        true,
        NEW.phone,
        NEW.email,
        NEW.created_at,
        NEW.updated_at,
        'primary_sales',
        NULL  -- 暂不存储原表ID
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建 primary_sales UPDATE 触发器函数
CREATE OR REPLACE FUNCTION sync_primary_sales_update()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新 sales_optimized
    UPDATE sales_optimized
    SET 
        sales_code = NEW.sales_code,
        wechat_name = NEW.wechat_name,
        name = NEW.name,
        commission_rate = CASE 
            WHEN NEW.commission_rate > 1 THEN NEW.commission_rate / 100
            ELSE COALESCE(NEW.commission_rate, 0.4)
        END,
        payment_method = NEW.payment_method,
        payment_info = NEW.payment_address,
        referral_code = NEW.secondary_registration_code,
        phone = NEW.phone,
        email = NEW.email,
        updated_at = NOW()
    WHERE sales_code = OLD.sales_code 
      AND original_table = 'primary_sales';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建 primary_sales DELETE 触发器函数
CREATE OR REPLACE FUNCTION sync_primary_sales_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- 软删除：将状态设为 inactive
    UPDATE sales_optimized
    SET 
        status = 'inactive',
        is_active = false,
        updated_at = NOW()
    WHERE sales_code = OLD.sales_code 
      AND original_table = 'primary_sales';
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ==================== SECONDARY_SALES 同步触发器 ====================

-- 4. 创建 secondary_sales INSERT 触发器函数
CREATE OR REPLACE FUNCTION sync_secondary_sales_insert()
RETURNS TRIGGER AS $$
DECLARE
    new_uuid UUID;
    parent_uuid UUID;
    parent_code VARCHAR(50);
    parent_name VARCHAR(100);
BEGIN
    -- 生成新的UUID
    new_uuid := gen_random_uuid();
    
    -- 获取上级销售信息（如果有）
    IF NEW.primary_sales_id IS NOT NULL THEN
        SELECT so.id, p.sales_code, p.wechat_name
        INTO parent_uuid, parent_code, parent_name
        FROM primary_sales p
        LEFT JOIN sales_optimized so ON so.sales_code = p.sales_code 
            AND so.original_table = 'primary_sales'
        WHERE p.id = NEW.primary_sales_id;
    END IF;
    
    -- 插入到 sales_optimized
    INSERT INTO sales_optimized (
        id,
        sales_code,
        wechat_name,
        name,
        sales_type,
        sales_level,
        parent_sales_id,
        parent_sales_code,
        parent_sales_name,
        commission_rate,
        payment_method,
        payment_info,
        referral_code,
        status,
        is_active,
        phone,
        email,
        created_at,
        updated_at,
        original_table,
        original_id
    )
    VALUES (
        new_uuid,
        NEW.sales_code,
        NEW.wechat_name,
        NEW.name,
        CASE 
            WHEN NEW.primary_sales_id IS NULL THEN 'independent'
            ELSE 'secondary'
        END,
        2,
        parent_uuid,
        parent_code,
        parent_name,
        CASE 
            WHEN NEW.commission_rate = 25.00 THEN 0.25
            WHEN NEW.commission_rate > 1 THEN NEW.commission_rate / 100
            ELSE COALESCE(NEW.commission_rate, 0.25)
        END,
        NULL,
        NEW.payment_address,
        NEW.primary_registration_code,
        COALESCE(NEW.status, 'active'),
        true,
        NEW.phone,
        NEW.email,
        NEW.created_at,
        NEW.updated_at,
        'secondary_sales',
        NULL  -- 暂不存储原表ID
    );
    
    -- 更新一级销售的团队人数
    IF parent_uuid IS NOT NULL THEN
        UPDATE sales_optimized
        SET team_size = COALESCE(team_size, 0) + 1
        WHERE id = parent_uuid;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建 secondary_sales UPDATE 触发器函数
CREATE OR REPLACE FUNCTION sync_secondary_sales_update()
RETURNS TRIGGER AS $$
DECLARE
    parent_uuid UUID;
    parent_code VARCHAR(50);
    parent_name VARCHAR(100);
BEGIN
    -- 获取新的上级销售信息（如果有）
    IF NEW.primary_sales_id IS NOT NULL THEN
        SELECT so.id, p.sales_code, p.wechat_name
        INTO parent_uuid, parent_code, parent_name
        FROM primary_sales p
        LEFT JOIN sales_optimized so ON so.sales_code = p.sales_code 
            AND so.original_table = 'primary_sales'
        WHERE p.id = NEW.primary_sales_id;
    END IF;
    
    -- 更新 sales_optimized
    UPDATE sales_optimized
    SET 
        sales_code = NEW.sales_code,
        wechat_name = NEW.wechat_name,
        name = NEW.name,
        sales_type = CASE 
            WHEN NEW.primary_sales_id IS NULL THEN 'independent'
            ELSE 'secondary'
        END,
        parent_sales_id = parent_uuid,
        parent_sales_code = parent_code,
        parent_sales_name = parent_name,
        commission_rate = CASE 
            WHEN NEW.commission_rate = 25.00 THEN 0.25
            WHEN NEW.commission_rate > 1 THEN NEW.commission_rate / 100
            ELSE COALESCE(NEW.commission_rate, 0.25)
        END,
        payment_info = NEW.payment_address,
        referral_code = NEW.primary_registration_code,
        status = COALESCE(NEW.status, 'active'),
        phone = NEW.phone,
        email = NEW.email,
        updated_at = NOW()
    WHERE sales_code = OLD.sales_code 
      AND original_table = 'secondary_sales';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建 secondary_sales DELETE 触发器函数
CREATE OR REPLACE FUNCTION sync_secondary_sales_delete()
RETURNS TRIGGER AS $$
DECLARE
    parent_uuid UUID;
BEGIN
    -- 获取上级销售UUID
    SELECT parent_sales_id INTO parent_uuid
    FROM sales_optimized
    WHERE sales_code = OLD.sales_code 
      AND original_table = 'secondary_sales';
    
    -- 软删除：将状态设为 inactive
    UPDATE sales_optimized
    SET 
        status = 'inactive',
        is_active = false,
        updated_at = NOW()
    WHERE sales_code = OLD.sales_code 
      AND original_table = 'secondary_sales';
    
    -- 更新一级销售的团队人数
    IF parent_uuid IS NOT NULL THEN
        UPDATE sales_optimized
        SET team_size = GREATEST(COALESCE(team_size, 0) - 1, 0)
        WHERE id = parent_uuid;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ==================== 创建触发器 ====================

-- 7. 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS trg_sync_primary_sales_insert ON primary_sales;
DROP TRIGGER IF EXISTS trg_sync_primary_sales_update ON primary_sales;
DROP TRIGGER IF EXISTS trg_sync_primary_sales_delete ON primary_sales;
DROP TRIGGER IF EXISTS trg_sync_secondary_sales_insert ON secondary_sales;
DROP TRIGGER IF EXISTS trg_sync_secondary_sales_update ON secondary_sales;
DROP TRIGGER IF EXISTS trg_sync_secondary_sales_delete ON secondary_sales;

-- 8. 创建新触发器
CREATE TRIGGER trg_sync_primary_sales_insert
AFTER INSERT ON primary_sales
FOR EACH ROW
EXECUTE FUNCTION sync_primary_sales_insert();

CREATE TRIGGER trg_sync_primary_sales_update
AFTER UPDATE ON primary_sales
FOR EACH ROW
EXECUTE FUNCTION sync_primary_sales_update();

CREATE TRIGGER trg_sync_primary_sales_delete
AFTER DELETE ON primary_sales
FOR EACH ROW
EXECUTE FUNCTION sync_primary_sales_delete();

CREATE TRIGGER trg_sync_secondary_sales_insert
AFTER INSERT ON secondary_sales
FOR EACH ROW
EXECUTE FUNCTION sync_secondary_sales_insert();

CREATE TRIGGER trg_sync_secondary_sales_update
AFTER UPDATE ON secondary_sales
FOR EACH ROW
EXECUTE FUNCTION sync_secondary_sales_update();

CREATE TRIGGER trg_sync_secondary_sales_delete
AFTER DELETE ON secondary_sales
FOR EACH ROW
EXECUTE FUNCTION sync_secondary_sales_delete();

-- 9. 验证触发器创建成功
SELECT 
    '==================== 触发器创建结果 ====================' as message;

SELECT 
    trigger_name as "触发器名称",
    event_manipulation as "触发事件",
    event_object_table as "监控表",
    action_statement as "执行函数"
FROM information_schema.triggers
WHERE trigger_name LIKE 'trg_sync_%sales_%'
ORDER BY event_object_table, event_manipulation;

-- 10. 说明
SELECT 
    '==================== 使用说明 ====================' as message,
    '1. 新增销售会自动同步到 sales_optimized 表' as note1,
    '2. 更新销售信息会自动同步' as note2,
    '3. 删除销售会软删除（status = inactive）' as note3,
    '4. 佣金率会自动转换为小数格式' as note4,
    '5. 团队人数会自动更新' as note5;