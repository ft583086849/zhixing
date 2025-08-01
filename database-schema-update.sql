-- 知行财库销售分佣系统数据库结构调整
-- 版本：v4.0
-- 日期：2025-07-31

-- 1. 创建一级销售表
CREATE TABLE IF NOT EXISTS primary_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    wechat_name VARCHAR(100) NOT NULL UNIQUE,
    payment_method ENUM('alipay', 'crypto') NOT NULL,
    payment_address TEXT NOT NULL,
    alipay_surname VARCHAR(50),
    chain_name VARCHAR(50),
    commission_rate DECIMAL(5,2) DEFAULT 40.00 COMMENT '默认佣金比率40%',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wechat_name (wechat_name),
    INDEX idx_created_at (created_at)
);

-- 2. 创建二级销售表
CREATE TABLE IF NOT EXISTS secondary_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    wechat_name VARCHAR(100) NOT NULL UNIQUE,
    primary_sales_id INT NOT NULL,
    payment_method ENUM('alipay', 'crypto') NOT NULL,
    payment_address TEXT NOT NULL,
    alipay_surname VARCHAR(50),
    chain_name VARCHAR(50),
    commission_rate DECIMAL(5,2) DEFAULT 30.00 COMMENT '佣金比率，由一级销售设定',
    status ENUM('active', 'removed') DEFAULT 'active' COMMENT '状态：活跃/已移除',
    removed_by INT NULL COMMENT '被哪个一级销售移除',
    removed_at TIMESTAMP NULL COMMENT '移除时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (removed_by) REFERENCES primary_sales(id) ON DELETE SET NULL,
    INDEX idx_wechat_name (wechat_name),
    INDEX idx_primary_sales_id (primary_sales_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 3. 更新现有销售表结构
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS sales_type ENUM('primary', 'secondary') DEFAULT 'secondary' COMMENT '销售类型：一级/二级',
ADD COLUMN IF NOT EXISTS parent_sales_id INT NULL COMMENT '上级销售ID',
ADD INDEX IF NOT EXISTS idx_sales_type (sales_type),
ADD INDEX IF NOT EXISTS idx_parent_sales_id (parent_sales_id);

-- 4. 创建销售层级关系表
CREATE TABLE IF NOT EXISTS sales_hierarchy (
    id INT PRIMARY KEY AUTO_INCREMENT,
    primary_sales_id INT NOT NULL,
    secondary_sales_id INT NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL COMMENT '二级销售佣金比率',
    status ENUM('active', 'removed') DEFAULT 'active' COMMENT '关系状态',
    removed_at TIMESTAMP NULL COMMENT '移除时间',
    removed_reason VARCHAR(500) COMMENT '移除原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (secondary_sales_id) REFERENCES secondary_sales(id) ON DELETE CASCADE,
    UNIQUE KEY unique_relationship (primary_sales_id, secondary_sales_id),
    INDEX idx_primary_sales_id (primary_sales_id),
    INDEX idx_secondary_sales_id (secondary_sales_id),
    INDEX idx_status (status)
);

-- 5. 更新链接表结构
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS link_type ENUM('secondary_registration', 'user_sales') DEFAULT 'user_sales' COMMENT '链接类型：二级注册/用户销售',
ADD INDEX IF NOT EXISTS idx_link_type (link_type);

-- 6. 更新订单表结构
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS primary_sales_id INT NULL COMMENT '一级销售ID',
ADD COLUMN IF NOT EXISTS secondary_sales_id INT NULL COMMENT '二级销售ID',
ADD INDEX IF NOT EXISTS idx_primary_sales_id (primary_sales_id),
ADD INDEX IF NOT EXISTS idx_secondary_sales_id (secondary_sales_id);

-- 7. 更新销售返佣表结构
ALTER TABLE sales_commissions 
ADD COLUMN IF NOT EXISTS sales_type ENUM('primary', 'secondary') DEFAULT 'secondary' COMMENT '销售类型',
ADD INDEX IF NOT EXISTS idx_sales_type (sales_type);

-- 8. 数据迁移：将现有销售标记为二级销售
UPDATE sales SET sales_type = 'secondary' WHERE sales_type IS NULL;

-- 9. 创建视图：销售层级关系视图
CREATE OR REPLACE VIEW sales_hierarchy_view AS
SELECT 
    ps.id as primary_sales_id,
    ps.wechat_name as primary_wechat_name,
    ps.commission_rate as primary_commission_rate,
    ss.id as secondary_sales_id,
    ss.wechat_name as secondary_wechat_name,
    ss.commission_rate as secondary_commission_rate,
    ss.status as secondary_status,
    sh.status as relationship_status,
    sh.created_at as relationship_created_at,
    sh.removed_at as relationship_removed_at
FROM primary_sales ps
LEFT JOIN sales_hierarchy sh ON ps.id = sh.primary_sales_id AND sh.status = 'active'
LEFT JOIN secondary_sales ss ON sh.secondary_sales_id = ss.id AND ss.status = 'active';

-- 10. 创建视图：销售业绩统计视图
CREATE OR REPLACE VIEW sales_performance_view AS
SELECT 
    s.id as sales_id,
    s.wechat_name,
    s.sales_type,
    s.parent_sales_id,
    COUNT(o.id) as total_orders,
    SUM(o.amount) as total_amount,
    SUM(o.commission_amount) as total_commission,
    AVG(o.commission_amount) as avg_commission,
    MAX(o.created_at) as last_order_date
FROM sales s
LEFT JOIN links l ON s.id = l.sales_id
LEFT JOIN orders o ON l.id = o.link_id AND o.status = 'confirmed'
GROUP BY s.id, s.wechat_name, s.sales_type, s.parent_sales_id;

-- 11. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_orders_sales_link_code ON orders(sales_link_code);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_time ON orders(payment_time);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 12. 添加约束确保数据完整性
ALTER TABLE sales 
ADD CONSTRAINT chk_sales_type CHECK (sales_type IN ('primary', 'secondary'));

ALTER TABLE links 
ADD CONSTRAINT chk_link_type CHECK (link_type IN ('secondary_registration', 'user_sales'));

-- 13. 创建触发器：自动更新销售层级关系
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_sales_hierarchy_after_secondary_insert
AFTER INSERT ON secondary_sales
FOR EACH ROW
BEGIN
    INSERT INTO sales_hierarchy (primary_sales_id, secondary_sales_id, commission_rate)
    VALUES (NEW.primary_sales_id, NEW.id, NEW.commission_rate);
END//

CREATE TRIGGER IF NOT EXISTS update_sales_hierarchy_after_secondary_update
AFTER UPDATE ON secondary_sales
FOR EACH ROW
BEGIN
    IF NEW.status = 'removed' AND OLD.status = 'active' THEN
        UPDATE sales_hierarchy 
        SET status = 'removed', removed_at = NOW(), removed_reason = '二级销售被移除'
        WHERE secondary_sales_id = NEW.id AND status = 'active';
    END IF;
    
    IF NEW.commission_rate != OLD.commission_rate THEN
        UPDATE sales_hierarchy 
        SET commission_rate = NEW.commission_rate
        WHERE secondary_sales_id = NEW.id AND status = 'active';
    END IF;
END//
DELIMITER ;

-- 14. 创建存储过程：计算一级销售佣金
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CalculatePrimarySalesCommission(
    IN p_primary_sales_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    DECLARE total_commission DECIMAL(10,2) DEFAULT 0;
    DECLARE secondary_commission DECIMAL(10,2) DEFAULT 0;
    
    -- 计算一级销售直接销售佣金（40%）
    SELECT COALESCE(SUM(o.amount * 0.4), 0) INTO total_commission
    FROM orders o
    JOIN links l ON o.link_id = l.id
    JOIN sales s ON l.sales_id = s.id
    WHERE s.id = p_primary_sales_id 
    AND s.sales_type = 'primary'
    AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    AND o.status = 'confirmed';
    
    -- 计算二级销售佣金
    SELECT COALESCE(SUM(o.amount * (ss.commission_rate / 100)), 0) INTO secondary_commission
    FROM orders o
    JOIN links l ON o.link_id = l.id
    JOIN secondary_sales ss ON l.sales_id = ss.id
    WHERE ss.primary_sales_id = p_primary_sales_id
    AND ss.status = 'active'
    AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    AND o.status = 'confirmed';
    
    -- 返回结果
    SELECT 
        total_commission as direct_commission,
        secondary_commission as secondary_commission,
        (total_commission - secondary_commission) as net_commission;
END//
DELIMITER ;

-- 完成数据库结构调整
SELECT 'Database schema update completed successfully!' as status; 