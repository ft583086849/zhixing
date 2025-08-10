-- 🔧 更新收益分配记录表字段
-- 执行位置：Supabase SQL Editor
-- 时间：2025-01-07

-- =============================================
-- 1. 添加公户子项字段
-- =============================================
ALTER TABLE profit_distributions ADD COLUMN IF NOT EXISTS marketing_ratio DECIMAL(5,2) DEFAULT 10;
ALTER TABLE profit_distributions ADD COLUMN IF NOT EXISTS dividend_ratio DECIMAL(5,2) DEFAULT 15;
ALTER TABLE profit_distributions ADD COLUMN IF NOT EXISTS development_ratio DECIMAL(5,2) DEFAULT 15;

-- =============================================
-- 2. 更新现有数据（如果有）
-- =============================================
UPDATE profit_distributions 
SET 
  marketing_ratio = 10,
  dividend_ratio = 15,
  development_ratio = 15
WHERE category = 'public';

-- =============================================
-- 3. 创建或更新营销、分红、开发费用记录
-- =============================================
INSERT INTO profit_distributions (category, ratio, allocated_amount, marketing_ratio, dividend_ratio, development_ratio) 
VALUES 
  ('marketing', 10, 0, 0, 0, 0),
  ('dividend', 15, 0, 0, 0, 0),
  ('development', 15, 0, 0, 0, 0)
ON CONFLICT (category) 
DO UPDATE SET 
  ratio = EXCLUDED.ratio,
  updated_at = CURRENT_TIMESTAMP;

-- =============================================
-- 4. 查看更新后的数据
-- =============================================
SELECT 
  category as "分配对象",
  ratio as "收益占比(%)",
  allocated_amount as "已分配金额($)",
  marketing_ratio as "营销占比(%)",
  dividend_ratio as "分红占比(%)",
  development_ratio as "开发占比(%)",
  CASE 
    WHEN category = 'public' THEN '🏢 公户'
    WHEN category = 'marketing' THEN '  ├─ 营销费用'
    WHEN category = 'dividend' THEN '  ├─ 分红'
    WHEN category = 'development' THEN '  └─ 开发费用'
    WHEN category = 'zhixing' THEN '📚 知行'
    WHEN category = 'zijun' THEN '👤 子俊'
  END as "显示名称"
FROM profit_distributions
ORDER BY 
  CASE category
    WHEN 'public' THEN 1
    WHEN 'marketing' THEN 2
    WHEN 'dividend' THEN 3
    WHEN 'development' THEN 4
    WHEN 'zhixing' THEN 5
    WHEN 'zijun' THEN 6
  END;

-- =============================================
-- 完成提示
-- =============================================
SELECT '🎉 收益分配字段更新成功！' as status;
