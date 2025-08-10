-- 🔍 检查收益分配表是否存在
-- 执行位置：Supabase SQL Editor
-- 时间：2025-01-07

-- 1. 检查profit_distributions表是否存在
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name = 'profit_distributions';

-- 2. 如果表存在，查看表结构
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profit_distributions'
ORDER BY ordinal_position;

-- 3. 查看表中的数据
SELECT * FROM profit_distributions;

-- 4. 检查profit_distribution表（可能名字不带s）
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name LIKE 'profit_distribution%';

-- 5. 如果profit_distribution存在（不带s），查看数据
SELECT * FROM profit_distribution;
