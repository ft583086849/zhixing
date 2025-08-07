-- 🔧 配置Supabase RLS策略 - 正确的权限配置
-- 在Supabase SQL编辑器中运行

-- 1. 为一级销售表添加策略
CREATE POLICY "Allow anonymous read primary_sales" ON primary_sales FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert primary_sales" ON primary_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update primary_sales" ON primary_sales FOR UPDATE USING (true);

-- 2. 为二级销售表添加策略  
CREATE POLICY "Allow anonymous read secondary_sales" ON secondary_sales FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert secondary_sales" ON secondary_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update secondary_sales" ON secondary_sales FOR UPDATE USING (true);

-- 3. 为支付配置表添加策略
CREATE POLICY "Allow anonymous read payment_config" ON payment_config FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert payment_config" ON payment_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update payment_config" ON payment_config FOR UPDATE USING (true);

-- 4. 确保orders表也有正确策略（如果需要）
-- CREATE POLICY "Allow anonymous read orders" ON orders FOR SELECT USING (true);
-- CREATE POLICY "Allow anonymous insert orders" ON orders FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anonymous update orders" ON orders FOR UPDATE USING (true);

-- 5. 验证策略创建结果
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('primary_sales', 'secondary_sales', 'payment_config', 'orders');
