-- =====================================================
-- 创建佣金率历史表
-- 用于记录所有销售佣金率的变更历史（从现在开始）
-- =====================================================

-- 创建表
CREATE TABLE IF NOT EXISTS commission_rate_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_code VARCHAR(50) NOT NULL,
  sales_type VARCHAR(20), -- primary/secondary/independent
  old_rate DECIMAL(5,4), -- 旧佣金率（0.25 = 25%）
  new_rate DECIMAL(5,4) NOT NULL, -- 新佣金率
  effective_date TIMESTAMP NOT NULL DEFAULT NOW(), -- 生效时间
  changed_by VARCHAR(100), -- 修改人
  change_reason TEXT, -- 修改原因
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_commission_history_sales ON commission_rate_history(sales_code, effective_date DESC);
CREATE INDEX idx_commission_history_date ON commission_rate_history(effective_date);

-- 添加注释
COMMENT ON TABLE commission_rate_history IS '佣金率变更历史记录表';
COMMENT ON COLUMN commission_rate_history.sales_code IS '销售代码';
COMMENT ON COLUMN commission_rate_history.sales_type IS '销售类型：primary/secondary/independent';
COMMENT ON COLUMN commission_rate_history.old_rate IS '变更前的佣金率';
COMMENT ON COLUMN commission_rate_history.new_rate IS '变更后的佣金率';
COMMENT ON COLUMN commission_rate_history.effective_date IS '新佣金率生效时间';
COMMENT ON COLUMN commission_rate_history.changed_by IS '修改人';
COMMENT ON COLUMN commission_rate_history.change_reason IS '修改原因';

-- 注意：不需要初始化历史数据，当前线上的佣金率都是正确的
-- 从现在开始记录所有的佣金率变更即可