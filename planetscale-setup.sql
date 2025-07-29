-- PlanetScale 生产数据库结构
-- 注意：PlanetScale不支持外键约束，但支持其他MySQL特性

-- 1. 销售员表
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wechat_name VARCHAR(100) NOT NULL COMMENT '微信名称',
    payment_method ENUM('alipay', 'crypto') NOT NULL COMMENT '收款方式',
    payment_address VARCHAR(500) NOT NULL COMMENT '收款地址',
    alipay_surname VARCHAR(10) DEFAULT NULL COMMENT '支付宝收款人姓氏',
    chain_name VARCHAR(50) DEFAULT NULL COMMENT '加密货币链名',
    link_code VARCHAR(100) UNIQUE NOT NULL COMMENT '唯一链接代码',
    total_orders INT DEFAULT 0 COMMENT '总订单数',
    total_revenue DECIMAL(10,2) DEFAULT 0.00 COMMENT '总收入',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_link_code (link_code),
    INDEX idx_wechat_name (wechat_name)
) COMMENT '销售员收款信息表';

-- 2. 订单表
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    link_code VARCHAR(100) NOT NULL COMMENT '销售链接代码',
    tradingview_username VARCHAR(100) NOT NULL COMMENT 'TradingView用户名',
    customer_wechat VARCHAR(100) DEFAULT NULL COMMENT '客户微信',
    duration ENUM('7days', '1month', '3months', '6months', '1year', 'lifetime') NOT NULL COMMENT '时长',
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    payment_method ENUM('alipay', 'crypto') NOT NULL COMMENT '支付方式',
    payment_time DATETIME NOT NULL COMMENT '付款时间',
    purchase_type ENUM('immediate', 'advance') DEFAULT 'immediate' COMMENT '购买类型',
    effective_time DATETIME DEFAULT NULL COMMENT '生效时间',
    expiry_time DATETIME DEFAULT NULL COMMENT '过期时间',
    status ENUM('pending_review', 'active', 'expired', 'cancelled') DEFAULT 'pending_review' COMMENT '订单状态',
    screenshot_path VARCHAR(500) DEFAULT NULL COMMENT '付款截图路径',
    alipay_amount DECIMAL(10,2) DEFAULT NULL COMMENT '支付宝金额',
    commission_rate DECIMAL(5,4) DEFAULT 0.15 COMMENT '佣金比例',
    commission_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '佣金金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_link_code (link_code),
    INDEX idx_tradingview_username (tradingview_username),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) COMMENT '订单表';

-- 3. 管理员表
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    role ENUM('admin', 'super_admin') DEFAULT 'admin' COMMENT '角色',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    last_login_at TIMESTAMP NULL DEFAULT NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) COMMENT '管理员表';

-- 4. 支付配置表
CREATE TABLE payment_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alipay_account VARCHAR(100) DEFAULT NULL COMMENT '支付宝账号',
    alipay_surname VARCHAR(50) DEFAULT NULL COMMENT '支付宝收款人姓氏',
    alipay_qr_code TEXT DEFAULT NULL COMMENT '支付宝收款码',
    crypto_chain_name VARCHAR(50) DEFAULT NULL COMMENT '加密货币链名',
    crypto_address VARCHAR(255) DEFAULT NULL COMMENT '加密货币地址',
    crypto_qr_code TEXT DEFAULT NULL COMMENT '加密货币收款码',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '支付配置表';

-- 5. 永久授权限量表
CREATE TABLE lifetime_limit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_limit INT NOT NULL DEFAULT 100 COMMENT '总限量',
    used_count INT DEFAULT 0 COMMENT '已使用数量',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用限量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '永久授权限量表';

-- 插入默认管理员账户 (密码都是: 123456)
INSERT INTO admins (username, password_hash, role) VALUES 
('admin', '$2a$10$rQUjGF1QHcR5H.KZmJ0HnOvS8V6K5H2I8F9R3D7T4Y1Z0X3C8B5A2', 'super_admin');

-- 插入默认支付配置
INSERT INTO payment_config (alipay_account, alipay_surname, crypto_chain_name, crypto_address) VALUES 
('752304285@qq.com', '梁', 'TRC10/TRC20', 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo');

-- 插入默认永久授权限量
INSERT INTO lifetime_limit (total_limit, used_count, is_active) VALUES (100, 0, TRUE); 