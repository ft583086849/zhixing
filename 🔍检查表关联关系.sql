-- 🔍 检查数据库表关联关系
-- 在Supabase SQL编辑器中运行

-- 1. 查看primary_sales表结构
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'primary_sales'
ORDER BY ordinal_position;

-- 2. 查看secondary_sales表结构
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'secondary_sales'
ORDER BY ordinal_position;

-- 3. 查看orders表结构
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 4. 查看外键关系
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('primary_sales', 'secondary_sales', 'orders');

-- 5. 验证关联关系：查看一级销售870501的相关数据
-- 5.1 查看一级销售信息
SELECT 
  id,
  wechat_name,
  sales_code,
  name,
  phone,
  secondary_registration_code
FROM primary_sales 
WHERE wechat_name = '870501';

-- 5.2 查看该一级销售的订单（通过sales_code关联）
SELECT 
  o.id,
  o.customer_wechat,
  o.sales_code,
  o.secondary_sales_name,
  o.amount,
  o.status,
  p.wechat_name as primary_sales_wechat
FROM orders o
LEFT JOIN primary_sales p ON o.sales_code = p.sales_code
WHERE p.wechat_name = '870501';

-- 5.3 查看该一级销售的二级销售（通过primary_sales_id关联）
SELECT 
  s.id,
  s.wechat_name as secondary_wechat,
  s.sales_code as secondary_code,
  s.primary_sales_id,
  p.wechat_name as primary_wechat
FROM secondary_sales s
LEFT JOIN primary_sales p ON s.primary_sales_id = p.id
WHERE p.wechat_name = '870501';

-- 6. 关联关系总结：
-- primary_sales表：
--   - id: 主键
--   - wechat_name: 一级销售微信号（如870501）
--   - sales_code: 销售代码（如PRI17545630529976717）
--   - name: 收款人姓名（支付宝收款时使用）
--   - secondary_registration_code: 二级销售注册码

-- secondary_sales表：
--   - id: 主键
--   - wechat_name: 二级销售微信号
--   - sales_code: 销售代码
--   - primary_sales_id: 外键，关联到primary_sales.id
--   - name: 收款人姓名

-- orders表：
--   - id: 主键
--   - sales_code: 关联到primary_sales.sales_code或secondary_sales.sales_code
--   - secondary_sales_name: 二级销售微信号（如果是通过二级销售下单）
--   - customer_wechat: 客户微信号

-- 7. 检查关联问题
-- 检查orders表中sales_code是否都能找到对应的销售
SELECT 
  o.id,
  o.sales_code,
  o.customer_wechat,
  CASE 
    WHEN p.sales_code IS NOT NULL THEN 'primary'
    WHEN s.sales_code IS NOT NULL THEN 'secondary'
    ELSE 'orphan'
  END as sales_type,
  COALESCE(p.wechat_name, s.wechat_name) as sales_wechat
FROM orders o
LEFT JOIN primary_sales p ON o.sales_code = p.sales_code
LEFT JOIN secondary_sales s ON o.sales_code = s.sales_code
WHERE o.sales_code IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 20;
