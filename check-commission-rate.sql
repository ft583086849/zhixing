-- 检查所有销售的佣金率是否正常
SELECT 
    '一级销售' as type,
    sales_code,
    wechat_name,
    commission_rate,
    CASE 
        WHEN commission_rate > 100 THEN '异常：佣金率大于100%'
        WHEN commission_rate IS NULL THEN '警告：佣金率为空'
        ELSE '正常'
    END as status
FROM primary_sales
WHERE commission_rate > 100 OR commission_rate IS NULL

UNION ALL

SELECT 
    '二级销售' as type,
    sales_code,
    wechat_name,
    commission_rate,
    CASE 
        WHEN commission_rate > 100 THEN '异常：佣金率大于100%'
        WHEN commission_rate IS NULL THEN '警告：佣金率为空'
        ELSE '正常'
    END as status
FROM secondary_sales
WHERE commission_rate > 100 OR commission_rate IS NULL

ORDER BY type, commission_rate DESC;
