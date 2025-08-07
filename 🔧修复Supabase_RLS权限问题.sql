-- ================================================
-- 修复Supabase RLS权限问题
-- 请在Supabase控制台的SQL编辑器中执行
-- ================================================

-- 1. 临时禁用RLS（仅用于测试）
-- ⚠️ 警告：这会让所有人都能访问数据，仅用于开发测试
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE primary_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- 2. 或者创建允许匿名读取的RLS策略（推荐）
-- 如果要使用RLS，请注释掉上面的DISABLE命令，使用下面的策略

-- 启用RLS
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE primary_sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE secondary_sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 创建允许所有人读取的策略
-- CREATE POLICY "允许匿名读取orders" ON orders FOR SELECT USING (true);
-- CREATE POLICY "允许匿名读取primary_sales" ON primary_sales FOR SELECT USING (true);
-- CREATE POLICY "允许匿名读取secondary_sales" ON secondary_sales FOR SELECT USING (true);
-- CREATE POLICY "允许匿名读取admins" ON admins FOR SELECT USING (true);

-- 3. 验证数据是否存在
SELECT 'orders表' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'primary_sales表', COUNT(*) FROM primary_sales
UNION ALL
SELECT 'secondary_sales表', COUNT(*) FROM secondary_sales
UNION ALL
SELECT 'admins表', COUNT(*) FROM admins;

-- 4. 如果orders表没有数据，插入测试数据
-- INSERT INTO orders (
--   order_number, 
--   customer_name, 
--   customer_wechat,
--   tradingview_username,
--   amount, 
--   status, 
--   sales_code,
--   created_at
-- ) VALUES 
-- ('TEST001', '测试客户1', 'wechat1', 'tv_user1', 100, 'pending', 'SALE001', NOW()),
-- ('TEST002', '测试客户2', 'wechat2', 'tv_user2', 200, 'confirmed', 'SALE002', NOW()),
-- ('TEST003', '测试客户3', 'wechat3', 'tv_user3', 300, 'pending_payment', 'SALE001', NOW());
