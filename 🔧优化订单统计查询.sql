-- 🔧 优化订单统计查询 - 在数据库层面处理配置确认的订单
-- 在 Supabase SQL Editor 中执行

-- ========================================
-- 方案1：创建视图（推荐）
-- ========================================

-- 1. 创建确认订单视图
CREATE OR REPLACE VIEW confirmed_orders AS
SELECT * FROM orders 
WHERE config_confirmed = true;

-- 2. 创建一级销售统计视图
CREATE OR REPLACE VIEW primary_sales_stats AS
SELECT 
    ps.id,
    ps.wechat_name,
    ps.sales_code,
    ps.commission_rate,
    COUNT(DISTINCT co.id) as total_orders,
    COALESCE(SUM(co.amount), 0) as total_amount,
    COALESCE(SUM(co.commission_amount), 0) as total_commission,
    -- 本月数据
    COUNT(DISTINCT CASE 
        WHEN DATE_TRUNC('month', co.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co.id 
    END) as month_orders,
    COALESCE(SUM(CASE 
        WHEN DATE_TRUNC('month', co.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co.amount 
    END), 0) as month_amount,
    COALESCE(SUM(CASE 
        WHEN DATE_TRUNC('month', co.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co.commission_amount 
    END), 0) as month_commission
FROM primary_sales ps
LEFT JOIN confirmed_orders co ON co.sales_code = ps.sales_code
GROUP BY ps.id, ps.wechat_name, ps.sales_code, ps.commission_rate;

-- 3. 创建二级销售统计视图
CREATE OR REPLACE VIEW secondary_sales_stats AS
SELECT 
    ss.id,
    ss.wechat_name,
    ss.sales_code,
    ss.commission_rate,
    ss.primary_sales_id,
    COUNT(DISTINCT co.id) as total_orders,
    COALESCE(SUM(co.amount), 0) as total_amount,
    -- 二级销售的佣金计算：订单金额 × 佣金率
    COALESCE(SUM(co.amount * ss.commission_rate), 0) as total_commission,
    -- 本月数据
    COUNT(DISTINCT CASE 
        WHEN DATE_TRUNC('month', co.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co.id 
    END) as month_orders,
    COALESCE(SUM(CASE 
        WHEN DATE_TRUNC('month', co.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co.amount 
    END), 0) as month_amount,
    COALESCE(SUM(CASE 
        WHEN DATE_TRUNC('month', co.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co.amount * ss.commission_rate 
    END), 0) as month_commission
FROM secondary_sales ss
LEFT JOIN confirmed_orders co ON co.sales_code = ss.sales_code
GROUP BY ss.id, ss.wechat_name, ss.sales_code, ss.commission_rate, ss.primary_sales_id;

-- 4. 创建综合销售统计视图（一级+二级合并）
CREATE OR REPLACE VIEW sales_comprehensive_stats AS
SELECT 
    'primary' as sales_type,
    id,
    wechat_name,
    sales_code,
    commission_rate,
    NULL::integer as primary_sales_id,
    total_orders,
    total_amount,
    total_commission,
    month_orders,
    month_amount,
    month_commission
FROM primary_sales_stats
UNION ALL
SELECT 
    'secondary' as sales_type,
    id,
    wechat_name,
    sales_code,
    commission_rate,
    primary_sales_id,
    total_orders,
    total_amount,
    total_commission,
    month_orders,
    month_amount,
    month_commission
FROM secondary_sales_stats;

-- ========================================
-- 方案2：存储函数（更灵活）
-- ========================================

-- 创建函数：获取销售统计数据
CREATE OR REPLACE FUNCTION get_sales_settlement(
    p_wechat_name TEXT DEFAULT NULL,
    p_sales_code TEXT DEFAULT NULL,
    p_date_start DATE DEFAULT NULL,
    p_date_end DATE DEFAULT NULL
)
RETURNS TABLE (
    sales_type TEXT,
    wechat_name TEXT,
    sales_code TEXT,
    commission_rate NUMERIC,
    total_orders BIGINT,
    total_amount NUMERIC,
    total_commission NUMERIC,
    month_orders BIGINT,
    month_amount NUMERIC,
    month_commission NUMERIC,
    pending_orders BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_orders AS (
        SELECT * FROM orders
        WHERE config_confirmed = true
        AND (p_date_start IS NULL OR payment_date >= p_date_start)
        AND (p_date_end IS NULL OR payment_date <= p_date_end)
    )
    SELECT 
        CASE 
            WHEN ps.id IS NOT NULL THEN 'primary'
            WHEN ss.id IS NOT NULL THEN 'secondary'
        END as sales_type,
        COALESCE(ps.wechat_name, ss.wechat_name) as wechat_name,
        COALESCE(ps.sales_code, ss.sales_code) as sales_code,
        COALESCE(ps.commission_rate, ss.commission_rate) as commission_rate,
        COUNT(DISTINCT fo.id) as total_orders,
        COALESCE(SUM(fo.amount), 0) as total_amount,
        CASE 
            WHEN ps.id IS NOT NULL THEN COALESCE(SUM(fo.commission_amount), 0)
            WHEN ss.id IS NOT NULL THEN COALESCE(SUM(fo.amount * ss.commission_rate), 0)
        END as total_commission,
        COUNT(DISTINCT CASE 
            WHEN DATE_TRUNC('month', fo.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
            THEN fo.id 
        END) as month_orders,
        COALESCE(SUM(CASE 
            WHEN DATE_TRUNC('month', fo.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
            THEN fo.amount 
        END), 0) as month_amount,
        CASE 
            WHEN ps.id IS NOT NULL THEN 
                COALESCE(SUM(CASE 
                    WHEN DATE_TRUNC('month', fo.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
                    THEN fo.commission_amount 
                END), 0)
            WHEN ss.id IS NOT NULL THEN 
                COALESCE(SUM(CASE 
                    WHEN DATE_TRUNC('month', fo.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
                    THEN fo.amount * ss.commission_rate 
                END), 0)
        END as month_commission,
        (SELECT COUNT(*) FROM orders o 
         WHERE o.sales_code = COALESCE(ps.sales_code, ss.sales_code)
         AND o.status IN ('pending_payment', 'pending_config')) as pending_orders
    FROM filtered_orders fo
    LEFT JOIN primary_sales ps ON ps.sales_code = fo.sales_code
        AND (p_wechat_name IS NULL OR ps.wechat_name = p_wechat_name)
        AND (p_sales_code IS NULL OR ps.sales_code = p_sales_code)
    LEFT JOIN secondary_sales ss ON ss.sales_code = fo.sales_code
        AND (p_wechat_name IS NULL OR ss.wechat_name = p_wechat_name)
        AND (p_sales_code IS NULL OR ss.sales_code = p_sales_code)
    WHERE ps.id IS NOT NULL OR ss.id IS NOT NULL
    GROUP BY ps.id, ps.wechat_name, ps.sales_code, ps.commission_rate,
             ss.id, ss.wechat_name, ss.sales_code, ss.commission_rate;
END;
$$;

-- ========================================
-- 测试查询
-- ========================================

-- 测试1：查询 Zhixing 的统计数据（使用视图）
SELECT * FROM secondary_sales_stats 
WHERE wechat_name = 'Zhixing';

-- 测试2：查询 Zhixing 的统计数据（使用函数）
SELECT * FROM get_sales_settlement('Zhixing');

-- 测试3：查询所有销售的综合统计
SELECT * FROM sales_comprehensive_stats 
ORDER BY sales_type, total_commission DESC;

-- ========================================
-- 权限设置
-- ========================================

-- 为视图设置权限（允许 anon 角色访问）
GRANT SELECT ON confirmed_orders TO anon;
GRANT SELECT ON primary_sales_stats TO anon;
GRANT SELECT ON secondary_sales_stats TO anon;
GRANT SELECT ON sales_comprehensive_stats TO anon;

-- 为函数设置权限
GRANT EXECUTE ON FUNCTION get_sales_settlement TO anon;

