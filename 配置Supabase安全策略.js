#!/usr/bin/env node

/**
 * 配置Supabase行级安全策略（RLS）
 * 生成需要在Supabase Dashboard中执行的SQL
 */

console.log('🔒 Supabase安全策略配置\n');

// RLS安全策略SQL
const securityPolicies = `
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
`;

console.log('📋 需要在Supabase SQL Editor中执行的安全策略：');
console.log('=' .repeat(60));
console.log(securityPolicies);
console.log('=' .repeat(60));

console.log('\n🔧 执行步骤：');
console.log('1. 打开Supabase Dashboard → SQL Editor');
console.log('2. 复制上面的SQL代码');
console.log('3. 点击 Run 执行');
console.log('4. 验证所有策略创建成功');

console.log('\n✅ 完成后回复"安全策略配置完成"');

// 创建独立的安全策略文件
const fs = require('fs');
fs.writeFileSync('supabase-security-policies.sql', securityPolicies);
console.log('\n💾 安全策略已保存到: supabase-security-policies.sql');