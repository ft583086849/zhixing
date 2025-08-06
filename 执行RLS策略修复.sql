-- 🔧 RLS策略修复 - 请在Supabase SQL Editor中执行

-- 1. 删除过于严格的策略
DROP POLICY IF EXISTS "Allow insert admins" ON admins;
DROP POLICY IF EXISTS "Allow authenticated insert primary_sales" ON primary_sales;
DROP POLICY IF EXISTS "Allow authenticated insert secondary_sales" ON secondary_sales;
DROP POLICY IF EXISTS "Allow anonymous create orders" ON orders;

-- 2. 创建宽松的插入策略

-- 管理员表：允许任何人插入（用于注册）
CREATE POLICY "Allow public insert admins" ON admins
FOR INSERT
WITH CHECK (true);

-- 一级销售表：允许任何人插入
CREATE POLICY "Allow public insert primary_sales" ON primary_sales
FOR INSERT
WITH CHECK (true);

-- 二级销售表：允许任何人插入
CREATE POLICY "Allow public insert secondary_sales" ON secondary_sales
FOR INSERT
WITH CHECK (true);

-- 订单表：允许任何人插入
CREATE POLICY "Allow public insert orders" ON orders
FOR INSERT
WITH CHECK (true);

-- 3. 创建更新策略

CREATE POLICY "Allow public update primary_sales" ON primary_sales
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public update secondary_sales" ON secondary_sales
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public update orders" ON orders
FOR UPDATE
USING (true)
WITH CHECK (true);