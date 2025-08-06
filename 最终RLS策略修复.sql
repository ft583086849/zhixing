-- 🔧 最终RLS策略修复 - 修复管理员和订单表

-- 修复管理员表策略
DROP POLICY IF EXISTS "Allow public insert admins" ON admins;
CREATE POLICY "Enable insert for all users" ON admins
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 修复订单表策略  
DROP POLICY IF EXISTS "Allow public insert orders" ON orders;
CREATE POLICY "Enable insert for all users" ON orders
FOR INSERT
TO anon, authenticated  
WITH CHECK (true);

-- 确保更新策略也正确
DROP POLICY IF EXISTS "Allow public update orders" ON orders;
CREATE POLICY "Enable update for all users" ON orders
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);