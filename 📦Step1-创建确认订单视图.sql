-- Step 1: 创建确认订单视图
-- 这个视图只包含配置确认的订单
CREATE OR REPLACE VIEW confirmed_orders AS
SELECT * FROM orders 
WHERE config_confirmed = true;

-- 授权
GRANT SELECT ON confirmed_orders TO anon;

-- 验证视图
SELECT COUNT(*) as confirmed_count FROM confirmed_orders;
SELECT COUNT(*) as total_count FROM orders;

