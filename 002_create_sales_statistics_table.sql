-- 创建销售统计表，用于优化AdminSales页面性能
-- 预计算销售相关的统计数据，避免实时JOIN查询

-- 创建表
CREATE TABLE IF NOT EXISTS sales_statistics (
  id SERIAL PRIMARY KEY,
  
  -- 销售标识
  sales_id INTEGER NOT NULL,
  sales_type VARCHAR(20) NOT NULL, -- 'primary' or 'secondary' or 'independent'
  sales_code VARCHAR(100),
  wechat_name VARCHAR(255),
  
  -- 层级关系
  primary_sales_id INTEGER, -- 上级销售ID（二级销售时）
  secondary_sales_count INTEGER DEFAULT 0, -- 管理的二级销售数量（一级销售时）
  
  -- 订单统计
  total_orders INTEGER DEFAULT 0,
  valid_orders INTEGER DEFAULT 0, -- 有效订单（排除rejected）
  confirmed_orders INTEGER DEFAULT 0, -- 已确认配置的订单
  
  -- 金额统计
  total_amount DECIMAL(10, 2) DEFAULT 0.00, -- 总订单金额
  confirmed_amount DECIMAL(10, 2) DEFAULT 0.00, -- 已确认订单金额
  
  -- 佣金相关
  commission_rate DECIMAL(5, 4) DEFAULT 0.25, -- 佣金率（存储为小数，如0.25表示25%）
  commission_amount DECIMAL(10, 2) DEFAULT 0.00, -- 应返佣金额
  paid_commission DECIMAL(10, 2) DEFAULT 0.00, -- 已返佣金额
  pending_commission DECIMAL(10, 2) DEFAULT 0.00, -- 待返佣金额
  
  -- 一级销售专用字段
  primary_direct_amount DECIMAL(10, 2) DEFAULT 0.00, -- 一级直销订单金额
  primary_direct_commission DECIMAL(10, 2) DEFAULT 0.00, -- 一级直销佣金
  secondary_orders_amount DECIMAL(10, 2) DEFAULT 0.00, -- 下属二级销售订单金额
  secondary_share_commission DECIMAL(10, 2) DEFAULT 0.00, -- 从二级销售获得的分成
  secondary_avg_rate DECIMAL(5, 4) DEFAULT 0.00, -- 平均二级佣金率
  
  -- 支付信息（从原表冗余，便于查询）
  payment_method VARCHAR(50),
  payment_account VARCHAR(500),
  chain_name VARCHAR(100),
  last_commission_paid_at TIMESTAMP,
  
  -- 元数据
  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  calculation_duration_ms INTEGER,
  data_version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_sales_statistics_sales_id ON sales_statistics(sales_id);
CREATE INDEX idx_sales_statistics_sales_type ON sales_statistics(sales_type);
CREATE INDEX idx_sales_statistics_sales_code ON sales_statistics(sales_code);
CREATE INDEX idx_sales_statistics_primary_sales_id ON sales_statistics(primary_sales_id);
CREATE INDEX idx_sales_statistics_commission_amount ON sales_statistics(commission_amount);
CREATE INDEX idx_sales_statistics_pending_commission ON sales_statistics(pending_commission);

-- 创建唯一约束
CREATE UNIQUE INDEX idx_sales_statistics_unique ON sales_statistics(sales_id, sales_type);

-- 创建更新触发器函数
CREATE OR REPLACE FUNCTION update_sales_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_sales_statistics_updated_at
  BEFORE UPDATE ON sales_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_statistics_updated_at();

-- 创建视图：合并一级和二级销售的统计数据
CREATE OR REPLACE VIEW sales_statistics_view AS
SELECT 
  -- 基本信息
  ss.id,
  ss.sales_id,
  ss.sales_type,
  ss.sales_code,
  ss.wechat_name,
  
  -- 层级关系
  ss.primary_sales_id,
  ps.wechat_name AS primary_sales_name,
  ss.secondary_sales_count,
  
  -- 订单统计
  ss.total_orders,
  ss.valid_orders,
  ss.confirmed_orders,
  
  -- 金额统计
  ss.total_amount,
  ss.confirmed_amount,
  
  -- 佣金相关
  ss.commission_rate,
  ss.commission_amount,
  ss.paid_commission,
  ss.pending_commission,
  
  -- 一级销售专用
  ss.primary_direct_amount,
  ss.primary_direct_commission,
  ss.secondary_orders_amount,
  ss.secondary_share_commission,
  ss.secondary_avg_rate,
  
  -- 支付信息
  ss.payment_method,
  ss.payment_account,
  ss.chain_name,
  ss.last_commission_paid_at,
  
  -- 元数据
  ss.last_calculated_at,
  ss.created_at,
  ss.updated_at
FROM sales_statistics ss
LEFT JOIN primary_sales ps ON ss.primary_sales_id = ps.id
ORDER BY ss.commission_amount DESC;

-- 添加注释
COMMENT ON TABLE sales_statistics IS '销售统计表：预计算的销售数据，用于优化AdminSales页面性能';
COMMENT ON COLUMN sales_statistics.sales_id IS '销售ID（primary_sales或secondary_sales表的ID）';
COMMENT ON COLUMN sales_statistics.sales_type IS '销售类型：primary（一级）、secondary（二级）、independent（独立）';
COMMENT ON COLUMN sales_statistics.commission_rate IS '佣金率（小数格式：0.25表示25%）';
COMMENT ON COLUMN sales_statistics.commission_amount IS '应返佣金额（基于confirmed_amount计算）';
COMMENT ON COLUMN sales_statistics.primary_direct_amount IS '一级销售自己的直销订单金额';
COMMENT ON COLUMN sales_statistics.secondary_orders_amount IS '一级销售下属的二级销售订单总额';
COMMENT ON COLUMN sales_statistics.secondary_share_commission IS '一级销售从二级销售订单获得的分成';