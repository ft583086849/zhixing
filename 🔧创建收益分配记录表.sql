-- 🔧 创建收益分配记录表
-- 执行位置：Supabase SQL Editor
-- 时间：2025-01-07

-- =============================================
-- 1. 创建收益分配记录表
-- =============================================
CREATE TABLE IF NOT EXISTS profit_distributions (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL UNIQUE, -- 'public', 'zhixing', 'zijun'
  ratio DECIMAL(5,2) DEFAULT 0, -- 收益占比（百分比）
  allocated_amount DECIMAL(10,2) DEFAULT 0, -- 已分配金额（美元）
  last_allocated_at TIMESTAMP, -- 最后分配时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. 插入初始数据
-- =============================================
INSERT INTO profit_distributions (category, ratio, allocated_amount) 
VALUES 
  ('public', 40, 0),
  ('zhixing', 35, 0),
  ('zijun', 25, 0)
ON CONFLICT (category) DO NOTHING;

-- =============================================
-- 3. 创建更新触发器
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profit_distributions_updated_at 
BEFORE UPDATE ON profit_distributions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. 创建分配历史记录表（可选）
-- =============================================
CREATE TABLE IF NOT EXISTS profit_distribution_history (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL, -- 本次分配金额
  total_allocated DECIMAL(10,2), -- 累计已分配
  operator VARCHAR(100), -- 操作人
  remark TEXT, -- 备注
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_profit_history_category ON profit_distribution_history(category);
CREATE INDEX idx_profit_history_created ON profit_distribution_history(created_at);

-- =============================================
-- 5. 查看初始数据
-- =============================================
SELECT 
  category as "分配对象",
  ratio as "收益占比(%)",
  allocated_amount as "已分配金额($)",
  CASE 
    WHEN category = 'public' THEN '🏢 公户'
    WHEN category = 'zhixing' THEN '📚 知行'
    WHEN category = 'zijun' THEN '👤 子俊'
  END as "显示名称"
FROM profit_distributions
ORDER BY category;

-- =============================================
-- 6. 创建RLS策略（如果需要）
-- =============================================
ALTER TABLE profit_distributions ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取
CREATE POLICY "Allow read profit distributions" 
ON profit_distributions FOR SELECT 
USING (true);

-- 只允许管理员更新
CREATE POLICY "Allow admin update profit distributions" 
ON profit_distributions FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================
-- 完成提示
-- =============================================
SELECT '🎉 收益分配记录表创建成功！' as status;
