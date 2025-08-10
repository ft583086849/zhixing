-- 🔧 正确创建profit_distribution表（不带s，匹配代码）
-- 执行位置：Supabase SQL Editor
-- 时间：2025-01-07
-- 说明：代码中引用的是profit_distribution（不带s），所以创建时不带s

-- =============================================
-- 1. 先检查表是否存在
-- =============================================
DO $$
BEGIN
    -- 检查profit_distribution表是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profit_distribution'
    ) THEN
        -- 如果不存在，创建表
        CREATE TABLE profit_distribution (
            id SERIAL PRIMARY KEY,
            category VARCHAR(50) DEFAULT 'default',
            -- 主要比例
            public_ratio DECIMAL(5,2) DEFAULT 40,
            zhixing_ratio DECIMAL(5,2) DEFAULT 35,
            zijun_ratio DECIMAL(5,2) DEFAULT 25,
            -- 公户子项比例
            marketing_ratio DECIMAL(5,2) DEFAULT 10,
            dividend_ratio DECIMAL(5,2) DEFAULT 15,
            development_ratio DECIMAL(5,2) DEFAULT 15,
            -- 其他字段
            ratio DECIMAL(5,2) DEFAULT 100,
            allocated_amount DECIMAL(10,2) DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE '✅ 表profit_distribution创建成功';
    ELSE
        RAISE NOTICE '⚠️ 表profit_distribution已存在';
    END IF;
END $$;

-- =============================================
-- 2. 确保必要的字段存在（如果表已存在）
-- =============================================
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
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =============================================
-- 3. 插入或更新默认配置
-- =============================================
-- 先检查是否有数据
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profit_distribution LIMIT 1) THEN
        -- 如果没有数据，插入默认配置
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
        -- 如果有数据，更新第一条记录
        UPDATE profit_distribution 
        SET 
            public_ratio = COALESCE(public_ratio, 40),
            zhixing_ratio = COALESCE(zhixing_ratio, 35),
            zijun_ratio = COALESCE(zijun_ratio, 25),
            marketing_ratio = COALESCE(marketing_ratio, 10),
            dividend_ratio = COALESCE(dividend_ratio, 15),
            development_ratio = COALESCE(development_ratio, 15),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM profit_distribution ORDER BY id LIMIT 1);
        RAISE NOTICE '✅ 配置已更新';
    END IF;
END $$;

-- =============================================
-- 4. 创建更新触发器
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除可能存在的旧触发器
DROP TRIGGER IF EXISTS update_profit_distribution_updated_at ON profit_distribution;

-- 创建新触发器
CREATE TRIGGER update_profit_distribution_updated_at 
BEFORE UPDATE ON profit_distribution 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. 设置RLS策略（如果需要）
-- =============================================
ALTER TABLE profit_distribution ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Allow read profit distribution" ON profit_distribution;
DROP POLICY IF EXISTS "Allow admin update profit distribution" ON profit_distribution;

-- 允许所有人读取
CREATE POLICY "Allow read profit distribution" 
ON profit_distribution FOR SELECT 
USING (true);

-- 只允许管理员更新
CREATE POLICY "Allow admin update profit distribution" 
ON profit_distribution FOR UPDATE 
USING (true); -- 简化为true，实际部署时可改为 auth.jwt() ->> 'role' = 'admin'

-- =============================================
-- 6. 查看最终结果
-- =============================================
SELECT 
    '配置项' as "类型",
    public_ratio as "公户(%)",
    marketing_ratio as "├─营销(%)",
    dividend_ratio as "├─分红(%)",
    development_ratio as "└─开发(%)",
    zhixing_ratio as "知行(%)",
    zijun_ratio as "子俊(%)",
    (public_ratio + zhixing_ratio + zijun_ratio) as "总计(%)"
FROM profit_distribution
WHERE is_active = true
LIMIT 1;

-- =============================================
-- 完成提示
-- =============================================
SELECT '🎉 profit_distribution表设置完成！' as status;
