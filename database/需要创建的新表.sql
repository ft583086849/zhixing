-- ================================================
-- 需要创建的新表清单
-- 创建时间：2024-12-19
-- 说明：这些都是全新的表，不会影响现有系统
-- ================================================

-- ================================================
-- 1. 用户系统表（核心）
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  wechat_name VARCHAR(100) UNIQUE NOT NULL,  -- 微信名（唯一）
  password_hash VARCHAR(255) NOT NULL,  -- 密码哈希
  
  -- 基本信息
  email VARCHAR(255),  -- 邮箱（可选）
  phone VARCHAR(50),  -- 手机号（可选）
  avatar_url TEXT,  -- 头像
  
  -- 销售信息
  is_sales BOOLEAN DEFAULT FALSE,  -- 是否是销售
  sales_type VARCHAR(20),  -- primary/secondary/independent_secondary
  sales_code VARCHAR(50),  -- 销售代码
  parent_sales_id INTEGER,  -- 上级销售ID
  commission_rate DECIMAL(5,2),  -- 个人返佣率
  
  -- 收款信息
  payment_qr_code TEXT,  -- 收款二维码
  payment_info TEXT,  -- 收款信息详情
  payment_account VARCHAR(255),  -- 收款账号
  
  -- 链接管理
  recruit_link VARCHAR(255),  -- 招募链接
  purchase_link VARCHAR(255),  -- 购买链接
  
  -- 统计信息
  total_orders INTEGER DEFAULT 0,  -- 总订单数
  total_commission DECIMAL(10,2) DEFAULT 0,  -- 总佣金
  total_recruited INTEGER DEFAULT 0,  -- 招募人数
  
  -- 系统信息
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  enabled BOOLEAN DEFAULT TRUE,  -- 账号状态
  need_reset_password BOOLEAN DEFAULT FALSE,  -- 需要重置密码
  last_password_change TIMESTAMP,  -- 最后修改密码时间
  
  -- 安全相关
  login_attempts INTEGER DEFAULT 0,  -- 登录尝试次数
  locked_until TIMESTAMP,  -- 锁定到期时间
  last_ip VARCHAR(45),  -- 最后登录IP
  
  FOREIGN KEY (parent_sales_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX idx_users_wechat ON users(wechat_name);
CREATE INDEX idx_users_sales ON users(is_sales, sales_type);
CREATE INDEX idx_users_sales_code ON users(sales_code);
CREATE INDEX idx_users_parent ON users(parent_sales_id);
CREATE INDEX idx_users_enabled ON users(enabled);

-- ================================================
-- 2. 用户会话表
-- ================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- ================================================
-- 3. 数据概览统计表（已创建的overview_stats）
-- ================================================
CREATE TABLE IF NOT EXISTS overview_stats (
  id SERIAL PRIMARY KEY,
  stat_type VARCHAR(50),  -- 'realtime', 'daily', 'monthly'
  stat_period VARCHAR(50),  -- 'all', 'today', 'week', 'month', 'custom'
  start_date DATE,
  end_date DATE,
  
  -- 订单统计
  total_orders INTEGER DEFAULT 0,
  valid_orders INTEGER DEFAULT 0,
  rejected_orders INTEGER DEFAULT 0,
  pending_payment_orders INTEGER DEFAULT 0,
  pending_config_orders INTEGER DEFAULT 0,
  confirmed_config_orders INTEGER DEFAULT 0,
  
  -- 金额统计
  total_amount DECIMAL(10,2) DEFAULT 0,
  confirmed_amount DECIMAL(10,2) DEFAULT 0,
  pending_amount DECIMAL(10,2) DEFAULT 0,
  
  -- 佣金统计
  total_commission DECIMAL(10,2) DEFAULT 0,
  paid_commission DECIMAL(10,2) DEFAULT 0,
  pending_commission DECIMAL(10,2) DEFAULT 0,
  
  -- 销售统计
  primary_sales_count INTEGER DEFAULT 0,
  secondary_sales_count INTEGER DEFAULT 0,
  independent_sales_count INTEGER DEFAULT 0,
  active_sales_count INTEGER DEFAULT 0,
  
  -- 订单时长分布
  free_trial_orders INTEGER DEFAULT 0,
  one_month_orders INTEGER DEFAULT 0,
  three_month_orders INTEGER DEFAULT 0,
  six_month_orders INTEGER DEFAULT 0,
  yearly_orders INTEGER DEFAULT 0,
  
  -- 百分比
  free_trial_percentage DECIMAL(5,2) DEFAULT 0,
  one_month_percentage DECIMAL(5,2) DEFAULT 0,
  three_month_percentage DECIMAL(5,2) DEFAULT 0,
  six_month_percentage DECIMAL(5,2) DEFAULT 0,
  yearly_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- 元数据
  last_calculated_at TIMESTAMP DEFAULT NOW(),
  calculation_duration_ms INTEGER,
  
  UNIQUE(stat_type, stat_period, start_date, end_date)
);

CREATE INDEX idx_overview_stats_type ON overview_stats(stat_type, stat_period);
CREATE INDEX idx_overview_stats_date ON overview_stats(last_calculated_at DESC);

-- ================================================
-- 4. 销售统计表（已创建的sales_statistics）
-- ================================================
CREATE TABLE IF NOT EXISTS sales_statistics (
  id SERIAL PRIMARY KEY,
  sales_id INTEGER NOT NULL,
  sales_type VARCHAR(20) NOT NULL,  -- 'primary', 'secondary', 'independent'
  sales_code VARCHAR(50) NOT NULL,
  
  -- 订单统计
  total_orders INTEGER DEFAULT 0,
  valid_orders INTEGER DEFAULT 0,
  pending_orders INTEGER DEFAULT 0,
  rejected_orders INTEGER DEFAULT 0,
  
  -- 金额统计
  total_amount DECIMAL(10,2) DEFAULT 0,
  confirmed_amount DECIMAL(10,2) DEFAULT 0,
  pending_amount DECIMAL(10,2) DEFAULT 0,
  
  -- 佣金统计
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(10,2) DEFAULT 0,
  paid_commission DECIMAL(10,2) DEFAULT 0,
  pending_commission DECIMAL(10,2) DEFAULT 0,
  
  -- 客户统计
  total_customers INTEGER DEFAULT 0,
  new_customers_month INTEGER DEFAULT 0,
  
  -- 转化统计
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  recruited_count INTEGER DEFAULT 0,
  
  -- 时间统计
  first_order_date DATE,
  last_order_date DATE,
  last_updated TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(sales_id, sales_type)
);

CREATE INDEX idx_sales_stats_code ON sales_statistics(sales_code);
CREATE INDEX idx_sales_stats_type ON sales_statistics(sales_type);
CREATE INDEX idx_sales_stats_updated ON sales_statistics(last_updated DESC);

-- ================================================
-- 5. 佣金记录表（重要）
-- ================================================
CREATE TABLE IF NOT EXISTS commission_records (
  id SERIAL PRIMARY KEY,
  
  -- 订单信息
  order_id INTEGER NOT NULL,
  order_number VARCHAR(50),
  order_amount DECIMAL(10,2),
  
  -- 销售信息
  sales_id INTEGER NOT NULL,
  sales_type VARCHAR(20) NOT NULL,  -- 'primary', 'secondary', 'independent'
  sales_code VARCHAR(50) NOT NULL,
  sales_name VARCHAR(100),
  user_id INTEGER,  -- 预留，关联users表
  
  -- 返佣信息
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  
  -- 状态管理
  status VARCHAR(20) DEFAULT 'pending',  -- pending/approved/paid/cancelled
  approved_at TIMESTAMP,
  approved_by INTEGER,
  paid_at TIMESTAMP,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  payment_proof TEXT,
  
  -- 层级信息
  is_secondary BOOLEAN DEFAULT FALSE,
  parent_sales_id INTEGER,
  parent_commission_amount DECIMAL(10,2),
  
  -- 特殊标记
  is_customer_upgrade BOOLEAN DEFAULT FALSE,  -- 客户转化订单
  source_type VARCHAR(50),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commission_order ON commission_records(order_id);
CREATE INDEX idx_commission_sales ON commission_records(sales_id, sales_type);
CREATE INDEX idx_commission_status ON commission_records(status);
CREATE INDEX idx_commission_date ON commission_records(created_at DESC);
CREATE INDEX idx_commission_paid ON commission_records(paid_at DESC) WHERE paid_at IS NOT NULL;

-- ================================================
-- 6. 财务日统计表
-- ================================================
CREATE TABLE IF NOT EXISTS finance_daily_stats (
  stat_date DATE PRIMARY KEY,
  
  -- 订单统计
  total_orders INTEGER DEFAULT 0,
  valid_orders INTEGER DEFAULT 0,
  confirmed_orders INTEGER DEFAULT 0,
  rejected_orders INTEGER DEFAULT 0,
  
  -- 收入统计
  total_revenue DECIMAL(10,2) DEFAULT 0,
  confirmed_revenue DECIMAL(10,2) DEFAULT 0,
  pending_revenue DECIMAL(10,2) DEFAULT 0,
  refunded_amount DECIMAL(10,2) DEFAULT 0,
  
  -- 佣金统计
  total_commission DECIMAL(10,2) DEFAULT 0,
  paid_commission DECIMAL(10,2) DEFAULT 0,
  pending_commission DECIMAL(10,2) DEFAULT 0,
  
  -- 利润统计
  gross_profit DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(10,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  
  -- 支付方式分布
  alipay_amount DECIMAL(10,2) DEFAULT 0,
  wechat_amount DECIMAL(10,2) DEFAULT 0,
  bank_amount DECIMAL(10,2) DEFAULT 0,
  
  -- 销售业绩分布
  primary_sales_amount DECIMAL(10,2) DEFAULT 0,
  secondary_sales_amount DECIMAL(10,2) DEFAULT 0,
  direct_sales_amount DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_finance_daily_date ON finance_daily_stats(stat_date DESC);

-- ================================================
-- 7. 财务月统计表
-- ================================================
CREATE TABLE IF NOT EXISTS finance_monthly_stats (
  stat_month VARCHAR(7) PRIMARY KEY,  -- YYYY-MM格式
  
  -- 汇总统计
  total_days INTEGER,
  working_days INTEGER,
  total_orders INTEGER,
  total_revenue DECIMAL(10,2),
  total_commission DECIMAL(10,2),
  total_profit DECIMAL(10,2),
  
  -- 平均统计
  avg_daily_revenue DECIMAL(10,2),
  avg_order_value DECIMAL(10,2),
  avg_commission_rate DECIMAL(5,2),
  
  -- 增长统计
  revenue_growth_rate DECIMAL(5,2),  -- 环比
  order_growth_rate DECIMAL(5,2),
  yoy_growth_rate DECIMAL(5,2),  -- 同比
  
  -- 目标达成
  revenue_target DECIMAL(10,2),
  achievement_rate DECIMAL(5,2),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_finance_monthly ON finance_monthly_stats(stat_month DESC);

-- ================================================
-- 8. 用户转化统计表
-- ================================================
CREATE TABLE IF NOT EXISTS user_conversion_stats (
  id SERIAL PRIMARY KEY,
  stat_date DATE NOT NULL,
  
  -- 用户统计
  new_users INTEGER DEFAULT 0,  -- 新注册用户
  active_users INTEGER DEFAULT 0,  -- 活跃用户
  paying_users INTEGER DEFAULT 0,  -- 付费用户
  
  -- 转化统计
  users_to_sales INTEGER DEFAULT 0,  -- 用户转销售数
  conversion_rate DECIMAL(5,2) DEFAULT 0,  -- 转化率
  
  -- 分类统计
  new_primary_sales INTEGER DEFAULT 0,  -- 新增一级销售
  new_secondary_sales INTEGER DEFAULT 0,  -- 新增二级销售
  new_independent_sales INTEGER DEFAULT 0,  -- 新增独立销售
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversion_stats_date ON user_conversion_stats(stat_date DESC);

-- ================================================
-- 9. 试用转化统计表（7天免费到付费）
-- ================================================
CREATE TABLE IF NOT EXISTS trial_conversion_stats (
  id SERIAL PRIMARY KEY,
  
  -- 统计维度
  stat_period VARCHAR(20) NOT NULL,
  start_date DATE,
  end_date DATE,
  
  -- 销售维度
  sales_type VARCHAR(20),
  sales_code VARCHAR(50),
  
  -- 核心统计
  total_trial_orders INTEGER DEFAULT 0,
  converted_orders INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- 金额统计
  total_converted_amount DECIMAL(10,2) DEFAULT 0,
  avg_converted_amount DECIMAL(10,2) DEFAULT 0,
  
  -- 按销售类型分布
  primary_sales_conversions INTEGER DEFAULT 0,
  secondary_sales_conversions INTEGER DEFAULT 0,
  independent_sales_conversions INTEGER DEFAULT 0,
  
  -- 按时长分布
  converted_to_1month INTEGER DEFAULT 0,
  converted_to_3months INTEGER DEFAULT 0,
  converted_to_6months INTEGER DEFAULT 0,
  converted_to_1year INTEGER DEFAULT 0,
  
  -- 时间分析
  avg_conversion_days DECIMAL(5,2) DEFAULT 0,
  
  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trial_conversion_period ON trial_conversion_stats(stat_period, start_date, end_date);

-- ================================================
-- 10. 试用转化明细表
-- ================================================
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
  primary_sales_code VARCHAR(50),
  
  -- 转化分析
  conversion_days INTEGER,
  is_converted BOOLEAN DEFAULT FALSE,
  conversion_status VARCHAR(20),
  
  converted_at TIMESTAMP
);

CREATE INDEX idx_trial_detail_orders ON trial_conversion_details(trial_order_id, paid_order_id);

-- ================================================
-- 添加表注释
-- ================================================
COMMENT ON TABLE users IS '用户主表 - 支持注册登录和销售体系';
COMMENT ON TABLE user_sessions IS '用户会话表 - 管理登录状态';
COMMENT ON TABLE overview_stats IS '数据概览统计表 - 预计算的统计数据';
COMMENT ON TABLE sales_statistics IS '销售统计表 - 销售业绩和佣金统计';
COMMENT ON TABLE commission_records IS '佣金记录表 - 详细的返佣记录';
COMMENT ON TABLE finance_daily_stats IS '财务日统计表 - 每日财务数据';
COMMENT ON TABLE finance_monthly_stats IS '财务月统计表 - 月度财务汇总';
COMMENT ON TABLE user_conversion_stats IS '用户转化统计表 - 用户到销售的转化';
COMMENT ON TABLE trial_conversion_stats IS '试用转化统计表 - 7天免费到付费转化';
COMMENT ON TABLE trial_conversion_details IS '试用转化明细表 - 转化详细记录';

-- ================================================
-- 执行说明
-- ================================================
-- 1. 这些都是全新的表，不会影响现有系统
-- 2. 建议按顺序执行，因为有外键依赖
-- 3. 所有表都使用 IF NOT EXISTS，可以安全重复执行
-- 4. 建议先在测试环境创建验证
-- 5. 创建后可以开始测试优化方案

-- 查看创建的表
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%stats%' OR tablename LIKE 'user%' OR tablename LIKE 'commission%';

-- 查看表大小
-- SELECT 
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;