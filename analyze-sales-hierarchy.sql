-- 分析现有销售层级逻辑

-- 1. 查看primary_sales表结构和数据
SELECT 
    '======== 一级销售分析 ========' as section;

SELECT 
    id,
    sales_code,
    wechat_name,
    commission_rate,
    created_at
FROM primary_sales
LIMIT 10;

-- 2. 查看secondary_sales表结构和数据
SELECT 
    '======== 二级销售分析 ========' as section;

SELECT 
    s.id,
    s.sales_code,
    s.wechat_name,
    s.primary_sales_id,
    p.sales_code as "上级销售编号",
    p.wechat_name as "上级销售名称",
    s.commission_rate,
    s.created_at
FROM secondary_sales s
LEFT JOIN primary_sales p ON s.primary_sales_id = p.id
LIMIT 20;

-- 3. 分析二级销售的类型分布
SELECT 
    '======== 二级销售类型分布 ========' as section;

SELECT 
    CASE 
        WHEN primary_sales_id IS NULL THEN '独立二级销售（无上级）'
        ELSE '普通二级销售（有上级）'
    END as "销售类型",
    COUNT(*) as "数量",
    AVG(commission_rate) as "平均佣金率"
FROM secondary_sales
GROUP BY CASE 
    WHEN primary_sales_id IS NULL THEN '独立二级销售（无上级）'
    ELSE '普通二级销售（有上级）'
END;

-- 4. 查看订单表中的销售关联
SELECT 
    '======== 订单中的销售关联逻辑 ========' as section;

SELECT 
    CASE 
        WHEN primary_sales_id IS NOT NULL AND secondary_sales_id IS NULL THEN '仅一级销售'
        WHEN primary_sales_id IS NOT NULL AND secondary_sales_id IS NOT NULL THEN '一级+二级销售'
        WHEN primary_sales_id IS NULL AND secondary_sales_id IS NOT NULL THEN '仅二级销售（独立）'
        ELSE '无销售'
    END as "销售模式",
    COUNT(*) as "订单数",
    SUM(amount) as "总金额"
FROM orders_optimized
GROUP BY CASE 
    WHEN primary_sales_id IS NOT NULL AND secondary_sales_id IS NULL THEN '仅一级销售'
    WHEN primary_sales_id IS NOT NULL AND secondary_sales_id IS NOT NULL THEN '一级+二级销售'
    WHEN primary_sales_id IS NULL AND secondary_sales_id IS NOT NULL THEN '仅二级销售（独立）'
    ELSE '无销售'
END;

-- 5. 分析独立二级销售的特征
SELECT 
    '======== 独立二级销售详情 ========' as section;

SELECT 
    sales_code,
    wechat_name,
    commission_rate,
    created_at,
    '独立销售（无上级）' as "类型说明"
FROM secondary_sales
WHERE primary_sales_id IS NULL;

-- 6. 查看有上下级关系的销售链
SELECT 
    '======== 销售上下级关系链 ========' as section;

SELECT 
    p.sales_code as "一级销售编号",
    p.wechat_name as "一级销售名称",
    p.commission_rate as "一级佣金率",
    s.sales_code as "二级销售编号",
    s.wechat_name as "二级销售名称",
    s.commission_rate as "二级佣金率"
FROM primary_sales p
INNER JOIN secondary_sales s ON s.primary_sales_id = p.id
LIMIT 20;