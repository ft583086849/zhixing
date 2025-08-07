-- ✅ Step 3: 创建一级销售统计视图
-- 根据需求文档5.1.2节：所有统计仅计入配置确认的订单
CREATE OR REPLACE VIEW primary_sales_stats AS
SELECT 
    ps.id,
    ps.wechat_name,
    ps.sales_code,
    ps.commission_rate,
    ps.payment_account,
    ps.payment_method,
    ps.secondary_registration_code,
    ps.created_at,
    ps.updated_at,
    
    -- 总计数据（只统计 config_confirmed = true 的订单）
    COUNT(DISTINCT co.id) as total_orders,  -- 总订单数
    COALESCE(SUM(co.amount), 0) as total_amount,  -- 总订单金额
    COALESCE(SUM(co.commission_amount), 0) as total_commission,  -- 累计佣金
    
    -- 本月数据
    COUNT(DISTINCT CASE 
        WHEN DATE_TRUNC('month', co.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co.id 
    END) as month_orders,  -- 本月订单数
    
    COALESCE(SUM(CASE 
        WHEN DATE_TRUNC('month', co.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co.amount 
    END), 0) as month_amount,  -- 本月订单金额
    
    COALESCE(SUM(CASE 
        WHEN DATE_TRUNC('month', co.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co.commission_amount 
    END), 0) as month_commission,  -- 本月佣金
    
    -- 二级销售统计（需求文档5.1.1：二级销售总数量不受配置确认影响）
    (SELECT COUNT(*) FROM secondary_sales WHERE primary_sales_id = ps.id) as secondary_sales_count
    
FROM primary_sales ps
LEFT JOIN confirmed_orders co ON co.sales_code = ps.sales_code
GROUP BY ps.id, ps.wechat_name, ps.sales_code, ps.commission_rate,
         ps.payment_account, ps.payment_method, ps.secondary_registration_code,
         ps.created_at, ps.updated_at;

-- 授权访问
GRANT SELECT ON primary_sales_stats TO anon;
GRANT SELECT ON primary_sales_stats TO authenticated;

-- 验证视图
SELECT 
    wechat_name,
    sales_code,
    total_orders,
    total_amount,
    total_commission,
    month_orders,
    month_amount,
    month_commission,
    secondary_sales_count
FROM primary_sales_stats 
LIMIT 5;
