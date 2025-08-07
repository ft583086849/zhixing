-- 🔍 查看表结构并修复字段问题
-- 在Supabase SQL编辑器中运行

-- 1. 查看orders表的所有字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 2. 查看primary_sales表的所有字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'primary_sales'
ORDER BY ordinal_position;

-- 3. 查看secondary_sales表的所有字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'secondary_sales'
ORDER BY ordinal_position;

-- 4. 查看orders表的实际数据（看看有哪些字段）
SELECT * FROM orders LIMIT 1;

-- 5. 查看销售表的实际数据
SELECT * FROM primary_sales LIMIT 1;
SELECT * FROM secondary_sales LIMIT 1;

-- 6. 如果需要添加sales_wechat_name字段到orders表
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_wechat_name VARCHAR(255);

-- 7. 统计各表数据
SELECT 
  'primary_sales' as table_name, COUNT(*) as count FROM primary_sales
UNION ALL
SELECT 
  'secondary_sales' as table_name, COUNT(*) as count FROM secondary_sales
UNION ALL
SELECT 
  'orders' as table_name, COUNT(*) as count FROM orders;
