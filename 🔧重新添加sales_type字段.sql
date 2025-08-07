-- 🔧 重新添加 sales_type 字段
-- 确认字段不存在，需要重新添加

-- ===============================================
-- 1. 先检查当前表结构
-- ===============================================
SELECT 
    'primary_sales 当前字段' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'primary_sales'
ORDER BY ordinal_position;

SELECT 
    'secondary_sales 当前字段' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'secondary_sales'
ORDER BY ordinal_position;

-- ===============================================
-- 2. 确保枚举类型存在
-- ===============================================
-- 检查枚举类型
SELECT typname, enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'sales_type_enum';

-- 如果不存在就创建（如果存在会报错但不影响）
CREATE TYPE sales_type_enum AS ENUM ('primary', 'secondary', 'legacy');

-- ===============================================
-- 3. 为 primary_sales 表添加 sales_type 字段
-- ===============================================
ALTER TABLE primary_sales 
ADD COLUMN sales_type sales_type_enum DEFAULT 'primary';

-- ===============================================
-- 4. 为 secondary_sales 表添加 sales_type 字段
-- ===============================================
ALTER TABLE secondary_sales 
ADD COLUMN sales_type sales_type_enum DEFAULT 'secondary';

-- ===============================================
-- 5. 验证字段添加成功
-- ===============================================
SELECT 
    'primary_sales sales_type检查' as check_info,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'primary_sales' AND column_name = 'sales_type';

SELECT 
    'secondary_sales sales_type检查' as check_info,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'secondary_sales' AND column_name = 'sales_type';

-- ===============================================
-- 6. 测试字段访问
-- ===============================================
SELECT 'primary_sales字段测试' as test, sales_type FROM primary_sales LIMIT 1;
SELECT 'secondary_sales字段测试' as test, sales_type FROM secondary_sales LIMIT 1;

-- ===============================================
-- 7. 成功提示
-- ===============================================
SELECT 
    '✅ sales_type字段添加完成！' as status,
    '现在可以测试销售注册功能' as next_step;