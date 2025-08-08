-- 创建收益分配配置表
-- 用于存储财务统计页面的收益分配比例

-- 1. 创建表
CREATE TABLE IF NOT EXISTS profit_distribution (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  public_ratio DECIMAL(5,2) DEFAULT 40.00,     -- 公户占比（百分比）
  zhixing_ratio DECIMAL(5,2) DEFAULT 35.00,    -- 知行占比（百分比）
  zijun_ratio DECIMAL(5,2) DEFAULT 25.00,      -- 子俊占比（百分比）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,                             -- 创建者
  is_active BOOLEAN DEFAULT true               -- 是否激活（当前使用的配置）
);

-- 2. 添加注释
COMMENT ON TABLE profit_distribution IS '收益分配配置表';
COMMENT ON COLUMN profit_distribution.public_ratio IS '公户占比（百分比）';
COMMENT ON COLUMN profit_distribution.zhixing_ratio IS '知行占比（百分比）';
COMMENT ON COLUMN profit_distribution.zijun_ratio IS '子俊占比（百分比）';
COMMENT ON COLUMN profit_distribution.created_at IS '创建时间';
COMMENT ON COLUMN profit_distribution.updated_at IS '更新时间';
COMMENT ON COLUMN profit_distribution.created_by IS '创建者';
COMMENT ON COLUMN profit_distribution.is_active IS '是否为当前激活配置';

-- 3. 创建索引
CREATE INDEX idx_profit_distribution_active ON profit_distribution(is_active);
CREATE INDEX idx_profit_distribution_created_at ON profit_distribution(created_at DESC);

-- 4. 插入默认配置
INSERT INTO profit_distribution (
  public_ratio, 
  zhixing_ratio, 
  zijun_ratio, 
  created_by, 
  is_active
) VALUES (
  40.00,
  35.00,
  25.00,
  'system',
  true
);

-- 5. 创建更新触发器（自动更新updated_at）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profit_distribution_updated_at
BEFORE UPDATE ON profit_distribution
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. 查看创建的表结构
SELECT * FROM profit_distribution;

-- 使用说明：
-- 1. 在Supabase SQL编辑器中运行此脚本
-- 2. 确认表创建成功
-- 3. 默认配置：公户40%，知行35%，子俊25%
