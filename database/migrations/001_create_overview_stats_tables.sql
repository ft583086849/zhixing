-- =============================================
-- 数据概览页面优化 - 创建统计表
-- 创建时间：2025-08-16
-- 目的：优化AdminOverview页面性能，避免实时查询
-- =============================================

-- 1. 创建overview_stats表（核心统计表）
CREATE TABLE IF NOT EXISTS overview_stats (
  id SERIAL PRIMARY KEY,
  
  -- 统计维度
  stat_type VARCHAR(20) NOT NULL,        -- 'realtime'实时 / 'daily'每日 / 'period'周期
  stat_period VARCHAR(20) NOT NULL,      -- 'all' / 'today' / 'week' / 'month' / 'year' / 'custom'
  start_date DATE,                       -- 统计开始日期
  end_date DATE,                         -- 统计结束日期
  
  -- 订单统计字段
  total_orders INTEGER DEFAULT 0,                    -- 总订单数（所有状态）
  today_orders INTEGER DEFAULT 0,                    -- 今日新增订单
  pending_payment_orders INTEGER DEFAULT 0,          -- 待付款确认订单数
  confirmed_payment_orders INTEGER DEFAULT 0,        -- 已付款确认订单数
  pending_config_orders INTEGER DEFAULT 0,           -- 待配置确认订单数  
  confirmed_config_orders INTEGER DEFAULT 0,         -- 已配置确认订单数
  rejected_orders INTEGER DEFAULT 0,                 -- 已拒绝订单数
  active_orders INTEGER DEFAULT 0,                   -- 活跃订单数
  
  -- 金额统计字段（美元）
  total_amount DECIMAL(10,2) DEFAULT 0,             -- 总收入金额
  today_amount DECIMAL(10,2) DEFAULT 0,             -- 今日收入
  confirmed_amount DECIMAL(10,2) DEFAULT 0,         -- 已确认订单金额
  
  -- 佣金统计字段
  total_commission DECIMAL(10,2) DEFAULT 0,         -- 应返佣金总额
  paid_commission DECIMAL(10,2) DEFAULT 0,          -- 已返佣金总额
  pending_commission DECIMAL(10,2) DEFAULT 0,       -- 待返佣金总额
  
  -- 销售层级统计
  primary_sales_count INTEGER DEFAULT 0,            -- 一级销售数量
  secondary_sales_count INTEGER DEFAULT 0,          -- 二级销售数量
  independent_sales_count INTEGER DEFAULT 0,        -- 独立销售数量
  active_sales_count INTEGER DEFAULT 0,             -- 活跃销售数（有订单的）
  
  -- 时长分布统计
  free_trial_orders INTEGER DEFAULT 0,              -- 7天免费试用订单数
  one_month_orders INTEGER DEFAULT 0,               -- 1个月订单数
  three_month_orders INTEGER DEFAULT 0,             -- 3个月订单数
  six_month_orders INTEGER DEFAULT 0,               -- 6个月订单数
  yearly_orders INTEGER DEFAULT 0,                  -- 年费订单数
  
  -- 时长占比（百分比）
  free_trial_percentage DECIMAL(5,2) DEFAULT 0,     -- 7天占比
  one_month_percentage DECIMAL(5,2) DEFAULT 0,      -- 1个月占比
  three_month_percentage DECIMAL(5,2) DEFAULT 0,    -- 3个月占比
  six_month_percentage DECIMAL(5,2) DEFAULT 0,      -- 6个月占比
  yearly_percentage DECIMAL(5,2) DEFAULT 0,         -- 年费占比
  
  -- 元数据
  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  calculation_duration_ms INTEGER,                  -- 计算耗时（毫秒）
  data_version INTEGER DEFAULT 1,                   -- 数据版本号
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_overview_stats_unique 
  ON overview_stats(stat_type, stat_period, COALESCE(start_date, '1900-01-01'::date), COALESCE(end_date, '9999-12-31'::date));
CREATE INDEX IF NOT EXISTS idx_overview_stats_calculated 
  ON overview_stats(last_calculated_at);

-- 2. 创建sales_ranking表（销售排行榜）
CREATE TABLE IF NOT EXISTS sales_ranking (
  id SERIAL PRIMARY KEY,
  
  -- 排行榜维度
  ranking_type VARCHAR(20) NOT NULL,      -- 'amount'金额 / 'orders'订单数 / 'commission'佣金
  ranking_period VARCHAR(20) NOT NULL,    -- 'all' / 'today' / 'week' / 'month' / 'year'
  rank_position INTEGER NOT NULL,         -- 排名位置 1-N
  
  -- 销售信息
  sales_id INTEGER,
  sales_code VARCHAR(50),
  sales_wechat VARCHAR(100),
  sales_type VARCHAR(20),                 -- 'primary' / 'secondary' / 'independent'
  
  -- 归属信息（二级销售显示所属一级）
  primary_sales_id INTEGER,
  primary_sales_wechat VARCHAR(100),
  
  -- 业绩数据
  total_orders INTEGER DEFAULT 0,         -- 订单数量
  total_amount DECIMAL(10,2) DEFAULT 0,   -- 销售金额
  commission_amount DECIMAL(10,2) DEFAULT 0, -- 佣金金额
  sales_percentage DECIMAL(5,2) DEFAULT 0,   -- 占总销售额百分比
  
  -- 时间范围
  start_date DATE,
  end_date DATE,
  
  -- 元数据
  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sales_ranking 
  ON sales_ranking(ranking_type, ranking_period, rank_position);
CREATE INDEX IF NOT EXISTS idx_sales_ranking_sales 
  ON sales_ranking(sales_code);

-- 3. 创建7天免费试用转化统计表
CREATE TABLE IF NOT EXISTS trial_conversion_stats (
  id SERIAL PRIMARY KEY,
  
  -- 统计维度
  stat_period VARCHAR(20) NOT NULL,              -- 时间范围
  start_date DATE,                               -- 基于付费订单创建时间
  end_date DATE,
  
  -- 销售维度筛选
  sales_type VARCHAR(20),                        -- 销售类型筛选
  sales_code VARCHAR(50),                        -- 具体销售筛选
  
  -- 核心转化统计
  total_trial_orders INTEGER DEFAULT 0,          -- 7天免费试用订单总数
  converted_orders INTEGER DEFAULT 0,            -- 成功转化为付费的订单数
  conversion_rate DECIMAL(5,2) DEFAULT 0,        -- 转化率（百分比）
  
  -- 转化金额统计（美元）
  total_converted_amount DECIMAL(10,2) DEFAULT 0,
  avg_converted_amount DECIMAL(10,2) DEFAULT 0,
  
  -- 按销售类型分布
  primary_sales_conversions INTEGER DEFAULT 0,
  secondary_sales_conversions INTEGER DEFAULT 0,
  independent_sales_conversions INTEGER DEFAULT 0,
  
  -- 按时长分布（转化后购买的时长）
  converted_to_1month INTEGER DEFAULT 0,
  converted_to_3months INTEGER DEFAULT 0,
  converted_to_6months INTEGER DEFAULT 0,
  converted_to_1year INTEGER DEFAULT 0,
  
  -- 时间分析
  avg_conversion_days DECIMAL(5,2) DEFAULT 0,
  
  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trial_conversion_stats 
  ON trial_conversion_stats(stat_period, sales_type, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trial_conversion_sales 
  ON trial_conversion_stats(sales_code);

-- 4. 创建转化明细表
CREATE TABLE IF NOT EXISTS trial_conversion_details (
  id SERIAL PRIMARY KEY,
  
  -- 试用订单信息
  trial_order_id INTEGER NOT NULL,
  trial_customer_wechat VARCHAR(100),
  trial_tradingview_username VARCHAR(100),
  trial_created_at TIMESTAMP,
  
  -- 付费订单信息
  paid_order_id INTEGER,
  paid_created_at TIMESTAMP,
  paid_amount DECIMAL(10,2),
  paid_duration VARCHAR(20),
  
  -- 销售信息
  sales_code VARCHAR(50),
  sales_type VARCHAR(20),
  primary_sales_code VARCHAR(50),  -- 仅二级销售有值
  
  -- 转化分析
  conversion_days INTEGER,
  is_converted BOOLEAN DEFAULT FALSE,
  conversion_status VARCHAR(20),  -- 'pending' / 'converted' / 'expired'
  
  converted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_conversion_details_trial 
  ON trial_conversion_details(trial_order_id);
CREATE INDEX IF NOT EXISTS idx_conversion_details_paid 
  ON trial_conversion_details(paid_order_id);
CREATE INDEX IF NOT EXISTS idx_conversion_details_sales 
  ON trial_conversion_details(sales_code);
CREATE INDEX IF NOT EXISTS idx_conversion_details_status 
  ON trial_conversion_details(conversion_status);

-- 5. 插入初始数据（全部时间范围的统计）
INSERT INTO overview_stats (stat_type, stat_period, start_date, end_date)
VALUES ('realtime', 'all', NULL, NULL)
ON CONFLICT DO NOTHING;

-- 6. 创建更新触发器函数（可选，用于自动更新updated_at）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为各表创建触发器
CREATE TRIGGER update_overview_stats_updated_at 
  BEFORE UPDATE ON overview_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trial_conversion_stats_updated_at 
  BEFORE UPDATE ON trial_conversion_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trial_conversion_details_updated_at 
  BEFORE UPDATE ON trial_conversion_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 说明：
-- 1. 执行此脚本创建所需的统计表
-- 2. 这些表不会影响现有系统运行
-- 3. 可以通过环境变量控制是否使用新表
-- 4. 支持随时回滚（DROP TABLE）
-- =============================================