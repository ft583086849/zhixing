-- 🔧 添加缺失字段到profit_distribution表
-- 执行位置：Supabase SQL Editor
-- 时间：2025-01-07

-- =============================================
-- 1. 添加缺失的字段
-- =============================================

-- 添加category字段（必需）
ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'default';

-- 添加公户子项比例字段
ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS marketing_ratio DECIMAL(5,2) DEFAULT 10;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS dividend_ratio DECIMAL(5,2) DEFAULT 15;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS development_ratio DECIMAL(5,2) DEFAULT 15;

-- 添加其他字段
ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS ratio DECIMAL(5,2) DEFAULT 100;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS allocated_amount DECIMAL(10,2) DEFAULT 0;

-- =============================================
-- 2. 检查表中是否有数据
-- =============================================
SELECT COUNT(*) as record_count FROM profit_distribution;

-- =============================================
-- 3. 如果没有数据，插入默认配置
-- =============================================
INSERT INTO profit_distribution (
    category,
    public_ratio,
    zhixing_ratio,
    zijun_ratio,
    marketing_ratio,
    dividend_ratio,
    development_ratio,
    ratio,
    is_active
) 
SELECT 
    'default',
    40,
    35,
    25,
    10,
    15,
    15,
    100,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM profit_distribution WHERE is_active = true
);

-- =============================================
-- 4. 如果有数据但缺少字段值，更新它们
-- =============================================
UPDATE profit_distribution 
SET 
    category = COALESCE(category, 'default'),
    marketing_ratio = COALESCE(marketing_ratio, 10),
    dividend_ratio = COALESCE(dividend_ratio, 15),
    development_ratio = COALESCE(development_ratio, 15),
    ratio = COALESCE(ratio, 100),
    allocated_amount = COALESCE(allocated_amount, 0),
    updated_at = CURRENT_TIMESTAMP
WHERE is_active = true;

-- =============================================
-- 5. 查看最终结果
-- =============================================
SELECT 
    id,
    category as "配置类型",
    public_ratio as "公户(%)",
    marketing_ratio as "├─营销(%)",
    dividend_ratio as "├─分红(%)",
    development_ratio as "└─开发(%)",
    zhixing_ratio as "知行(%)",
    zijun_ratio as "子俊(%)",
    (public_ratio + zhixing_ratio + zijun_ratio) as "总计(%)",
    is_active as "激活状态"
FROM profit_distribution;

-- =============================================
-- 6. 验证所有字段都存在
-- =============================================
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profit_distribution'
ORDER BY ordinal_position;

-- =============================================
-- 完成提示
-- =============================================
SELECT '🎉 字段添加完成！' as status,
       COUNT(*) as "记录数",
       COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as "有category的记录"
FROM profit_distribution;
