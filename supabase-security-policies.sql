
-- 1. 启用行级安全 (RLS)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE primary_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. 管理员表权限策略
-- 允许所有经过身份验证的用户查询管理员
CREATE POLICY "Allow authenticated users to read admins" ON admins
FOR SELECT TO authenticated
USING (true);

-- 允许插入新管理员（注册用）
CREATE POLICY "Allow insert admins" ON admins
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 3. 销售表权限策略  
-- 允许匿名用户和认证用户读取销售信息
CREATE POLICY "Allow read primary_sales" ON primary_sales
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Allow read secondary_sales" ON secondary_sales
FOR SELECT TO anon, authenticated
USING (true);

-- 允许认证用户插入和更新销售信息
CREATE POLICY "Allow authenticated insert primary_sales" ON primary_sales
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update primary_sales" ON primary_sales
FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert secondary_sales" ON secondary_sales
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update secondary_sales" ON secondary_sales
FOR UPDATE TO authenticated
USING (true);

-- 4. 订单表权限策略
-- 允许匿名用户创建订单（购买流程）
CREATE POLICY "Allow anonymous create orders" ON orders
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 允许认证用户读取所有订单
CREATE POLICY "Allow authenticated read orders" ON orders
FOR SELECT TO authenticated
USING (true);

-- 允许认证用户更新订单
CREATE POLICY "Allow authenticated update orders" ON orders
FOR UPDATE TO authenticated
USING (true);
