-- ========================================
-- 销售数据迁移脚本 V2
-- 从 primary_sales 和 secondary_sales 迁移到 sales_optimized
-- 保留原始佣金率值，不做修改
-- ========================================

-- 1. 首先检查 sales_optimized 表是否已创建
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

-- 4. 迁移 primary_sales 数据（一级销售）
INSERT INTO sales_optimized (
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
    
    -- 原表映射
    original_table,
    original_id
)
SELECT 
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
    id as original_id
FROM primary_sales;

-- 5. 迁移 secondary_sales 数据（二级销售和独立销售）
INSERT INTO sales_optimized (
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
    s.sales_code,
    s.wechat_name,
    s.name,
    
    -- 根据是否有上级判断类型
    CASE 
        WHEN s.primary_sales_id IS NULL THEN 'independent'  -- 独立销售
        ELSE 'secondary'  -- 有上级的二级销售
    END as sales_type,
    2 as sales_level,  -- 二级/独立都是level 2
    
    -- 关系链
    s.primary_sales_id as parent_sales_id,
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
    s.id as original_id
FROM secondary_sales s
LEFT JOIN primary_sales p ON s.primary_sales_id = p.id;

-- 6. 更新 sales_optimized 表的 ID 为 UUID（如果原表ID是整数）
UPDATE sales_optimized 
SET id = gen_random_uuid()
WHERE id IS NULL;

-- 7. 初始化统计数据（从orders_optimized表计算）
-- 7.1 更新一级销售的直销统计
WITH primary_stats AS (
    SELECT 
        ps.sales_code,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.amount), 0) as total_amount,
        COALESCE(SUM(o.amount * ps.commission_rate), 0) as commission_amount  -- 使用实际佣金率
    FROM sales_optimized ps
    LEFT JOIN orders_optimized o ON o.primary_sales_id = ps.original_id
    WHERE ps.sales_type = 'primary'
      AND ps.original_table = 'primary_sales'
      AND o.secondary_sales_id IS NULL  -- 只统计直销订单
    GROUP BY ps.sales_code, ps.commission_rate
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
WHERE so.sales_code = ps.sales_code;

-- 7.2 更新一级销售的团队统计（分销收益）
WITH team_stats AS (
    SELECT 
        ps.sales_code,
        ps.commission_rate as primary_rate,
        COUNT(DISTINCT o.id) as team_orders,
        COALESCE(SUM(o.amount), 0) as team_amount,
        -- 分销收益 = 订单金额 * (一级佣金率 - 二级佣金率)
        COALESCE(SUM(
            CASE 
                WHEN ss.commission_rate > 1 THEN o.amount * (ps.commission_rate - ss.commission_rate/100)
                ELSE o.amount * (ps.commission_rate - ss.commission_rate)
            END
        ), 0) as share_commission
    FROM sales_optimized ps
    INNER JOIN secondary_sales ss ON ss.primary_sales_id = ps.original_id
    LEFT JOIN orders_optimized o ON o.secondary_sales_id = ss.id
    WHERE ps.sales_type = 'primary'
      AND ps.original_table = 'primary_sales'
    GROUP BY ps.sales_code, ps.commission_rate
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
WHERE so.sales_code = ts.sales_code;

-- 7.3 更新二级销售的统计
WITH secondary_stats AS (
    SELECT 
        ss.sales_code,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.amount), 0) as total_amount,
        COALESCE(SUM(o.amount * ss.commission_rate), 0) as commission_amount
    FROM sales_optimized ss
    LEFT JOIN orders_optimized o ON o.secondary_sales_id = ss.original_id
    WHERE ss.sales_type IN ('secondary', 'independent')
      AND ss.original_table = 'secondary_sales'
    GROUP BY ss.sales_code, ss.commission_rate
)
UPDATE sales_optimized so
SET 
    total_orders = ss.order_count,
    total_amount = ss.total_amount,
    total_commission = ss.commission_amount,
    primary_commission_amount = ss.commission_amount  -- 二级销售的佣金都记录在这里
FROM secondary_stats ss
WHERE so.sales_code = ss.sales_code;

-- 7.4 更新团队人数（仅一级销售）
UPDATE sales_optimized ps
SET team_size = (
    SELECT COUNT(*)
    FROM sales_optimized ss
    WHERE ss.parent_sales_code = ps.sales_code
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
    AVG(commission_rate) as "平均佣金率",
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
ORDER BY sales_type, created_at DESC;