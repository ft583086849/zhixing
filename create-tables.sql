-- 创建产品配置表
CREATE TABLE IF NOT EXISTS product_config (
    id SERIAL PRIMARY KEY,
    product_type VARCHAR(20) NOT NULL,
    duration_months INTEGER NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    trial_days INTEGER DEFAULT 0,
    is_trial BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_type, duration_months, effective_date, is_trial)
);

-- 创建产品特性表
CREATE TABLE IF NOT EXISTS product_features (
    id SERIAL PRIMARY KEY,
    product_type VARCHAR(20) NOT NULL,
    feature_name VARCHAR(50) NOT NULL,
    feature_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_type, feature_name)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_product_config_type_status ON product_config(product_type, status);
CREATE INDEX IF NOT EXISTS idx_product_config_trial ON product_config(is_trial, status);
CREATE INDEX IF NOT EXISTS idx_product_features_type ON product_features(product_type, is_active);

-- 插入产品配置数据
INSERT INTO product_config (product_type, duration_months, price_usd, trial_days, is_trial, status, effective_date)
VALUES 
-- 信号策略 3天免费试用
('信号策略', 0, 0.00, 3, true, 'active', '2024-09-06'),
-- 信号策略付费套餐
('信号策略', 1, 288.00, 0, false, 'active', '2024-09-06'),
('信号策略', 3, 588.00, 0, false, 'active', '2024-09-06'),
('信号策略', 6, 1088.00, 0, false, 'active', '2024-09-06'),
('信号策略', 12, 1888.00, 0, false, 'active', '2024-09-06'),

-- 推币系统 (即将上线)
('推币系统', 0, 0.00, 3, true, 'coming_soon', '2024-09-06'),
('推币系统', 1, 588.00, 0, false, 'coming_soon', '2024-09-06'),
('推币系统', 3, 1588.00, 0, false, 'coming_soon', '2024-09-06'),
('推币系统', 6, 2588.00, 0, false, 'coming_soon', '2024-09-06'),
('推币系统', 12, 3999.00, 0, false, 'coming_soon', '2024-09-06'),

-- 套餐组合 (即将上线)
('套餐组合', 0, 0.00, 3, true, 'coming_soon', '2024-09-06'),
('套餐组合', 1, 688.00, 0, false, 'coming_soon', '2024-09-06'),
('套餐组合', 3, 1888.00, 0, false, 'coming_soon', '2024-09-06'),
('套餐组合', 6, 3188.00, 0, false, 'coming_soon', '2024-09-06'),
('套餐组合', 12, 4688.00, 0, false, 'coming_soon', '2024-09-06')
ON CONFLICT (product_type, duration_months, effective_date, is_trial) DO NOTHING;

-- 插入产品特性数据  
INSERT INTO product_features (product_type, feature_name, feature_description)
VALUES 
-- 信号策略特性
('信号策略', '信号策略分析', '专业的市场分析和交易策略'),
('信号策略', 'TradingView信号', '实时TradingView信号推送'),
('信号策略', '24小时客服', '全天候专业客服支持'),

-- 推币系统特性
('推币系统', 'Discord专属频道', 'Discord平台独家交易频道'),
('推币系统', '实时推币信号', '即时推送高质量交易信号'),
('推币系统', '3天免费试用', '新用户享受3天完整功能体验'),
('推币系统', '高级分析工具', '专业的技术分析工具集'),

-- 套餐组合特性
('套餐组合', '包含信号策略', '完整的信号策略功能'),
('套餐组合', '包含推币系统', '完整的推币系统功能'),
('套餐组合', '最优价格组合', '相比单独购买节省更多费用')
ON CONFLICT (product_type, feature_name) DO NOTHING;