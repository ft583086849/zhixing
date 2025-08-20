-- 查看customers_optimized表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers_optimized'
ORDER BY ordinal_position;
