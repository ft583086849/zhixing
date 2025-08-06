# 🗄️ Supabase数据库表创建指南

## 📋 步骤概述
1. 打开Supabase Dashboard
2. 使用SQL Editor创建所有表
3. 验证表结构
4. 配置权限

## 🔗 操作步骤

### 1. 访问Supabase Dashboard
打开：https://itvmeamoqthfqtkpubdv.supabase.co

### 2. 打开SQL Editor
- 在左侧菜单找到 `SQL Editor`
- 点击进入

### 3. 创建表（复制以下SQL到SQL Editor）

```sql
-- 1. 创建管理员表
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建一级销售表
CREATE TABLE IF NOT EXISTS primary_sales (
  id SERIAL PRIMARY KEY,
  sales_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  commission_rate DECIMAL(5,4) DEFAULT 0.4000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建二级销售表
CREATE TABLE IF NOT EXISTS secondary_sales (
  id SERIAL PRIMARY KEY,
  sales_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  primary_sales_id INTEGER REFERENCES primary_sales(id) ON DELETE SET NULL,
  commission_rate DECIMAL(5,4) DEFAULT 0.3000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建订单表
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  sales_code VARCHAR(50),
  sales_type VARCHAR(20),
  commission_amount DECIMAL(10,2),
  payment_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. 执行SQL
- 点击 `Run` 按钮执行SQL
- 确认所有表创建成功

### 5. 验证表创建
- 转到 `Table Editor`
- 确认看到4个表：`admins`, `primary_sales`, `secondary_sales`, `orders`

## ✅ 完成后告诉我
创建完成后，回复"表创建完成"，我将继续配置权限和更新前端代码！

## 🚨 如果遇到问题
- 截图发送错误信息
- 或者告诉我具体错误内容