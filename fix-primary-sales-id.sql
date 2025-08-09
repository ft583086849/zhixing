-- 修复二级销售的primary_sales_id字段
-- 请根据实际情况修改

-- 1. 查看当前二级销售的关联情况
SELECT 
    s.id,
    s.wechat_name,
    s.sales_code,
    s.primary_sales_id,
    p.wechat_name as primary_sales_name
FROM secondary_sales s
LEFT JOIN primary_sales p ON s.primary_sales_id = p.id
ORDER BY s.id;

-- 2. 如果需要手动关联，使用以下语句
-- 例如：将某个二级销售关联到某个一级销售
-- UPDATE secondary_sales 
-- SET primary_sales_id = (SELECT id FROM primary_sales WHERE wechat_name = '一级销售微信号')
-- WHERE wechat_name = '二级销售微信号';

-- 3. 批量更新示例（根据某种规则）
-- UPDATE secondary_sales s
-- SET primary_sales_id = (
--     SELECT p.id 
--     FROM primary_sales p 
--     WHERE s.registration_code = p.sales_code
--     LIMIT 1
-- )
-- WHERE s.primary_sales_id IS NULL;
