-- 创建销售统计排除配置表
-- 用于管理被排除在统计之外的销售账号

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS excluded_sales_config CASCADE;

-- 创建排除配置表
CREATE TABLE excluded_sales_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wechat_name VARCHAR(255) NOT NULL,  -- 被排除的微信号
  sales_code VARCHAR(50),              -- 销售代码（可选）
  sales_type VARCHAR(20),              -- 销售类型：primary/secondary
  reason TEXT,                         -- 排除原因
  excluded_by VARCHAR(255),            -- 操作人
  excluded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 排除时间
  is_active BOOLEAN DEFAULT true,      -- 是否生效
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 唯一约束：同一个微信号只能有一条生效的记录
  CONSTRAINT unique_active_wechat UNIQUE (wechat_name, is_active)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_excluded_sales_wechat ON excluded_sales_config(wechat_name);
CREATE INDEX idx_excluded_sales_code ON excluded_sales_config(sales_code);
CREATE INDEX idx_excluded_sales_active ON excluded_sales_config(is_active);
CREATE INDEX idx_excluded_sales_created ON excluded_sales_config(created_at DESC);

-- 添加注释
COMMENT ON TABLE excluded_sales_config IS '销售统计排除配置表，用于管理不计入统计的销售账号';
COMMENT ON COLUMN excluded_sales_config.wechat_name IS '被排除的销售微信号';
COMMENT ON COLUMN excluded_sales_config.sales_code IS '销售代码';
COMMENT ON COLUMN excluded_sales_config.sales_type IS '销售类型：primary（一级）/secondary（二级）';
COMMENT ON COLUMN excluded_sales_config.reason IS '排除原因，如：测试账号、内部账号、特殊渠道等';
COMMENT ON COLUMN excluded_sales_config.excluded_by IS '执行排除操作的管理员';
COMMENT ON COLUMN excluded_sales_config.is_active IS '是否生效，false表示已恢复统计';

-- 创建操作日志表（记录所有排除/恢复操作）
DROP TABLE IF EXISTS excluded_sales_log CASCADE;

CREATE TABLE excluded_sales_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wechat_name VARCHAR(255) NOT NULL,
  sales_code VARCHAR(50),
  action VARCHAR(20) NOT NULL,  -- 'exclude' 或 'restore'
  reason TEXT,
  operated_by VARCHAR(255),
  operated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 记录操作时的影响
  affected_orders_count INT DEFAULT 0,
  affected_amount DECIMAL(10, 2) DEFAULT 0,
  affected_commission DECIMAL(10, 2) DEFAULT 0
);

CREATE INDEX idx_excluded_log_wechat ON excluded_sales_log(wechat_name);
CREATE INDEX idx_excluded_log_time ON excluded_sales_log(operated_at DESC);

-- 创建视图：当前生效的排除名单
CREATE OR REPLACE VIEW active_excluded_sales AS
SELECT 
  wechat_name,
  sales_code,
  sales_type,
  reason,
  excluded_by,
  excluded_at
FROM excluded_sales_config
WHERE is_active = true;

-- 创建函数：检查某个销售是否被排除
CREATE OR REPLACE FUNCTION is_sales_excluded(p_wechat_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM excluded_sales_config 
    WHERE wechat_name = p_wechat_name 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- 创建函数：获取所有被排除的销售代码
CREATE OR REPLACE FUNCTION get_excluded_sales_codes()
RETURNS TEXT[] AS $$
DECLARE
  excluded_codes TEXT[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT sales_code) 
  INTO excluded_codes
  FROM excluded_sales_config 
  WHERE is_active = true 
    AND sales_code IS NOT NULL;
  
  RETURN COALESCE(excluded_codes, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- 插入示例数据（注释掉，仅供参考）
-- INSERT INTO excluded_sales_config (wechat_name, sales_code, sales_type, reason, excluded_by) 
-- VALUES 
-- ('测试销售001', 'TEST001', 'primary', '内部测试账号', 'admin'),
-- ('测试销售002', 'TEST002', 'secondary', '开发测试账号', 'admin');

-- 授权（确保应用可以访问）
GRANT ALL ON excluded_sales_config TO authenticated;
GRANT ALL ON excluded_sales_log TO authenticated;
GRANT SELECT ON active_excluded_sales TO authenticated;
GRANT EXECUTE ON FUNCTION is_sales_excluded TO authenticated;
GRANT EXECUTE ON FUNCTION get_excluded_sales_codes TO authenticated;