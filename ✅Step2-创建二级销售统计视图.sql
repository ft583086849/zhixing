-- ✅ Step 2: 创建二级销售统计视图
-- 根据需求文档5.1和5.2节：所有统计仅计入配置确认的订单
CREATE OR REPLACE VIEW secondary_sales_stats AS
SELECT 
    ss.id,
    ss.wechat_name,
    ss.sales_code,
    ss.commission_rate,
    ss.primary_sales_id,
    ss.payment_account,
    ss.payment_method,
    ss.created_at,
    ss.updated_at,
    
    -- 总计数据（只统计 config_confirmed = true 的订单）
    COUNT(DISTINCT co.id) as total_orders,  -- 总订单数
    COALESCE(SUM(co.amount), 0) as total_amount,  -- 总订单金额
    COALESCE(SUM(co.amount * ss.commission_rate), 0) as total_commission,  -- 累计佣金
    
    -- 本月数据（需求文档要求的本月统计）
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
        THEN co.amount * ss.commission_rate 
    END), 0) as month_commission  -- 本月佣金
    
FROM secondary_sales ss
LEFT JOIN confirmed_orders co ON co.sales_code = ss.sales_code
GROUP BY ss.id, ss.wechat_name, ss.sales_code, ss.commission_rate, 
         ss.primary_sales_id, ss.payment_account, ss.payment_method,
         ss.created_at, ss.updated_at;

-- 授权访问
GRANT SELECT ON secondary_sales_stats TO anon;
GRANT SELECT ON secondary_sales_stats TO authenticated;

-- 验证：查看 Zhixing 的统计数据
SELECT 
    wechat_name,
    sales_code,
    commission_rate,
    total_orders,
    total_amount,
    total_commission,
    month_orders,
    month_amount,
    month_commission
FROM secondary_sales_stats 
WHERE wechat_name = 'Zhixing';
