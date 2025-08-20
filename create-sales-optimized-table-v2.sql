-- ========================================
-- sales_optimized 表创建脚本 v2
-- 版本：v2.0
-- 创建时间：2025-01-17
-- 功能：统一销售管理，优化查询性能
-- 更新：调整字段命名，添加密码扩展
-- ========================================

-- 1. 创建 sales_optimized 表
CREATE TABLE IF NOT EXISTS sales_optimized (
    -- ==================== 基础信息 ====================
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_code VARCHAR(50) UNIQUE NOT NULL,           -- 销售编号（唯一）
    wechat_name VARCHAR(100),                         -- 微信名
    name VARCHAR(100),                                -- 姓名
    
    -- ==================== 销售类型 ====================
    sales_type VARCHAR(20) NOT NULL,                  -- 销售类型: primary/secondary/independent
    sales_level INT,                                  -- 销售等级: 1=一级, 2=二级/独立
    
    -- ==================== 关系链 ====================
    parent_sales_id UUID,                             -- 上级销售ID (独立销售为NULL)
    parent_sales_code VARCHAR(50),                    -- 上级销售编号
    parent_sales_name VARCHAR(100),                   -- 上级销售名称
    
    -- ==================== 佣金配置 ====================
    commission_rate DECIMAL(5,4) DEFAULT 0.25,        -- 佣金率 (0.4=40%, 0.25=25%)
    -- primary: 固定0.4
    -- secondary: 默认0.25，可调整
    -- independent: 默认0.25，可调整
    
    -- ==================== 实时统计（总计） ====================
    total_orders INT DEFAULT 0,                       -- 总订单数
    total_amount DECIMAL(12,2) DEFAULT 0,             -- 总销售额
    total_direct_orders INT DEFAULT 0,                -- 直销订单数（自己的订单）
    total_direct_amount DECIMAL(12,2) DEFAULT 0,      -- 直销金额
    total_team_orders INT DEFAULT 0,                  -- 团队订单数（仅一级有值）
    total_team_amount DECIMAL(12,2) DEFAULT 0,        -- 团队销售额（仅一级有值）
    
    -- ==================== 佣金统计（调整命名） ====================
    total_commission DECIMAL(12,2) DEFAULT 0,         -- 总佣金
    primary_commission_amount DECIMAL(12,2) DEFAULT 0,-- 一级销售佣金额（原direct_commission）
    secondary_commission_amount DECIMAL(12,2) DEFAULT 0,-- 二级分销佣金额（原share_commission）
    pending_commission DECIMAL(12,2) DEFAULT 0,       -- 待返佣金
    paid_commission DECIMAL(12,2) DEFAULT 0,          -- 已返佣金
    
    -- ==================== 月度统计（当月） ====================
    month_orders INT DEFAULT 0,                       -- 当月订单数
    month_amount DECIMAL(12,2) DEFAULT 0,             -- 当月销售额
    month_direct_orders INT DEFAULT 0,                -- 当月直销订单
    month_direct_amount DECIMAL(12,2) DEFAULT 0,      -- 当月直销金额
    month_commission DECIMAL(12,2) DEFAULT 0,         -- 当月佣金
    month_primary_commission DECIMAL(12,2) DEFAULT 0, -- 当月一级销售佣金
    month_secondary_commission DECIMAL(12,2) DEFAULT 0,-- 当月二级分销佣金
    
    -- ==================== 季度统计（当季） ====================
    quarter_orders INT DEFAULT 0,                     -- 当季订单数
    quarter_amount DECIMAL(12,2) DEFAULT 0,           -- 当季销售额
    quarter_commission DECIMAL(12,2) DEFAULT 0,       -- 当季佣金
    
    -- ==================== 年度统计（当年） ====================
    year_orders INT DEFAULT 0,                        -- 当年订单数
    year_amount DECIMAL(12,2) DEFAULT 0,              -- 当年销售额
    year_commission DECIMAL(12,2) DEFAULT 0,          -- 当年佣金
    
    -- ==================== 团队统计（仅一级销售） ====================
    team_size INT DEFAULT 0,                          -- 团队人数（下级数量）
    active_team_size INT DEFAULT 0,                   -- 活跃团队人数（30天内有订单）
    team_avg_commission_rate DECIMAL(5,4),            -- 团队平均佣金率（加权平均）
    
    -- ==================== 状态和标记 ====================
    status VARCHAR(20) DEFAULT 'active',              -- 状态: active/inactive/suspended
    is_active BOOLEAN DEFAULT true,                   -- 是否活跃
    last_order_date TIMESTAMP,                        -- 最后出单时间
    join_date DATE,                                   -- 加入日期
    
    -- ==================== 登录系统扩展（未来用） ====================
    user_id UUID,                                     -- 关联用户ID
    phone VARCHAR(20),                                -- 手机号
    email VARCHAR(100),                               -- 邮箱
    password_hash VARCHAR(255),                       -- 密码哈希（未来登录用）
    password_salt VARCHAR(50),                        -- 密码盐值
    need_reset_password BOOLEAN DEFAULT false,        -- 是否需要重置密码
    last_login_at TIMESTAMP,                          -- 最后登录时间
    login_attempts INT DEFAULT 0,                     -- 登录尝试次数
    locked_until TIMESTAMP,                           -- 账号锁定到期时间
    
    -- ==================== 收款信息（未来用） ====================
    payment_qr_code TEXT,                             -- 收款二维码
    payment_info TEXT,                                -- 收款信息
    payment_method VARCHAR(50),                       -- 收款方式
    
    -- ==================== 扩展字段 ====================
    allow_recruit BOOLEAN DEFAULT false,              -- 是否允许招募下级
    source_type VARCHAR(50),                          -- 来源类型: direct/customer_upgrade
    converted_from_order_id UUID,                     -- 转化来源订单（客户转销售）
    referral_code VARCHAR(50),                        -- 推荐码（用于邀请链接）
    
    -- ==================== 时间戳 ====================
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- ==================== 原表ID映射 ====================
    original_table VARCHAR(20),                       -- 原表名: primary_sales/secondary_sales
    original_id UUID                                  -- 原表ID
);

-- 2. 创建索引优化查询性能
CREATE INDEX idx_sales_opt_code ON sales_optimized(sales_code);
CREATE INDEX idx_sales_opt_type ON sales_optimized(sales_type);
CREATE INDEX idx_sales_opt_level ON sales_optimized(sales_level);
CREATE INDEX idx_sales_opt_parent_id ON sales_optimized(parent_sales_id);
CREATE INDEX idx_sales_opt_parent_code ON sales_optimized(parent_sales_code);
CREATE INDEX idx_sales_opt_wechat ON sales_optimized(wechat_name);
CREATE INDEX idx_sales_opt_status ON sales_optimized(status);
CREATE INDEX idx_sales_opt_active ON sales_optimized(is_active);
CREATE INDEX idx_sales_opt_commission ON sales_optimized(commission_rate);
CREATE INDEX idx_sales_opt_created ON sales_optimized(created_at DESC);
CREATE INDEX idx_sales_opt_last_order ON sales_optimized(last_order_date DESC);

-- 性能优化索引
CREATE INDEX idx_sales_opt_total_amt ON sales_optimized(total_amount DESC);
CREATE INDEX idx_sales_opt_month_amt ON sales_optimized(month_amount DESC);
CREATE INDEX idx_sales_opt_total_comm ON sales_optimized(total_commission DESC);
CREATE INDEX idx_sales_opt_pending_comm ON sales_optimized(pending_commission DESC);

-- 复合索引
CREATE INDEX idx_sales_opt_type_status ON sales_optimized(sales_type, status);
CREATE INDEX idx_sales_opt_parent_active ON sales_optimized(parent_sales_id, is_active);
CREATE INDEX idx_sales_opt_type_comm ON sales_optimized(sales_type, commission_rate);

-- 登录相关索引（未来用）
CREATE INDEX idx_sales_opt_email ON sales_optimized(email);
CREATE INDEX idx_sales_opt_phone ON sales_optimized(phone);
CREATE INDEX idx_sales_opt_user_id ON sales_optimized(user_id);
CREATE INDEX idx_sales_opt_referral ON sales_optimized(referral_code);

-- 3. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_sales_optimized_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_sales_opt_timestamp
BEFORE UPDATE ON sales_optimized
FOR EACH ROW
EXECUTE FUNCTION update_sales_optimized_updated_at();

-- 4. 添加注释说明
COMMENT ON TABLE sales_optimized IS '优化后的销售管理表，整合一级、二级和独立销售';
COMMENT ON COLUMN sales_optimized.sales_type IS '销售类型: primary(一级), secondary(二级), independent(独立)';
COMMENT ON COLUMN sales_optimized.sales_level IS '销售等级: 1=一级销售, 2=二级/独立销售';
COMMENT ON COLUMN sales_optimized.commission_rate IS '佣金率: 0.4=40%, 0.25=25%，后台统一使用小数存储';
COMMENT ON COLUMN sales_optimized.parent_sales_id IS '上级销售ID，独立销售此字段为NULL';
COMMENT ON COLUMN sales_optimized.primary_commission_amount IS '一级销售佣金额：自己直接销售产生的佣金';
COMMENT ON COLUMN sales_optimized.secondary_commission_amount IS '二级分销佣金额：团队销售产生的差额佣金（仅一级销售有）';
COMMENT ON COLUMN sales_optimized.team_avg_commission_rate IS '团队加权平均佣金率（仅一级销售有）';
COMMENT ON COLUMN sales_optimized.password_hash IS '密码哈希值（未来登录系统用）';
COMMENT ON COLUMN sales_optimized.referral_code IS '推荐码（用于生成邀请链接）';

-- 5. 创建数据质量检查
ALTER TABLE sales_optimized ADD CONSTRAINT chk_sales_opt_commission_rate 
    CHECK (commission_rate >= 0 AND commission_rate <= 1);
    
ALTER TABLE sales_optimized ADD CONSTRAINT chk_sales_opt_type 
    CHECK (sales_type IN ('primary', 'secondary', 'independent'));
    
ALTER TABLE sales_optimized ADD CONSTRAINT chk_sales_opt_level 
    CHECK (sales_level IN (1, 2));

-- 6. 创建唯一约束
ALTER TABLE sales_optimized ADD CONSTRAINT uk_sales_opt_email 
    UNIQUE (email);
    
ALTER TABLE sales_optimized ADD CONSTRAINT uk_sales_opt_phone 
    UNIQUE (phone);
    
ALTER TABLE sales_optimized ADD CONSTRAINT uk_sales_opt_referral 
    UNIQUE (referral_code);

-- 7. 输出创建结果
SELECT 
    'sales_optimized 表创建成功！' as "状态",
    COUNT(*) as "字段数量",
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'sales_optimized') as "索引数量",
    '支持未来登录系统扩展' as "特性"
FROM information_schema.columns
WHERE table_name = 'sales_optimized';