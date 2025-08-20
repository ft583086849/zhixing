-- ========================================
-- sales_optimized 表创建脚本
-- 版本：v1.0
-- 创建时间：2025-01-17
-- 功能：统一销售管理，优化查询性能
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
    
    -- ==================== 佣金统计 ====================
    total_commission DECIMAL(12,2) DEFAULT 0,         -- 总佣金
    direct_commission DECIMAL(12,2) DEFAULT 0,        -- 直销佣金
    share_commission DECIMAL(12,2) DEFAULT 0,         -- 分销收益（仅一级有值）
    pending_commission DECIMAL(12,2) DEFAULT 0,       -- 待返佣金
    paid_commission DECIMAL(12,2) DEFAULT 0,          -- 已返佣金
    
    -- ==================== 月度统计（当月） ====================
    month_orders INT DEFAULT 0,                       -- 当月订单数
    month_amount DECIMAL(12,2) DEFAULT 0,             -- 当月销售额
    month_direct_orders INT DEFAULT 0,                -- 当月直销订单
    month_direct_amount DECIMAL(12,2) DEFAULT 0,      -- 当月直销金额
    month_commission DECIMAL(12,2) DEFAULT 0,         -- 当月佣金
    month_direct_commission DECIMAL(12,2) DEFAULT 0,  -- 当月直销佣金
    month_share_commission DECIMAL(12,2) DEFAULT 0,   -- 当月分销收益
    
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
    
    -- ==================== 联系方式（预留） ====================
    phone VARCHAR(20),                                -- 手机号（未来用）
    email VARCHAR(100),                               -- 邮箱（未来用）
    user_id UUID,                                     -- 关联用户ID（未来用）
    
    -- ==================== 扩展字段 ====================
    allow_recruit BOOLEAN DEFAULT false,              -- 是否允许招募下级（未来用）
    source_type VARCHAR(50),                          -- 来源类型: direct/customer_upgrade
    converted_from_order_id UUID,                     -- 转化来源订单（客户转销售）
    
    -- ==================== 时间戳 ====================
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- ==================== 原表ID映射 ====================
    original_table VARCHAR(20),                       -- 原表名: primary_sales/secondary_sales
    original_id UUID                                  -- 原表ID
);

-- 2. 创建索引优化查询性能
CREATE INDEX idx_sales_code ON sales_optimized(sales_code);
CREATE INDEX idx_sales_type ON sales_optimized(sales_type);
CREATE INDEX idx_sales_level ON sales_optimized(sales_level);
CREATE INDEX idx_parent_sales_id ON sales_optimized(parent_sales_id);
CREATE INDEX idx_parent_sales_code ON sales_optimized(parent_sales_code);
CREATE INDEX idx_wechat_name ON sales_optimized(wechat_name);
CREATE INDEX idx_status ON sales_optimized(status);
CREATE INDEX idx_is_active ON sales_optimized(is_active);
CREATE INDEX idx_commission_rate ON sales_optimized(commission_rate);
CREATE INDEX idx_created_at ON sales_optimized(created_at DESC);
CREATE INDEX idx_last_order_date ON sales_optimized(last_order_date DESC);

-- 性能优化索引
CREATE INDEX idx_total_amount ON sales_optimized(total_amount DESC);
CREATE INDEX idx_month_amount ON sales_optimized(month_amount DESC);
CREATE INDEX idx_total_commission ON sales_optimized(total_commission DESC);
CREATE INDEX idx_pending_commission ON sales_optimized(pending_commission DESC);

-- 复合索引
CREATE INDEX idx_sales_type_status ON sales_optimized(sales_type, status);
CREATE INDEX idx_parent_active ON sales_optimized(parent_sales_id, is_active);
CREATE INDEX idx_type_commission ON sales_optimized(sales_type, commission_rate);

-- 3. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_sales_optimized_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_sales_optimized_timestamp
BEFORE UPDATE ON sales_optimized
FOR EACH ROW
EXECUTE FUNCTION update_sales_optimized_updated_at();

-- 4. 添加注释说明
COMMENT ON TABLE sales_optimized IS '优化后的销售管理表，整合一级、二级和独立销售';
COMMENT ON COLUMN sales_optimized.sales_type IS '销售类型: primary(一级), secondary(二级), independent(独立)';
COMMENT ON COLUMN sales_optimized.sales_level IS '销售等级: 1=一级销售, 2=二级/独立销售';
COMMENT ON COLUMN sales_optimized.commission_rate IS '佣金率: 0.4=40%, 0.25=25%等';
COMMENT ON COLUMN sales_optimized.parent_sales_id IS '上级销售ID，独立销售此字段为NULL';
COMMENT ON COLUMN sales_optimized.direct_commission IS '直销佣金：自己直接销售产生的佣金';
COMMENT ON COLUMN sales_optimized.share_commission IS '分销收益：团队销售产生的差额佣金（仅一级销售有）';
COMMENT ON COLUMN sales_optimized.team_avg_commission_rate IS '团队加权平均佣金率（仅一级销售有）';

-- 5. 创建数据质量检查
ALTER TABLE sales_optimized ADD CONSTRAINT chk_commission_rate 
    CHECK (commission_rate >= 0 AND commission_rate <= 1);
    
ALTER TABLE sales_optimized ADD CONSTRAINT chk_sales_type 
    CHECK (sales_type IN ('primary', 'secondary', 'independent'));
    
ALTER TABLE sales_optimized ADD CONSTRAINT chk_sales_level 
    CHECK (sales_level IN (1, 2));

-- 6. 输出创建结果
SELECT 'sales_optimized 表创建成功！' as message,
       '包含 ' || COUNT(*) || ' 个字段' as fields_count,
       '创建了 ' || COUNT(*) || ' 个索引' as indexes_count
FROM information_schema.columns
WHERE table_name = 'sales_optimized';