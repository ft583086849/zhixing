-- 📊 添加已返佣金额字段
-- 用于记录已经支付给销售的佣金金额

-- 1. 给一级销售表添加已返佣金字段
ALTER TABLE primary_sales 
ADD COLUMN IF NOT EXISTS paid_commission DECIMAL(10,2) DEFAULT 0 
COMMENT '已返佣金额';

-- 2. 给二级销售表添加已返佣金字段  
ALTER TABLE secondary_sales
ADD COLUMN IF NOT EXISTS paid_commission DECIMAL(10,2) DEFAULT 0
COMMENT '已返佣金额';

-- 3. 可选：添加最后更新时间字段，记录最后一次返佣时间
ALTER TABLE primary_sales
ADD COLUMN IF NOT EXISTS last_commission_paid_at TIMESTAMP DEFAULT NULL
COMMENT '最后返佣时间';

ALTER TABLE secondary_sales  
ADD COLUMN IF NOT EXISTS last_commission_paid_at TIMESTAMP DEFAULT NULL
COMMENT '最后返佣时间';

-- 4. 查看添加后的表结构
-- DESCRIBE primary_sales;
-- DESCRIBE secondary_sales;
