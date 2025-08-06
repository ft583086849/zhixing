# 🔧 备用验证SQL - 确认RLS状态

## 🎯 请在Supabase SQL Editor中执行以下查询

### 1️⃣ 验证RLS状态
```sql
-- 查看RLS状态
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('admins', 'orders', 'primary_sales', 'secondary_sales');
```

### 2️⃣ 如果RLS仍然开启，强制禁用
```sql
-- 强制禁用RLS
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
```

### 3️⃣ 测试插入（应该成功）
```sql
-- 测试插入管理员
INSERT INTO admins (username, password_hash, created_at) 
VALUES ('知行', 'Zhixing Universal Trading Signal', NOW());

-- 测试插入订单
INSERT INTO orders (order_number, customer_name, amount, status, created_at)
VALUES ('TEST001', 'Test Customer', 100, 'pending', NOW());
```

## 📋 预期结果
- **rowsecurity列应该显示false** (表示RLS已禁用)
- **INSERT语句应该成功执行**

## ✅ 执行完成后
回复"**备用验证完成**"，告诉我查询结果！