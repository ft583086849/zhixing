-- ========================================
-- 销售数据迁移脚本 V4
-- 不修改表结构，使用字符串存储原表ID
-- ========================================

-- 1. 检查 sales_optimized 表是否已创建
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_optimized') THEN
        RAISE EXCEPTION 'sales_optimized 表不存在，请先执行 create-sales-optimized-table-v2.sql';
    END IF;
END $$;

-- 2. 检查并报告异常的佣金率数据
SELECT 
    '==================== 佣金率异常值检查 ====================' as message;

-- 检查一级销售的异常佣金率
SELECT 
    'primary_sales' as "表名",
    sales_code as "销售编号",
    wechat_name as "微信名",
    commission_rate as "当前佣金率",
    CASE 
        WHEN commission_rate = 0 THEN '⚠️ 佣金率为0，请确认是否正确'
        WHEN commission_rate = 0.15 THEN '⚠️ 佣金率15%，低于标准40%'
        WHEN commission_rate != 0.4 THEN '⚠️ 非标准佣金率'
        ELSE '✅ 标准佣金率'
    END as "说明"
FROM primary_sales
WHERE commission_rate != 0.4;

-- 检查二级销售的异常佣金率
SELECT 
    'secondary_sales' as "表名",
    sales_code as "销售编号",
    wechat_name as "微信名",
    commission_rate as "当前佣金率",
    CASE 
        WHEN commission_rate > 1 THEN '❌ 错误格式：使用了百分比而非小数'
        WHEN commission_rate = 0 THEN '⚠️ 佣金率为0'
        WHEN commission_rate > 0.4 THEN '⚠️ 佣金率超过40%'
        ELSE '✅ 正常'
    END as "说明"
FROM secondary_sales
WHERE commission_rate > 1 OR commission_rate = 0 OR commission_rate > 0.4;

-- 3. 清空目标表（如果有数据）
TRUNCATE TABLE sales_optimized;

-- 4. 创建临时映射表（用于存储原表ID到新UUID的映射）
CREATE TEMP TABLE sales_id_mapping (
    old_id INTEGER,
    old_table VARCHAR(20),
    new_uuid UUID,
    sales_code VARCHAR(50)
);

-- 5. 迁移 primary_sales 数据（一级销售）
WITH inserted_primary AS (
    INSERT INTO sales_optimized (
        -- 主键使用UUID
        id,
        
        -- 基础信息
        sales_code,
        wechat_name,
        name,
        
        -- 销售类型
        sales_type,
        sales_level,
        
        -- 关系链（一级销售无上级）
        parent_sales_id,
        parent_sales_code,
        parent_sales_name,
        
        -- 佣金配置（保留原值，仅处理格式问题）
        commission_rate,
        
        -- 支付信息
        payment_method,
        payment_info,
        
        -- 扩展字段
        referral_code,
        
        -- 状态
        status,
        is_active,
        
        -- 联系方式
        phone,
        email,
        
        -- 时间戳
        created_at,
        updated_at,
        
        -- 原表映射（暂时留空，后面更新）
        original_table,
        original_id
    )
    SELECT 
        gen_random_uuid() as id,  -- 生成新的UUID作为主键
        
        sales_code,
        wechat_name,
        name,
        
        'primary' as sales_type,
        1 as sales_level,
        
        NULL as parent_sales_id,
        NULL as parent_sales_code,
        NULL as parent_sales_name,
        
        -- 保留原始佣金率，仅转换格式
        CASE 
            WHEN commission_rate > 1 THEN commission_rate / 100  -- 如果是百分比格式，转换为小数
            ELSE commission_rate  -- 保持原值
        END as commission_rate,
        
        payment_method,
        payment_address as payment_info,
        
        secondary_registration_code as referral_code,
        
        'active' as status,
        true as is_active,
        
        phone,
        email,
        
        created_at,
        updated_at,
        
        'primary_sales' as original_table,
        NULL as original_id  -- 暂时留空
    FROM primary_sales
    RETURNING id, sales_code
)
-- 保存映射关系
INSERT INTO sales_id_mapping (old_id, old_table, new_uuid, sales_code)
SELECT 
    p.id as old_id,
    'primary_sales' as old_table,
    i.id as new_uuid,
    i.sales_code
FROM primary_sales p
JOIN inserted_primary i ON p.sales_code = i.sales_code;

-- 6. 迁移 secondary_sales 数据（二级销售和独立销售）
WITH inserted_secondary AS (
    INSERT INTO sales_optimized (
        -- 主键使用UUID
        id,
        
        -- 基础信息
        sales_code,
        wechat_name,
        name,
        
        -- 销售类型
        sales_type,
        sales_level,
        
        -- 关系链
        parent_sales_id,
        parent_sales_code,
        parent_sales_name,
        
        -- 佣金配置
        commission_rate,
        
        -- 支付信息
        payment_method,
        payment_info,
        
        -- 扩展字段
        referral_code,
        
        -- 状态
        status,
        is_active,
        
        -- 联系方式
        phone,
        email,
        
        -- 时间戳
        created_at,
        updated_at,
        
        -- 原表映射
        original_table,
        original_id
    )
    SELECT 
        gen_random_uuid() as id,  -- 生成新的UUID作为主键
        
        s.sales_code,
        s.wechat_name,
        s.name,
        
        -- 根据是否有上级判断类型
        CASE 
            WHEN s.primary_sales_id IS NULL THEN 'independent'  -- 独立销售
            ELSE 'secondary'  -- 有上级的二级销售
        END as sales_type,
        2 as sales_level,  -- 二级/独立都是level 2
        
        -- 关系链（使用映射表获取新UUID）
        m.new_uuid as parent_sales_id,
        p.sales_code as parent_sales_code,
        p.wechat_name as parent_sales_name,
        
        -- 修正佣金率格式（仅处理明显的格式错误）
        CASE 
            WHEN s.commission_rate = 25.00 THEN 0.25  -- 明确的格式错误：25.00应该是0.25
            WHEN s.commission_rate > 1 THEN s.commission_rate / 100  -- 其他百分比格式转小数
            ELSE s.commission_rate  -- 保持原值
        END as commission_rate,
        
        -- 支付信息
        NULL as payment_method,
        s.payment_address as payment_info,
        
        s.primary_registration_code as referral_code,
        
        COALESCE(s.status, 'active') as status,
        true as is_active,
        
        s.phone,
        s.email,
        
        s.created_at,
        s.updated_at,
        
        'secondary_sales' as original_table,
        NULL as original_id  -- 暂时留空
    FROM secondary_sales s
    LEFT JOIN primary_sales p ON s.primary_sales_id = p.id
    LEFT JOIN sales_id_mapping m ON s.primary_sales_id = m.old_id AND m.old_table = 'primary_sales'
    RETURNING id, sales_code
)
-- 保存映射关系
INSERT INTO sales_id_mapping (old_id, old_table, new_uuid, sales_code)
SELECT 
    s.id as old_id,
    'secondary_sales' as old_table,
    i.id as new_uuid,
    i.sales_code
FROM secondary_sales s
JOIN inserted_secondary i ON s.sales_code = i.sales_code;

-- 7. 初始化统计数据（从orders_optimized表计算）
-- 7.1 更新一级销售的直销统计
WITH primary_stats AS (
    SELECT 
        m.new_uuid,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.amount), 0) as total_amount,
        COALESCE(SUM(o.amount * so.commission_rate), 0) as commission_amount
    FROM sales_id_mapping m
    JOIN sales_optimized so ON so.id = m.new_uuid
    LEFT JOIN orders_optimized o ON o.primary_sales_id = m.old_id
    WHERE m.old_table = 'primary_sales'
      AND so.sales_type = 'primary'
      AND o.secondary_sales_id IS NULL  -- 只统计直销订单
    GROUP BY m.new_uuid
)
UPDATE sales_optimized so
SET 
    total_direct_orders = ps.order_count,
    total_direct_amount = ps.total_amount,
    primary_commission_amount = ps.commission_amount,
    total_orders = ps.order_count,
    total_amount = ps.total_amount,
    total_commission = ps.commission_amount
FROM primary_stats ps
WHERE so.id = ps.new_uuid;

-- 7.2 更新一级销售的团队统计（分销收益）
WITH team_stats AS (
    SELECT 
        pm.new_uuid,
        COUNT(DISTINCT o.id) as team_orders,
        COALESCE(SUM(o.amount), 0) as team_amount,
        -- 分销收益 = 订单金额 * (一级佣金率 - 二级佣金率)
        COALESCE(SUM(
            CASE 
                WHEN ss.commission_rate > 1 THEN o.amount * (ps.commission_rate - ss.commission_rate/100)
                ELSE o.amount * (ps.commission_rate - ss.commission_rate)
            END
        ), 0) as share_commission
    FROM sales_id_mapping pm
    JOIN sales_optimized ps ON ps.id = pm.new_uuid
    INNER JOIN secondary_sales ss ON ss.primary_sales_id = pm.old_id
    LEFT JOIN orders_optimized o ON o.secondary_sales_id = ss.id
    WHERE pm.old_table = 'primary_sales'
      AND ps.sales_type = 'primary'
    GROUP BY pm.new_uuid
)
UPDATE sales_optimized so
SET 
    total_team_orders = ts.team_orders,
    total_team_amount = ts.team_amount,
    secondary_commission_amount = ts.share_commission,
    total_orders = COALESCE(so.total_orders, 0) + ts.team_orders,
    total_amount = COALESCE(so.total_amount, 0) + ts.team_amount,
    total_commission = COALESCE(so.total_commission, 0) + ts.share_commission
FROM team_stats ts
WHERE so.id = ts.new_uuid;

-- 7.3 更新二级销售的统计
WITH secondary_stats AS (
    SELECT 
        m.new_uuid,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.amount), 0) as total_amount,
        COALESCE(SUM(o.amount * so.commission_rate), 0) as commission_amount
    FROM sales_id_mapping m
    JOIN sales_optimized so ON so.id = m.new_uuid
    LEFT JOIN orders_optimized o ON o.secondary_sales_id = m.old_id
    WHERE m.old_table = 'secondary_sales'
      AND so.sales_type IN ('secondary', 'independent')
    GROUP BY m.new_uuid
)
UPDATE sales_optimized so
SET 
    total_orders = ss.order_count,
    total_amount = ss.total_amount,
    total_commission = ss.commission_amount,
    primary_commission_amount = ss.commission_amount  -- 二级销售的佣金都记录在这里
FROM secondary_stats ss
WHERE so.id = ss.new_uuid;

-- 7.4 更新团队人数（仅一级销售）
UPDATE sales_optimized ps
SET team_size = (
    SELECT COUNT(*)
    FROM sales_optimized ss
    WHERE ss.parent_sales_id = ps.id
)
WHERE ps.sales_type = 'primary';

-- 8. 验证迁移结果
SELECT 
    '==================== 迁移结果统计 ====================' as message;

SELECT 
    sales_type as "销售类型",
    COUNT(*) as "数量",
    MIN(commission_rate) as "最小佣金率",
    MAX(commission_rate) as "最大佣金率",
    AVG(commission_rate)::numeric(10,4) as "平均佣金率",
    SUM(total_orders) as "总订单数",
    SUM(total_amount) as "总销售额"
FROM sales_optimized
GROUP BY sales_type
ORDER BY sales_type;

-- 9. 列出需要人工确认的特殊佣金率
SELECT 
    '==================== 需要确认的特殊佣金率 ====================' as message;

SELECT 
    sales_code as "销售编号",
    wechat_name as "微信名",
    sales_type as "销售类型",
    commission_rate as "当前佣金率",
    CASE 
        WHEN sales_type = 'primary' AND commission_rate != 0.4 THEN 
            '⚠️ 一级销售非标准佣金率（标准为40%）'
        WHEN sales_type = 'secondary' AND commission_rate = 0 THEN 
            '⚠️ 二级销售佣金率为0'
        WHEN sales_type = 'independent' AND commission_rate = 0 THEN 
            '⚠️ 独立销售佣金率为0'
        WHEN commission_rate > 0.4 THEN 
            '⚠️ 佣金率超过40%'
        ELSE '正常'
    END as "说明"
FROM sales_optimized
WHERE 
    (sales_type = 'primary' AND commission_rate != 0.4)
    OR commission_rate = 0
    OR commission_rate > 0.4
ORDER BY sales_type, commission_rate;

-- 10. 显示迁移后的完整数据
SELECT 
    '==================== 迁移后数据一览 ====================' as message;

SELECT 
    sales_code as "销售编号",
    wechat_name as "微信名",
    sales_type as "类型",
    commission_rate as "佣金率",
    parent_sales_code as "上级编号",
    total_orders as "订单数",
    total_amount as "销售额",
    total_commission as "总佣金"
FROM sales_optimized
ORDER BY sales_type, sales_code
LIMIT 30;