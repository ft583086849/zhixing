# 🌟 PlanetScale 生产数据库配置指南

## 📋 **第一步：注册PlanetScale账户**

1. 访问 [PlanetScale](https://app.planetscale.com)
2. 点击 **"Sign up"** 注册账户（可用GitHub登录）
3. 完成邮箱验证

## 🗄️ **第二步：创建数据库**

1. 登录后点击 **"New database"**
2. 配置数据库：
   ```
   Database name: zhixing-treasury
   Region: 选择 ap-southeast-1 (Singapore) 或离用户最近的
   ```
3. 点击 **"Create database"**

## 🔧 **第三步：执行数据库结构**

### 3.1 进入数据库控制台
1. 点击刚创建的数据库 `zhixing-treasury`
2. 点击 **"Console"** 标签
3. 确保在 `main` 分支

### 3.2 执行建表SQL
复制以下SQL并在控制台中执行：

```sql
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
);

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
);

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
);

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
);

-- 5. 永久授权限量表
CREATE TABLE lifetime_limit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_limit INT NOT NULL DEFAULT 100 COMMENT '总限量',
    used_count INT DEFAULT 0 COMMENT '已使用数量',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用限量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.3 插入初始数据
```sql
-- 插入默认管理员账户 (密码是: 123456)
INSERT INTO admins (username, password_hash, role) VALUES 
('admin', '$2a$10$rQUjGF1QHcR5H.KZmJ0HnOvS8V6K5H2I8F9R3D7T4Y1Z0X3C8B5A2', 'super_admin');

-- 插入默认支付配置
INSERT INTO payment_config (alipay_account, alipay_surname, crypto_chain_name, crypto_address) VALUES 
('752304285@qq.com', '梁', 'TRC10/TRC20', 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo');

-- 插入默认永久授权限量
INSERT INTO lifetime_limit (total_limit, used_count, is_active) VALUES (100, 0, TRUE);
```

## 🔗 **第四步：获取连接信息**

1. 在PlanetScale数据库页面，点击 **"Connect"** 按钮
2. 选择 **"Connect with: Node.js"**
3. 选择 **"@planetscale/database"** 或 **"mysql2"**
4. 复制连接信息，格式如下：
   ```
   Host: xxxx.connect.psdb.cloud
   Username: xxxxxxxx
   Password: pscale_pw_xxxxxxxx
   Database: zhixing-treasury
   ```

## ⚙️ **第五步：配置Vercel环境变量**

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `zhixing-zeta`
3. 点击 **"Settings"** → **"Environment Variables"**
4. 添加以下环境变量：

```bash
DATABASE_HOST=xxxx.connect.psdb.cloud
DATABASE_USERNAME=xxxxxxxx
DATABASE_PASSWORD=pscale_pw_xxxxxxxx
DATABASE_NAME=zhixing-treasury
NODE_ENV=production
```

## 🎯 **第六步：测试和部署**

1. 保存环境变量后，Vercel会自动重新部署
2. 等待部署完成（2-5分钟）
3. 访问 `zhixing-zeta.vercel.app` 测试销售页面

## ✅ **验证步骤**

### 数据库连接验证
在PlanetScale控制台中运行：
```sql
SELECT 'PlanetScale连接成功!' as message;
SHOW TABLES;
```

### 应用功能验证
1. 销售页面创建链接 ✅
2. 购买页面显示支付信息 ✅  
3. 订单提交成功 ✅
4. 管理后台登录 ✅

## 📊 **PlanetScale免费额度**
- **存储**: 5GB
- **读取**: 10亿行/月
- **写入**: 1千万行/月
- **连接数**: 无限制

## 🆘 **常见问题**

### Q: 连接超时怎么办？
A: 检查防火墙设置，PlanetScale使用标准MySQL端口3306

### Q: 环境变量不生效？
A: 确保变量名完全正确，保存后等待Vercel重新部署

### Q: 表创建失败？
A: PlanetScale不支持外键约束，确保使用提供的SQL脚本

## 🔄 **下一步**
配置完成后，建议：
1. 定期备份数据
2. 监控使用量
3. 升级到付费计划（如需要）

---
**✨ 配置完成后，整个系统将使用真实的云数据库，数据安全可靠！** 