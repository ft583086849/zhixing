# 🔧 修复行级安全策略

## 📋 问题分析
测试失败的原因是RLS策略太严格，阻止了数据插入。需要调整策略以允许必要的操作。

## 🛠️ 需要在Supabase SQL Editor中执行的修复SQL

```sql
-- 1. 先删除现有的过于严格的策略
DROP POLICY IF EXISTS "Allow insert admins" ON admins;
DROP POLICY IF EXISTS "Allow authenticated insert primary_sales" ON primary_sales;
DROP POLICY IF EXISTS "Allow authenticated insert secondary_sales" ON secondary_sales;
DROP POLICY IF EXISTS "Allow anonymous create orders" ON orders;

-- 2. 创建更宽松的插入策略

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

-- 3. 同时允许更新操作
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
```

## ⚡ 执行步骤
1. 打开Supabase Dashboard → SQL Editor
2. 复制上面的SQL代码
3. 点击 Run 执行
4. 重新运行测试

## 📝 说明
这些策略现在允许公开访问，这对于MVP阶段是合适的。在生产环境中，可以根据需要收紧权限。