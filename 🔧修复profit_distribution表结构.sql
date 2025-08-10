-- 🔧 修复profit_distribution表结构
-- 执行位置：Supabase SQL Editor
-- 时间：2025-01-07

-- =============================================
-- 1. 先查看当前表结构
-- =============================================
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profit_distribution'
ORDER BY ordinal_position;

-- =============================================
-- 2. 查看表中现有数据
-- =============================================
SELECT * FROM profit_distribution LIMIT 5;

-- =============================================
-- 3. 添加缺失的字段（如果需要）
-- =============================================
-- 添加category字段
ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'default';

-- 添加各种比例字段
ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS public_ratio DECIMAL(5,2) DEFAULT 40;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS zhixing_ratio DECIMAL(5,2) DEFAULT 35;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS zijun_ratio DECIMAL(5,2) DEFAULT 25;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS marketing_ratio DECIMAL(5,2) DEFAULT 10;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS dividend_ratio DECIMAL(5,2) DEFAULT 15;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS development_ratio DECIMAL(5,2) DEFAULT 15;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS ratio DECIMAL(5,2) DEFAULT 100;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS allocated_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 添加时间戳字段（如果不存在）
ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE profit_distribution 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =============================================
-- 4. 检查是否有数据，如果没有则插入默认配置
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profit_distribution WHERE is_active = true LIMIT 1) THEN
        -- 插入默认配置
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
        ) VALUES (
            'default',
            40,
            35,
            25,
            10,
            15,
            15,
            100,
            true
        );
        RAISE NOTICE '✅ 默认配置已插入';
    ELSE
        -- 更新现有配置
        UPDATE profit_distribution 
        SET 
            category = COALESCE(category, 'default'),
            public_ratio = COALESCE(public_ratio, 40),
            zhixing_ratio = COALESCE(zhixing_ratio, 35),
            zijun_ratio = COALESCE(zijun_ratio, 25),
            marketing_ratio = COALESCE(marketing_ratio, 10),
            dividend_ratio = COALESCE(dividend_ratio, 15),
            development_ratio = COALESCE(development_ratio, 15),
            ratio = COALESCE(ratio, 100),
            updated_at = CURRENT_TIMESTAMP
        WHERE is_active = true;
        RAISE NOTICE '✅ 配置已更新';
    END IF;
END $$;

-- =============================================
-- 5. 查看最终结果
-- =============================================
SELECT 
    COALESCE(category, 'default') as "配置",
    COALESCE(public_ratio, 40) as "公户(%)",
    COALESCE(marketing_ratio, 10) as "├─营销(%)",
    COALESCE(dividend_ratio, 15) as "├─分红(%)",
    COALESCE(development_ratio, 15) as "└─开发(%)",
    COALESCE(zhixing_ratio, 35) as "知行(%)",
    COALESCE(zijun_ratio, 25) as "子俊(%)",
    COALESCE(is_active, true) as "激活"
FROM profit_distribution
LIMIT 5;

-- =============================================
-- 6. 确认表结构完整
-- =============================================
SELECT '🎉 profit_distribution表结构修复完成！' as status,
       COUNT(*) as "记录数" 
FROM profit_distribution;
