-- 🔧 统一佣金率存储格式为小数（0-1）
-- 根据v2.5.1需求：数据库统一存储小数，前端显示百分比
-- 执行时间：2025-01-03

-- ===============================================
-- 1. 修改primary_sales表结构
-- ===============================================
-- 修改列定义，从DECIMAL(5,2)改为DECIMAL(5,4)
ALTER TABLE primary_sales 
MODIFY COLUMN commission_rate DECIMAL(5,4) DEFAULT 0.4000 COMMENT '佣金率（小数格式）';

-- 更新现有数据：将百分比转换为小数
UPDATE primary_sales 
SET commission_rate = commission_rate / 100
WHERE commission_rate > 1;

-- ===============================================
-- 2. 修改secondary_sales表结构
-- ===============================================
-- 修改列定义
ALTER TABLE secondary_sales 
MODIFY COLUMN commission_rate DECIMAL(5,4) DEFAULT 0.2500 COMMENT '佣金率（小数格式）';

-- 更新现有数据：将百分比转换为小数
UPDATE secondary_sales 
SET commission_rate = commission_rate / 100
WHERE commission_rate > 1;

-- ===============================================
-- 3. 验证数据正确性
-- ===============================================
-- 检查一级销售佣金率
SELECT 
    'primary_sales' as table_name,
    sales_code,
    wechat_name,
    commission_rate,
    CASE 
        WHEN commission_rate > 1 THEN '❌ 还是百分比格式'
        WHEN commission_rate <= 0 THEN '⚠️ 佣金率为0或负数'
        ELSE '✅ 已转换为小数格式'
    END as status
FROM primary_sales
ORDER BY commission_rate DESC;

-- 检查二级销售佣金率
SELECT 
    'secondary_sales' as table_name,
    sales_code,
    wechat_name,
    commission_rate,
    CASE 
        WHEN commission_rate > 1 THEN '❌ 还是百分比格式'
        WHEN commission_rate <= 0 THEN '⚠️ 佣金率为0或负数'
        ELSE '✅ 已转换为小数格式'
    END as status
FROM secondary_sales
ORDER BY commission_rate DESC;

-- ===============================================
-- 4. 确认orders表格式（应该已经是小数）
-- ===============================================
SELECT 
    'orders' as table_name,
    COUNT(*) as total_orders,
    MIN(commission_rate) as min_rate,
    MAX(commission_rate) as max_rate,
    AVG(commission_rate) as avg_rate,
    CASE 
        WHEN MAX(commission_rate) > 1 THEN '❌ 存在百分比格式'
        ELSE '✅ 全部为小数格式'
    END as status
FROM orders
WHERE commission_rate IS NOT NULL;

-- ===============================================
-- 5. 总结报告
-- ===============================================
SELECT 
    '格式统一完成' as result,
    '所有表的commission_rate字段现在都使用小数格式（0-1）' as description,
    '前端显示时会自动乘以100显示为百分比' as note;
