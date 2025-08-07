-- 🔧 修复管理员仪表板数据概览无数据问题
-- 创建缺失的数据库视图
-- 
-- 使用方法：
-- 1. 登录 Supabase Dashboard: https://app.supabase.com
-- 2. 选择项目 itvmeamoqthfqtkpubdv
-- 3. 进入 SQL Editor
-- 4. 粘贴并执行此SQL脚本

-- =====================================
-- Step 1: 确认 confirmed_orders 视图存在
-- =====================================
-- 如果视图已存在，这个会被跳过
CREATE OR REPLACE VIEW confirmed_orders AS
SELECT * FROM orders 
WHERE config_confirmed = true;

-- 授权访问
GRANT SELECT ON confirmed_orders TO anon;
GRANT SELECT ON confirmed_orders TO authenticated;

-- =====================================
-- Step 2: 创建二级销售统计视图
-- =====================================
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

-- =====================================  
-- Step 3: 创建一级销售统计视图
-- =====================================
CREATE OR REPLACE VIEW primary_sales_stats AS
SELECT 
    ps.id,
    ps.name,
    ps.sales_code,
    ps.phone,
    ps.wechat,
    ps.remark,
    ps.payment_account,
    ps.payment_method,
    ps.created_at,
    ps.updated_at,
    
    -- 直接用户订单统计（一级销售直接产生的订单）
    COUNT(DISTINCT co_direct.id) as direct_orders,  -- 直接订单数
    COALESCE(SUM(co_direct.amount), 0) as direct_amount,  -- 直接订单金额
    
    -- 二级销售统计（通过二级销售产生的订单）
    COUNT(DISTINCT ss.id) as secondary_sales_count,  -- 下属二级销售数量
    COUNT(DISTINCT co_secondary.id) as secondary_orders,  -- 二级销售订单数
    COALESCE(SUM(co_secondary.amount), 0) as secondary_amount,  -- 二级销售订单金额
    
    -- 总计
    COUNT(DISTINCT co_direct.id) + COUNT(DISTINCT co_secondary.id) as total_orders,  -- 总订单数
    COALESCE(SUM(co_direct.amount), 0) + COALESCE(SUM(co_secondary.amount), 0) as total_amount,  -- 总订单金额
    
    -- 佣金计算（基于新的佣金逻辑）
    COALESCE(SUM(co_direct.amount * 0.4), 0) as direct_commission,  -- 直接订单佣金（40%）
    COALESCE(SUM(co_secondary.amount * ss.commission_rate), 0) as secondary_total_commission,  -- 二级销售总佣金
    
    -- 本月数据
    COUNT(DISTINCT CASE 
        WHEN DATE_TRUNC('month', co_direct.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co_direct.id 
    END) + COUNT(DISTINCT CASE 
        WHEN DATE_TRUNC('month', co_secondary.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co_secondary.id 
    END) as month_orders,  -- 本月总订单数
    
    COALESCE(SUM(CASE 
        WHEN DATE_TRUNC('month', co_direct.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co_direct.amount 
    END), 0) + COALESCE(SUM(CASE 
        WHEN DATE_TRUNC('month', co_secondary.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN co_secondary.amount 
    END), 0) as month_amount  -- 本月总订单金额
    
FROM primary_sales ps
LEFT JOIN confirmed_orders co_direct ON co_direct.sales_code = ps.sales_code
LEFT JOIN secondary_sales ss ON ss.primary_sales_id = ps.id
LEFT JOIN confirmed_orders co_secondary ON co_secondary.sales_code = ss.sales_code
GROUP BY ps.id, ps.name, ps.sales_code, ps.phone, ps.wechat, ps.remark,
         ps.payment_account, ps.payment_method, ps.created_at, ps.updated_at;

-- 授权访问
GRANT SELECT ON primary_sales_stats TO anon;
GRANT SELECT ON primary_sales_stats TO authenticated;

-- =====================================
-- 验证视图创建成功
-- =====================================
SELECT 'confirmed_orders' as view_name, COUNT(*) as row_count FROM confirmed_orders
UNION ALL
SELECT 'secondary_sales_stats', COUNT(*) FROM secondary_sales_stats
UNION ALL
SELECT 'primary_sales_stats', COUNT(*) FROM primary_sales_stats;

-- 显示成功消息
SELECT '✅ 视图创建成功！管理员仪表板数据概览应该可以正常显示了。' as message;
