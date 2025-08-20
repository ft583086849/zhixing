-- =============================================
-- 创建 customers_optimized 表
-- 用于存储客户聚合数据，提升查询性能
-- =============================================

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS customers_optimized CASCADE;

-- 创建客户优化表
CREATE TABLE customers_optimized (
  -- 主键
  id SERIAL PRIMARY KEY,
  
  -- 客户标识（联合唯一）
  customer_wechat VARCHAR(100),
  tradingview_username VARCHAR(100),
  
  -- 销售关联信息
  sales_code VARCHAR(50),
  sales_wechat_name VARCHAR(100),
  sales_type VARCHAR(20), -- primary/secondary/independent
  primary_sales_id INT,
  primary_sales_name VARCHAR(100),
  secondary_sales_id INT,
  
  -- 统计信息（实时更新）
  total_orders INT DEFAULT 0,
  valid_orders INT DEFAULT 0, -- 已支付订单数
  total_amount DECIMAL(10,2) DEFAULT 0,
  actual_payment_amount DECIMAL(10,2) DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  
  -- 最新订单信息
  latest_order_id INT,
  latest_order_time TIMESTAMP,
  latest_order_status VARCHAR(50),
  latest_order_amount DECIMAL(10,2),
  latest_expiry_time TIMESTAMP,
  latest_duration VARCHAR(50),
  
  -- 首单信息
  first_order_id INT,
  first_order_time TIMESTAMP,
  first_order_amount DECIMAL(10,2),
  
  -- 催单相关
  is_reminded BOOLEAN DEFAULT FALSE,
  reminder_time TIMESTAMP,
  reminder_count INT DEFAULT 0,
  
  -- 客户状态
  customer_status VARCHAR(50) DEFAULT 'active', -- active/inactive/expired
  days_since_last_order INT,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  UNIQUE(customer_wechat, tradingview_username),
  INDEX idx_sales_code (sales_code),
  INDEX idx_latest_order_time (latest_order_time),
  INDEX idx_expiry_time (latest_expiry_time),
  INDEX idx_customer_status (customer_status)
);

-- 添加注释
COMMENT ON TABLE customers_optimized IS '客户聚合数据表，用于客户管理页面';
COMMENT ON COLUMN customers_optimized.customer_wechat IS '客户微信号';
COMMENT ON COLUMN customers_optimized.tradingview_username IS 'TradingView用户名';
COMMENT ON COLUMN customers_optimized.total_orders IS '总订单数';
COMMENT ON COLUMN customers_optimized.valid_orders IS '有效订单数（已支付）';
COMMENT ON COLUMN customers_optimized.latest_expiry_time IS '最新订单到期时间，用于催单判断';