-- 添加收款配置测试数据
-- 为现有销售记录更新收款信息

-- 1. 更新一级销售收款信息（支付宝）
UPDATE primary_sales 
SET 
    payment_address = '752304285@qq.com',
    name = '梁',
    payment_method = 'alipay'
WHERE sales_code = 'PRI17545383812300008';

-- 2. 更新二级销售收款信息（线上地址码）
UPDATE secondary_sales 
SET 
    payment_address = 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
    name = '梁',
    payment_method = 'crypto'
WHERE payment_method IS NOT NULL;

-- 3. 验证更新结果
SELECT 
    'primary_sales' as table_name,
    sales_code,
    name,
    payment_address,
    payment_method
FROM primary_sales 
WHERE sales_code = 'PRI17545383812300008'

UNION ALL

SELECT 
    'secondary_sales' as table_name,
    sales_code,
    name,
    payment_address,
    payment_method
FROM secondary_sales 
WHERE name IS NOT NULL
ORDER BY table_name, sales_code;

-- 4. 检查是否有数据
SELECT 
    'primary_sales总数' as info,
    COUNT(*) as count
FROM primary_sales

UNION ALL

SELECT 
    'secondary_sales总数' as info,
    COUNT(*) as count
FROM secondary_sales

UNION ALL

SELECT 
    'orders总数' as info,
    COUNT(*) as count
FROM orders;
