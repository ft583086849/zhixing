-- 🔧 修复订单表销售ID关联问题
-- 解决无法区分独立二级和一级下属二级的核心问题

-- ========================================
-- 1. 添加缺失的字段（如果不存在）
-- ========================================

-- 检查并添加 primary_sales_id 字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'primary_sales_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN primary_sales_id INT;
        RAISE NOTICE '✅ 已添加 primary_sales_id 字段';
    ELSE
        RAISE NOTICE '⏭️ primary_sales_id 字段已存在';
    END IF;
END $$;

-- 检查并添加 secondary_sales_id 字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'secondary_sales_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN secondary_sales_id INT;
        RAISE NOTICE '✅ 已添加 secondary_sales_id 字段';
    ELSE
        RAISE NOTICE '⏭️ secondary_sales_id 字段已存在';
    END IF;
END $$;

-- ========================================
-- 2. 创建索引以提高查询性能
-- ========================================

CREATE INDEX IF NOT EXISTS idx_orders_primary_sales_id 
ON orders(primary_sales_id);

CREATE INDEX IF NOT EXISTS idx_orders_secondary_sales_id 
ON orders(secondary_sales_id);

-- ========================================
-- 3. 修复现有订单数据
-- ========================================

-- 修复一级销售的订单
UPDATE orders o
SET 
    primary_sales_id = ps.id,
    secondary_sales_id = NULL
FROM primary_sales ps
WHERE o.sales_code = ps.sales_code
  AND o.primary_sales_id IS NULL;

-- 修复二级销售的订单
UPDATE orders o
SET 
    secondary_sales_id = ss.id,
    primary_sales_id = ss.primary_sales_id  -- 如果二级销售有上级，也设置上级ID
FROM secondary_sales ss
WHERE o.sales_code = ss.sales_code
  AND o.secondary_sales_id IS NULL;

-- ========================================
-- 4. 验证修复结果
-- ========================================

-- 统计各类订单数量
SELECT 
    '订单分类统计' as title,
    COUNT(*) FILTER (WHERE sales_type = 'primary') as "一级销售订单",
    COUNT(*) FILTER (WHERE sales_type = 'secondary' AND primary_sales_id IS NOT NULL) as "一级下属二级订单",
    COUNT(*) FILTER (WHERE sales_type = 'secondary' AND primary_sales_id IS NULL) as "独立二级订单",
    COUNT(*) FILTER (WHERE sales_code IS NOT NULL AND primary_sales_id IS NULL AND secondary_sales_id IS NULL) as "未关联订单"
FROM orders;

-- 查看未关联的订单详情（如果有）
SELECT 
    id,
    order_number,
    sales_code,
    sales_type,
    amount,
    status,
    created_at
FROM orders
WHERE sales_code IS NOT NULL 
  AND primary_sales_id IS NULL 
  AND secondary_sales_id IS NULL
LIMIT 10;

-- ========================================
-- 5. 创建或更新视图以支持新的查询逻辑
-- ========================================

-- 创建一级销售综合统计视图
CREATE OR REPLACE VIEW primary_sales_comprehensive_stats AS
SELECT 
    ps.id as primary_sales_id,
    ps.wechat_name,
    ps.sales_code,
    
    -- 直接订单统计
    COUNT(DISTINCT o1.id) FILTER (WHERE o1.sales_type = 'primary') as direct_order_count,
    COALESCE(SUM(o1.amount) FILTER (WHERE o1.sales_type = 'primary'), 0) as direct_amount,
    COALESCE(SUM(o1.amount * 0.4) FILTER (WHERE o1.sales_type = 'primary'), 0) as direct_commission,
    
    -- 下属二级订单统计
    COUNT(DISTINCT o2.id) FILTER (WHERE o2.sales_type = 'secondary') as subordinate_order_count,
    COALESCE(SUM(o2.amount) FILTER (WHERE o2.sales_type = 'secondary'), 0) as subordinate_amount,
    COALESCE(SUM(o2.commission_amount) FILTER (WHERE o2.sales_type = 'secondary'), 0) as subordinate_commission_paid,
    
    -- 管理佣金（下属订单总额 - 支付给二级的佣金）
    COALESCE(
        SUM(o2.amount) FILTER (WHERE o2.sales_type = 'secondary') - 
        SUM(o2.commission_amount) FILTER (WHERE o2.sales_type = 'secondary'), 
        0
    ) as management_commission,
    
    -- 综合统计
    COUNT(DISTINCT o1.id) + COUNT(DISTINCT o2.id) as total_order_count,
    COALESCE(SUM(o1.amount), 0) + COALESCE(SUM(o2.amount), 0) as total_amount,
    
    -- 综合佣金率
    CASE 
        WHEN (COALESCE(SUM(o1.amount), 0) + COALESCE(SUM(o2.amount), 0)) > 0
        THEN (
            (COALESCE(SUM(o1.amount * 0.4), 0) + 
             COALESCE(SUM(o2.amount), 0) - COALESCE(SUM(o2.commission_amount), 0)) /
            (COALESCE(SUM(o1.amount), 0) + COALESCE(SUM(o2.amount), 0))
        ) * 100
        ELSE 0
    END as comprehensive_commission_rate
    
FROM primary_sales ps
LEFT JOIN orders o1 ON ps.id = o1.primary_sales_id AND o1.sales_type = 'primary'
LEFT JOIN orders o2 ON ps.id = o2.primary_sales_id AND o2.sales_type = 'secondary'
WHERE o1.status IN ('confirmed', 'confirmed_configuration', 'confirmed_config', 'active')
   OR o2.status IN ('confirmed', 'confirmed_configuration', 'confirmed_config', 'active')
GROUP BY ps.id, ps.wechat_name, ps.sales_code;

-- ========================================

RAISE NOTICE '✅ 订单销售ID关联修复完成！';
RAISE NOTICE '现在系统可以正确区分：';
RAISE NOTICE '1. 一级销售的直接订单';
RAISE NOTICE '2. 一级销售下属二级的订单（一级获得管理佣金）';
RAISE NOTICE '3. 独立二级销售的订单';
