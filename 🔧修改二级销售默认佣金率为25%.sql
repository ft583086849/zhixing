-- 🔧 修改二级销售默认佣金率为 25%
-- 执行位置：Supabase SQL Editor
-- 时间：2025-01-07

-- =============================================
-- 1. 修改 secondary_sales 表的默认佣金率为 25%
-- =============================================
ALTER TABLE secondary_sales 
ALTER COLUMN commission_rate SET DEFAULT 25.00;

-- =============================================
-- 2. 更新现有二级销售的佣金率（如果是默认的30%则改为25%）
-- =============================================
UPDATE secondary_sales 
SET commission_rate = 25.00
WHERE commission_rate = 30.00
   OR commission_rate IS NULL;

-- =============================================
-- 3. 查看修改结果
-- =============================================
SELECT 
    'secondary_sales表默认值' as check_item,
    column_default
FROM information_schema.columns
WHERE table_name = 'secondary_sales' 
  AND column_name = 'commission_rate'
  AND table_schema = 'public';

-- =============================================
-- 4. 查看二级销售的佣金率分布
-- =============================================
SELECT 
    commission_rate,
    COUNT(*) as count,
    STRING_AGG(wechat_name, ', ') as sales_names
FROM secondary_sales
GROUP BY commission_rate
ORDER BY commission_rate;

-- =============================================
-- 5. 特别检查 waterli_1313 的佣金率
-- =============================================
SELECT 
    wechat_name,
    commission_rate,
    primary_sales_id,
    created_at,
    updated_at
FROM secondary_sales
WHERE wechat_name = 'waterli_1313';

-- =============================================
-- 6. 显示所有二级销售的佣金率
-- =============================================
SELECT 
    ss.wechat_name as "二级销售",
    ps.wechat_name as "所属一级销售",
    ss.commission_rate as "当前佣金率",
    CASE 
        WHEN ss.commission_rate = 25 THEN '✅ 正确（25%）'
        WHEN ss.commission_rate = 30 THEN '❌ 需要修改（30%）'
        ELSE '⚠️ 特殊设置（' || ss.commission_rate || '%）'
    END as "状态"
FROM secondary_sales ss
LEFT JOIN primary_sales ps ON ss.primary_sales_id = ps.id
ORDER BY ss.created_at DESC;

-- =============================================
-- 完成提示
-- =============================================
SELECT '🎉 二级销售默认佣金率已修改为 25%' as status;
