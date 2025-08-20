-- 创建缺失的统计表

-- 1. 销售排行榜表
CREATE TABLE IF NOT EXISTS sales_ranking (
  id SERIAL PRIMARY KEY,
  period VARCHAR(20) NOT NULL, -- all/today/week/month/year
  rank_position INTEGER NOT NULL,
  sales_id INTEGER,
  sales_type VARCHAR(20), -- primary/secondary/independent
  sales_code VARCHAR(50),
  sales_name VARCHAR(100),
  order_count INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period, rank_position)
);

-- 2. 试用转化统计表
CREATE TABLE IF NOT EXISTS trial_conversion_stats (
  id SERIAL PRIMARY KEY,
  period VARCHAR(20) NOT NULL,
  trial_orders INTEGER DEFAULT 0,
  converted_orders INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  -- 按销售类型统计
  primary_conversions INTEGER DEFAULT 0,
  secondary_conversions INTEGER DEFAULT 0,
  independent_conversions INTEGER DEFAULT 0,
  -- 按时间维度统计
  avg_conversion_days DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period)
);

-- 3. 试用转化明细表
CREATE TABLE IF NOT EXISTS trial_conversion_details (
  id SERIAL PRIMARY KEY,
  trial_order_id INTEGER,
  paid_order_id INTEGER,
  sales_id INTEGER,
  sales_type VARCHAR(20),
  trial_start_date DATE,
  conversion_date DATE,
  days_to_convert INTEGER,
  paid_duration VARCHAR(20),
  paid_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入初始数据
INSERT INTO sales_ranking (period, rank_position, sales_name, total_amount, order_count)
VALUES 
  ('all', 1, 'WML792355703', 2828.00, 19),
  ('all', 2, 'fl261247', 1588.00, 1),
  ('all', 3, 'Yi111111____', 376.00, 16),
  ('all', 4, '张子俊', 376.00, 2),
  ('all', 5, 'Liangjunhao889', 376.00, 4);

INSERT INTO trial_conversion_stats (period, trial_orders, converted_orders, conversion_rate)
VALUES ('all', 200, 199, 99.50);