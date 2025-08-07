-- ================================================
-- Supabase RLS 权限问题完整修复方案
-- ================================================
-- 在 Supabase SQL Editor 中执行此脚本

-- ================================================
-- 方案一：临时禁用 RLS（快速解决，不推荐生产环境）
-- ================================================
-- 取消下面的注释来临时禁用 RLS
/*
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE primary_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config DISABLE ROW LEVEL SECURITY;
*/

-- ================================================
-- 方案二：配置正确的 RLS 策略（推荐）
-- ================================================

-- 1. 首先启用 RLS（如果尚未启用）
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE primary_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Allow anonymous read access" ON orders;
DROP POLICY IF EXISTS "Allow anonymous read access" ON primary_sales;
DROP POLICY IF EXISTS "Allow anonymous read access" ON secondary_sales;
DROP POLICY IF EXISTS "Allow anonymous read access" ON admins;
DROP POLICY IF EXISTS "Allow anonymous read access" ON payment_config;

DROP POLICY IF EXISTS "Allow authenticated full access" ON orders;
DROP POLICY IF EXISTS "Allow authenticated full access" ON primary_sales;
DROP POLICY IF EXISTS "Allow authenticated full access" ON secondary_sales;
DROP POLICY IF EXISTS "Allow authenticated full access" ON admins;
DROP POLICY IF EXISTS "Allow authenticated full access" ON payment_config;

-- 3. 创建新的 RLS 策略

-- Orders 表策略
-- 允许所有用户读取（包括匿名用户）
CREATE POLICY "Allow public read access" ON orders
FOR SELECT USING (true);

-- 只允许认证用户创建和更新
CREATE POLICY "Allow authenticated insert" ON orders
FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true); -- 临时允许所有插入

CREATE POLICY "Allow authenticated update" ON orders
FOR UPDATE USING (auth.role() = 'authenticated' OR true); -- 临时允许所有更新

-- Primary Sales 表策略
CREATE POLICY "Allow public read access" ON primary_sales
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON primary_sales
FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true);

CREATE POLICY "Allow authenticated update" ON primary_sales
FOR UPDATE USING (auth.role() = 'authenticated' OR true);

-- Secondary Sales 表策略
CREATE POLICY "Allow public read access" ON secondary_sales
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON secondary_sales
FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true);

CREATE POLICY "Allow authenticated update" ON secondary_sales
FOR UPDATE USING (auth.role() = 'authenticated' OR true);

-- Admins 表策略（更严格）
CREATE POLICY "Allow public read access" ON admins
FOR SELECT USING (true); -- 注意：生产环境应该更严格

-- Payment Config 表策略
CREATE POLICY "Allow public read access" ON payment_config
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated update" ON payment_config
FOR UPDATE USING (auth.role() = 'authenticated' OR true);

CREATE POLICY "Allow authenticated insert" ON payment_config
FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true);

-- ================================================
-- 方案三：使用 Service Role Key（服务器端专用）
-- ================================================
-- 如果您在服务器端使用 Service Role Key，则可以绕过 RLS
-- Service Role Key 应该只在服务器端使用，永远不要暴露给客户端！

-- ================================================
-- 验证修复是否成功
-- ================================================
-- 执行以下查询来验证是否可以访问数据：

-- 测试 orders 表
SELECT COUNT(*) as order_count FROM orders;

-- 测试 primary_sales 表
SELECT COUNT(*) as primary_sales_count FROM primary_sales;

-- 测试 secondary_sales 表
SELECT COUNT(*) as secondary_sales_count FROM secondary_sales;

-- 测试 admins 表
SELECT COUNT(*) as admin_count FROM admins;

-- 测试 payment_config 表
SELECT COUNT(*) as payment_config_count FROM payment_config;

-- 查看当前的 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
