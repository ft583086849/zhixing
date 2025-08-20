-- ========================================
-- 预留字段方案 - 为用户注册功能做准备
-- 创建时间：2024-12-19
-- 说明：为四个核心页面预留必要字段
-- ========================================

-- ========================================
-- 1. 订单管理页面 - orders表预留字段
-- ========================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER;  -- 关联用户ID
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_became_sales BOOLEAN DEFAULT FALSE;  -- 客户是否在此订单后成为销售
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_conversion_date TIMESTAMP;  -- 转化为销售的时间
ALTER TABLE orders ADD COLUMN IF NOT EXISTS link_type VARCHAR(20);  -- 链接类型: purchase/recruit/trial/trial_recruit
ALTER TABLE orders ADD COLUMN IF NOT EXISTS parent_sales_type VARCHAR(20);  -- 上级销售类型
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate_snapshot DECIMAL(5,2);  -- 订单创建时的返佣率快照
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_first_order BOOLEAN DEFAULT FALSE;  -- 是否首单
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_source VARCHAR(50);  -- 推荐来源

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_sales_conversion ON orders(customer_became_sales);
CREATE INDEX IF NOT EXISTS idx_orders_link_type ON orders(link_type);

-- ========================================
-- 2. 销售管理页面 - 销售表预留字段
-- ========================================

-- primary_sales表
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS user_id INTEGER;  -- 关联用户账号
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS allow_recruit BOOLEAN DEFAULT TRUE;  -- 是否允许招募下级
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS max_secondary_count INTEGER DEFAULT 100;  -- 最大下级数量限制
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS recruit_link VARCHAR(255);  -- 招募链接
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS purchase_link VARCHAR(255);  -- 纯购买链接
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS total_recruited INTEGER DEFAULT 0;  -- 已招募下级数量
ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS last_active_date DATE;  -- 最后活跃日期

-- secondary_sales表
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS user_id INTEGER;  -- 关联用户账号
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);  -- 来源类型: direct/customer_upgrade
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS converted_from_order_id INTEGER;  -- 转化来源订单ID
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS converted_from_customer_id INTEGER;  -- 转化前的客户ID
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP;  -- 转化时间
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS parent_commission_rate DECIMAL(5,2);  -- 上级给的返佣率
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS allow_recruit BOOLEAN DEFAULT FALSE;  -- 是否允许招募（独立销售可能需要）
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS payment_qr_code TEXT;  -- 收款二维码
ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS payment_info TEXT;  -- 收款信息

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_primary_sales_user_id ON primary_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_secondary_sales_user_id ON secondary_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_secondary_sales_source ON secondary_sales(source_type);
CREATE INDEX IF NOT EXISTS idx_secondary_sales_converted_order ON secondary_sales(converted_from_order_id);

-- ========================================
-- 3. 客户管理页面 - customers表预留字段
-- ========================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id INTEGER;  -- 关联用户账号
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_sales BOOLEAN DEFAULT FALSE;  -- 是否已成为销售
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_type VARCHAR(20);  -- 销售类型（如果是销售）
ALTER TABLE customers ADD COLUMN IF NOT EXISTS became_sales_at TIMESTAMP;  -- 成为销售的时间
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50);  -- 销售代码（如果是销售）
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_link VARCHAR(255);  -- 销售链接（如果是销售）
ALTER TABLE customers ADD COLUMN IF NOT EXISTS parent_sales_id INTEGER;  -- 上级销售ID（如果是销售）
ALTER TABLE customers ADD COLUMN IF NOT EXISTS parent_sales_type VARCHAR(20);  -- 上级销售类型
ALTER TABLE customers ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2);  -- 返佣率（如果是销售）
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_qr_code TEXT;  -- 收款码
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_address TEXT;  -- 收款地址
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_earned_commission DECIMAL(10,2) DEFAULT 0;  -- 累计获得佣金
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pending_commission DECIMAL(10,2) DEFAULT 0;  -- 待结算佣金
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_purchase_date DATE;  -- 最后购买日期
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(10,2) DEFAULT 0;  -- 客户生命周期价值

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_is_sales ON customers(is_sales);
CREATE INDEX IF NOT EXISTS idx_customers_sales_code ON customers(sales_code);
CREATE INDEX IF NOT EXISTS idx_customers_parent_sales ON customers(parent_sales_id);

-- ========================================
-- 4. 资金统计页面 - 新建返佣记录表
-- ========================================
CREATE TABLE IF NOT EXISTS commission_records (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,  -- 关联订单
  sales_id INTEGER NOT NULL,  -- 销售ID
  sales_type VARCHAR(20) NOT NULL,  -- 销售类型: primary/secondary/independent
  sales_code VARCHAR(50) NOT NULL,  -- 销售代码
  user_id INTEGER,  -- 关联用户ID（预留）
  
  -- 返佣信息
  order_amount DECIMAL(10,2) NOT NULL,  -- 订单金额
  commission_rate DECIMAL(5,2) NOT NULL,  -- 返佣率
  commission_amount DECIMAL(10,2) NOT NULL,  -- 返佣金额
  
  -- 状态追踪
  status VARCHAR(20) DEFAULT 'pending',  -- pending/approved/paid/cancelled
  approved_at TIMESTAMP,  -- 审批时间
  approved_by INTEGER,  -- 审批人
  paid_at TIMESTAMP,  -- 支付时间
  payment_method VARCHAR(50),  -- 支付方式
  payment_reference VARCHAR(255),  -- 支付凭证
  
  -- 层级信息
  is_secondary BOOLEAN DEFAULT FALSE,  -- 是否二级返佣
  parent_sales_id INTEGER,  -- 上级销售ID
  parent_commission_amount DECIMAL(10,2),  -- 上级应得佣金
  
  -- 特殊标记
  is_customer_upgrade BOOLEAN DEFAULT FALSE,  -- 是否客户转化订单
  source_type VARCHAR(50),  -- 来源类型
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_commission_order ON commission_records(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_sales ON commission_records(sales_id, sales_type);
CREATE INDEX IF NOT EXISTS idx_commission_user ON commission_records(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_status ON commission_records(status);
CREATE INDEX IF NOT EXISTS idx_commission_date ON commission_records(created_at DESC);

-- ========================================
-- 5. 用户表（核心）
-- ========================================
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

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_users_wechat ON users(wechat_name);
CREATE INDEX IF NOT EXISTS idx_users_sales ON users(is_sales, sales_type);
CREATE INDEX IF NOT EXISTS idx_users_sales_code ON users(sales_code);
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_sales_id);
CREATE INDEX IF NOT EXISTS idx_users_enabled ON users(enabled);

-- ========================================
-- 6. 用户会话表
-- ========================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- ========================================
-- 7. 统计相关预留表
-- ========================================
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

CREATE INDEX IF NOT EXISTS idx_conversion_stats_date ON user_conversion_stats(stat_date DESC);

-- ========================================
-- 8. 添加必要的注释
-- ========================================
COMMENT ON TABLE users IS '用户主表 - 支持注册登录和销售体系';
COMMENT ON TABLE commission_records IS '返佣记录表 - 记录所有返佣明细';
COMMENT ON TABLE user_sessions IS '用户会话表 - 管理登录状态';
COMMENT ON TABLE user_conversion_stats IS '用户转化统计表 - 记录转化数据';

COMMENT ON COLUMN orders.user_id IS '关联用户ID - 预留字段';
COMMENT ON COLUMN orders.customer_became_sales IS '客户是否在此订单后成为销售';
COMMENT ON COLUMN orders.link_type IS '链接类型: purchase(仅购买)/recruit(可招募)';

COMMENT ON COLUMN customers.is_sales IS '是否已转化为销售';
COMMENT ON COLUMN customers.sales_code IS '如果是销售的销售代码';

COMMENT ON COLUMN primary_sales.allow_recruit IS '是否允许招募下级销售';
COMMENT ON COLUMN secondary_sales.source_type IS '来源: direct(直接)/customer_upgrade(客户转化)';

-- ========================================
-- 执行说明
-- ========================================
-- 1. 这些字段都是为未来功能预留，使用IF NOT EXISTS确保安全
-- 2. 不会影响现有业务逻辑
-- 3. 可以分批执行，建议先在测试环境验证
-- 4. 执行前请备份数据库
-- 5. 建议在低峰期执行，避免锁表影响业务

-- 查询执行状态
-- SELECT * FROM pg_stat_activity WHERE state = 'active';