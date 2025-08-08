-- 🔍 数据完整性验证脚本
-- 用于检查和修复数据关联问题

-- ========================================
-- 1. 检查二级销售关联完整性
-- ========================================
SELECT '=== 1. 二级销售关联检查 ===' as '检查项';

-- 1.1 查找未关联到一级销售的二级销售（独立二级）
SELECT 
    '独立二级销售' as '类型',
    COUNT(*) as '数量',
    GROUP_CONCAT(sales_code) as '销售代码列表'
FROM secondary_sales 
WHERE primary_sales_id IS NULL;

-- 1.2 查找关联了一级销售的二级销售（一级下属）
SELECT 
    '一级下属二级销售' as '类型',
    COUNT(*) as '数量',
    ps.wechat_name as '所属一级销售'
FROM secondary_sales ss
JOIN primary_sales ps ON ss.primary_sales_id = ps.id
GROUP BY ps.id, ps.wechat_name;

-- 1.3 检查primary_sales_id是否有效
SELECT 
    '❌ 无效的primary_sales_id' as '问题',
    ss.sales_code,
    ss.primary_sales_id as '无效ID'
FROM secondary_sales ss
WHERE ss.primary_sales_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM primary_sales ps 
        WHERE ps.id = ss.primary_sales_id
    );

-- ========================================
-- 2. 检查订单关联完整性
-- ========================================
SELECT '=== 2. 订单关联检查 ===' as '检查项';

-- 2.1 检查sales_code是否有效
SELECT 
    '订单sales_code有效性' as '检查项',
    COUNT(CASE WHEN sales_type = 'primary' AND ps.id IS NOT NULL THEN 1 END) as '有效一级订单',
    COUNT(CASE WHEN sales_type = 'secondary' AND ss.id IS NOT NULL THEN 1 END) as '有效二级订单',
    COUNT(CASE WHEN sales_type = 'primary' AND ps.id IS NULL THEN 1 END) as '❌无效一级订单',
    COUNT(CASE WHEN sales_type = 'secondary' AND ss.id IS NULL THEN 1 END) as '❌无效二级订单'
FROM orders o
LEFT JOIN primary_sales ps ON o.sales_code = ps.sales_code AND o.sales_type = 'primary'
LEFT JOIN secondary_sales ss ON o.sales_code = ss.sales_code AND o.sales_type = 'secondary';

-- 2.2 查找缺少销售ID的订单（需要修复）
SELECT 
    '⚠️ 缺少销售ID的订单' as '问题',
    COUNT(*) as '数量',
    SUM(amount) as '涉及金额',
    SUM(commission_amount) as '涉及佣金'
FROM orders
WHERE sales_code IS NOT NULL
    AND (
        (sales_type = 'primary' AND primary_sales_id IS NULL) OR
        (sales_type = 'secondary' AND secondary_sales_id IS NULL)
    );

-- 2.3 详细列出需要修复的订单
SELECT 
    o.id as '订单ID',
    o.sales_code,
    o.sales_type,
    o.amount,
    o.commission_amount,
    CASE 
        WHEN o.sales_type = 'primary' THEN ps.id
        WHEN o.sales_type = 'secondary' THEN ss.id
    END as '应该关联的销售ID',
    o.created_at
FROM orders o
LEFT JOIN primary_sales ps ON o.sales_code = ps.sales_code AND o.sales_type = 'primary'
LEFT JOIN secondary_sales ss ON o.sales_code = ss.sales_code AND o.sales_type = 'secondary'
WHERE o.sales_code IS NOT NULL
    AND (
        (o.sales_type = 'primary' AND o.primary_sales_id IS NULL AND ps.id IS NOT NULL) OR
        (o.sales_type = 'secondary' AND o.secondary_sales_id IS NULL AND ss.id IS NOT NULL)
    )
LIMIT 10;

-- ========================================
-- 3. 佣金计算验证
-- ========================================
SELECT '=== 3. 佣金计算验证 ===' as '检查项';

-- 3.1 检查一级销售的佣金
SELECT 
    ps.wechat_name as '一级销售',
    COUNT(DISTINCT o.id) as '直接订单数',
    SUM(CASE WHEN o.sales_type = 'primary' THEN o.amount ELSE 0 END) as '直接订单金额',
    SUM(CASE WHEN o.sales_type = 'primary' THEN o.commission_amount ELSE 0 END) as '直接佣金',
    ROUND(AVG(CASE WHEN o.sales_type = 'primary' THEN o.commission_rate ELSE NULL END) * 100, 2) as '平均佣金率%'
FROM primary_sales ps
LEFT JOIN orders o ON o.sales_code = ps.sales_code AND o.sales_type = 'primary'
GROUP BY ps.id, ps.wechat_name;

-- 3.2 检查二级销售的佣金
SELECT 
    ss.wechat_name as '二级销售',
    CASE WHEN ss.primary_sales_id IS NULL THEN '独立' ELSE '下属' END as '类型',
    ps.wechat_name as '所属一级',
    COUNT(DISTINCT o.id) as '订单数',
    SUM(o.amount) as '订单金额',
    SUM(o.commission_amount) as '佣金总额',
    ROUND(AVG(o.commission_rate) * 100, 2) as '平均佣金率%'
FROM secondary_sales ss
LEFT JOIN primary_sales ps ON ss.primary_sales_id = ps.id
LEFT JOIN orders o ON o.sales_code = ss.sales_code AND o.sales_type = 'secondary'
GROUP BY ss.id, ss.wechat_name, ps.wechat_name;

-- 3.3 验证管理佣金（一级销售从下属二级订单获得的佣金）
SELECT 
    ps.wechat_name as '一级销售',
    COUNT(DISTINCT ss.id) as '下属二级数量',
    COUNT(DISTINCT o.id) as '下属订单数',
    SUM(o.amount) as '下属订单总额',
    SUM(o.commission_amount) as '下属获得佣金',
    SUM(o.amount) - SUM(o.commission_amount) as '管理佣金（理论值）'
FROM primary_sales ps
JOIN secondary_sales ss ON ss.primary_sales_id = ps.id
LEFT JOIN orders o ON o.sales_code = ss.sales_code AND o.sales_type = 'secondary'
GROUP BY ps.id, ps.wechat_name
HAVING COUNT(DISTINCT ss.id) > 0;

-- ========================================
-- 4. 数据修复SQL（谨慎执行）
-- ========================================
SELECT '=== 4. 数据修复建议 ===' as '检查项';

-- 4.1 修复订单表缺失的primary_sales_id
-- UPDATE orders o
-- JOIN primary_sales ps ON o.sales_code = ps.sales_code
-- SET o.primary_sales_id = ps.id
-- WHERE o.sales_type = 'primary' 
--   AND o.primary_sales_id IS NULL
--   AND o.sales_code IS NOT NULL;

-- 4.2 修复订单表缺失的secondary_sales_id
-- UPDATE orders o
-- JOIN secondary_sales ss ON o.sales_code = ss.sales_code
-- SET o.secondary_sales_id = ss.id
-- WHERE o.sales_type = 'secondary'
--   AND o.secondary_sales_id IS NULL
--   AND o.sales_code IS NOT NULL;

-- 4.3 修复佣金率异常的记录
-- UPDATE orders
-- SET commission_rate = CASE
--     WHEN sales_type = 'primary' THEN 0.4
--     WHEN sales_type = 'secondary' THEN 0.3
--     ELSE commission_rate
-- END
-- WHERE commission_rate IS NULL OR commission_rate = 0;

-- ========================================
-- 5. 综合统计报告
-- ========================================
SELECT '=== 5. 综合统计报告 ===' as '检查项';

SELECT 
    '数据完整性得分' as '指标',
    CONCAT(
        ROUND(
            (
                -- 订单关联完整性
                (SELECT COUNT(*) FROM orders WHERE sales_code IS NOT NULL AND sales_type IS NOT NULL) /
                (SELECT COUNT(*) FROM orders WHERE sales_code IS NOT NULL) * 0.3 +
                
                -- 二级销售关联正确性
                (SELECT COUNT(*) FROM secondary_sales WHERE 
                    (primary_sales_id IS NULL) OR 
                    (primary_sales_id IS NOT NULL AND EXISTS (SELECT 1 FROM primary_sales WHERE id = secondary_sales.primary_sales_id))
                ) /
                (SELECT COUNT(*) FROM secondary_sales) * 0.3 +
                
                -- 佣金计算正确性
                (SELECT COUNT(*) FROM orders WHERE 
                    commission_rate BETWEEN 0.1 AND 0.5 AND
                    commission_amount = amount * commission_rate
                ) /
                (SELECT COUNT(*) FROM orders WHERE commission_amount > 0) * 0.4
            ) * 100, 2
        ), '%'
    ) as '得分';

-- 生成修复建议
SELECT 
    '修复建议汇总' as '项目',
    CONCAT(
        '需要修复的订单数: ', 
        (SELECT COUNT(*) FROM orders WHERE 
            sales_code IS NOT NULL AND 
            ((sales_type = 'primary' AND primary_sales_id IS NULL) OR
             (sales_type = 'secondary' AND secondary_sales_id IS NULL))
        ),
        ', 涉及金额: ',
        (SELECT IFNULL(SUM(amount), 0) FROM orders WHERE 
            sales_code IS NOT NULL AND 
            ((sales_type = 'primary' AND primary_sales_id IS NULL) OR
             (sales_type = 'secondary' AND secondary_sales_id IS NULL))
        )
    ) as '详情';
