-- ✅ Step 1: 创建确认订单视图
-- 根据需求文档：只包含配置确认的订单
CREATE OR REPLACE VIEW confirmed_orders AS
SELECT * FROM orders 
WHERE config_confirmed = true;

-- 授权访问
GRANT SELECT ON confirmed_orders TO anon;
GRANT SELECT ON confirmed_orders TO authenticated;

-- 验证创建成功
SELECT 
    COUNT(*) as confirmed_count,
    SUM(amount) as total_confirmed_amount
FROM confirmed_orders;

-- 对比总订单数
SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE config_confirmed = true) as confirmed_count,
    COUNT(*) FILTER (WHERE config_confirmed = false OR config_confirmed IS NULL) as unconfirmed_count
FROM orders;
