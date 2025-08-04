-- 数据库完全重构脚本 - sales_code标准
-- 执行前请备份数据库！

-- ================================
-- 步骤1：为primary_sales表添加sales_code字段
-- ================================

-- 添加新字段
ALTER TABLE primary_sales 
ADD COLUMN sales_code VARCHAR(50) COMMENT '用户购买时使用的销售代码',
ADD COLUMN secondary_registration_code VARCHAR(50) COMMENT '二级销售注册时使用的代码';

-- 为现有记录生成sales_code
UPDATE primary_sales SET 
    sales_code = CONCAT('PS_', SUBSTRING(MD5(CONCAT(id, wechat_name, UNIX_TIMESTAMP())), 1, 12)),
    secondary_registration_code = CONCAT('SR_', SUBSTRING(MD5(CONCAT(id, wechat_name, 'reg', UNIX_TIMESTAMP())), 1, 12))
WHERE sales_code IS NULL OR secondary_registration_code IS NULL;

-- 添加唯一约束和索引
ALTER TABLE primary_sales 
ADD CONSTRAINT uk_primary_sales_code UNIQUE (sales_code),
ADD CONSTRAINT uk_primary_secondary_registration_code UNIQUE (secondary_registration_code),
ADD KEY idx_primary_sales_code (sales_code),
ADD KEY idx_primary_secondary_registration_code (secondary_registration_code);

-- 设置字段为NOT NULL
ALTER TABLE primary_sales 
MODIFY COLUMN sales_code VARCHAR(50) NOT NULL COMMENT '用户购买时使用的销售代码',
MODIFY COLUMN secondary_registration_code VARCHAR(50) NOT NULL COMMENT '二级销售注册时使用的代码';

-- ================================
-- 步骤2：为secondary_sales表添加sales_code字段
-- ================================

-- 添加新字段
ALTER TABLE secondary_sales 
ADD COLUMN sales_code VARCHAR(50) COMMENT '用户购买时使用的销售代码',
ADD COLUMN primary_registration_code VARCHAR(50) COMMENT '注册时使用的一级销售注册代码';

-- 为现有记录生成sales_code（如果有现有记录）
UPDATE secondary_sales SET 
    sales_code = CONCAT('SS_', SUBSTRING(MD5(CONCAT(id, wechat_name, UNIX_TIMESTAMP())), 1, 12)),
    primary_registration_code = COALESCE(primary_registration_code, '')
WHERE sales_code IS NULL;

-- 添加唯一约束和索引
ALTER TABLE secondary_sales 
ADD CONSTRAINT uk_secondary_sales_code UNIQUE (sales_code),
ADD KEY idx_secondary_sales_code (sales_code),
ADD KEY idx_secondary_primary_registration_code (primary_registration_code);

-- 设置sales_code为NOT NULL
ALTER TABLE secondary_sales 
MODIFY COLUMN sales_code VARCHAR(50) NOT NULL COMMENT '用户购买时使用的销售代码';

-- ================================
-- 步骤3：orders表结构重构
-- ================================

-- 检查是否存在link_id字段和外键
SET @exist_link_id = (SELECT COUNT(*) FROM information_schema.columns 
                      WHERE table_name='orders' AND column_name='link_id' AND table_schema=DATABASE());

-- 添加新字段
ALTER TABLE orders 
ADD COLUMN sales_code VARCHAR(50) COMMENT '购买时使用的销售代码',
ADD COLUMN sales_type ENUM('primary', 'secondary') COMMENT '销售类型：一级销售/二级销售',
ADD COLUMN customer_wechat VARCHAR(100) COMMENT '客户微信号',
ADD COLUMN screenshot_data LONGBLOB COMMENT '付款截图数据',
ADD COLUMN screenshot_expires_at DATETIME COMMENT '截图数据过期时间',
ADD COLUMN commission_rate DECIMAL(5,4) DEFAULT 0.3000 COMMENT '佣金比率',
ADD COLUMN alipay_amount DECIMAL(10,2) COMMENT '支付宝付款金额',
ADD COLUMN crypto_amount DECIMAL(10,2) COMMENT '链上付款金额';

-- 更新status字段枚举值
ALTER TABLE orders 
MODIFY COLUMN status ENUM('pending_payment', 'pending_config', 'confirmed', 'active', 'expired', 'cancelled', 'rejected') DEFAULT 'pending_payment';

-- 迁移现有订单数据（如果存在link_id）
UPDATE orders o
JOIN links l ON o.link_id = l.id AND @exist_link_id > 0
JOIN primary_sales ps ON l.sales_id = ps.id
SET 
    o.sales_code = ps.sales_code,
    o.sales_type = 'primary',
    o.commission_rate = ps.commission_rate / 100
WHERE o.sales_code IS NULL;

-- 处理可能的遗留数据
UPDATE orders 
SET 
    sales_code = COALESCE(sales_code, link_code, CONCAT('OLD_', id)),
    sales_type = COALESCE(sales_type, 'primary'),
    commission_rate = COALESCE(commission_rate, 0.3000)
WHERE sales_code IS NULL OR sales_type IS NULL;

-- 添加索引
ALTER TABLE orders 
ADD KEY idx_orders_sales_code (sales_code),
ADD KEY idx_orders_sales_type (sales_type);

-- 设置关键字段为NOT NULL
ALTER TABLE orders 
MODIFY COLUMN sales_code VARCHAR(50) NOT NULL COMMENT '购买时使用的销售代码',
MODIFY COLUMN sales_type ENUM('primary', 'secondary') NOT NULL COMMENT '销售类型';

-- ================================
-- 步骤4：清理废弃字段（谨慎执行）
-- ================================

-- 备份links表数据
CREATE TABLE links_backup AS SELECT * FROM links;

-- 注释：暂时保留link_id字段作为备份，生产环境稳定后可删除
-- ALTER TABLE orders DROP FOREIGN KEY IF EXISTS orders_ibfk_1;
-- ALTER TABLE orders DROP COLUMN IF EXISTS link_id;

-- ================================
-- 验证脚本完整性
-- ================================

-- 检查primary_sales表
SELECT 
    COUNT(*) as total_primary_sales,
    COUNT(sales_code) as has_sales_code,
    COUNT(secondary_registration_code) as has_registration_code
FROM primary_sales;

-- 检查secondary_sales表
SELECT 
    COUNT(*) as total_secondary_sales,
    COUNT(sales_code) as has_sales_code
FROM secondary_sales;

-- 检查orders表
SELECT 
    COUNT(*) as total_orders,
    COUNT(sales_code) as has_sales_code,
    COUNT(sales_type) as has_sales_type
FROM orders;

-- 检查sales_code唯一性
SELECT 'primary_sales' as table_name, COUNT(*) as total, COUNT(DISTINCT sales_code) as unique_codes
FROM primary_sales
UNION ALL
SELECT 'secondary_sales' as table_name, COUNT(*) as total, COUNT(DISTINCT sales_code) as unique_codes  
FROM secondary_sales;

COMMIT;