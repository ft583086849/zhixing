-- ✅ Step 4: 验证数据正确性
-- 确保视图按需求文档正确过滤了数据

-- 1. 验证确认订单视图
SELECT 
    '确认订单视图' as check_name,
    COUNT(*) as confirmed_orders_count,
    SUM(amount) as confirmed_total_amount
FROM confirmed_orders;

-- 2. 对比原始订单表
SELECT 
    '原始订单对比' as check_name,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE config_confirmed = true) as should_be_confirmed,
    COUNT(*) FILTER (WHERE config_confirmed = false OR config_confirmed IS NULL) as unconfirmed_orders
FROM orders;

-- 3. 验证 Zhixing 的数据（二级销售）
SELECT 
    'Zhixing统计' as check_name,
    wechat_name,
    total_orders as 总订单数,
    total_amount as 总订单金额,
    total_commission as 累计佣金,
    month_orders as 本月订单数,
    month_amount as 本月订单金额,
    month_commission as 本月佣金,
    commission_rate as 当前佣金率
FROM secondary_sales_stats 
WHERE wechat_name = 'Zhixing';

-- 4. 验证一级销售统计（示例）
SELECT 
    '一级销售统计' as check_name,
    wechat_name,
    total_orders,
    total_amount,
    total_commission,
    secondary_sales_count as 二级销售数量
FROM primary_sales_stats
WHERE total_orders > 0
LIMIT 3;

-- 5. 验证数据一致性
-- 确认订单视图的总数应该等于统计视图的订单总和
WITH stats_total AS (
    SELECT 
        SUM(total_orders) as stats_orders,
        SUM(total_amount) as stats_amount
    FROM (
        SELECT total_orders, total_amount FROM primary_sales_stats
        UNION ALL
        SELECT total_orders, total_amount FROM secondary_sales_stats
    ) combined
),
confirmed_total AS (
    SELECT 
        COUNT(DISTINCT id) as confirmed_orders,
        SUM(amount) as confirmed_amount
    FROM confirmed_orders
)
SELECT 
    '数据一致性检查' as check_name,
    ct.confirmed_orders as 确认订单总数,
    ct.confirmed_amount as 确认订单总金额,
    st.stats_orders as 统计视图订单总数,
    st.stats_amount as 统计视图金额总数,
    CASE 
        WHEN ABS(ct.confirmed_amount - st.stats_amount) < 1 THEN '✅ 数据一致'
        ELSE '❌ 数据不一致，请检查'
    END as 验证结果
FROM confirmed_total ct, stats_total st;
