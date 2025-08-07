-- Step 3: 创建一级销售统计视图
CREATE OR REPLACE VIEW primary_sales_stats AS
SELECT 
    ps.id,
    ps.wechat_name,
    ps.sales_code,
    ps.commission_rate,
    ps.payment_account,
    ps.payment_method,
    ps.secondary_registration_code,
    -- 总计数据（只统计确认的订单）
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
GROUP BY ps.id, ps.wechat_name, ps.sales_code, ps.commission_rate,
         ps.payment_account, ps.payment_method, ps.secondary_registration_code;

-- 授权
GRANT SELECT ON primary_sales_stats TO anon;

-- 验证视图
SELECT * FROM primary_sales_stats LIMIT 5;

