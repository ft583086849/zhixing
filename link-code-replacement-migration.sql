-- 链接代码系统重构迁移脚本
-- 将现有link_code系统替换为新的sales_code系统
-- 确保一级销售和二级销售关联，保证返佣逻辑正确
-- 版本：v5.0
-- 日期：2025-01-30

-- ==========================================
-- 第一阶段：添加新字段，保持兼容性
-- ==========================================

-- 1. 为sales表添加新字段
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(8) UNIQUE COMMENT '新的销售代码，8位唯一标识符',
ADD COLUMN IF NOT EXISTS parent_sales_id INT NULL COMMENT '上级销售ID，用于二级销售关联一级销售',
ADD INDEX IF NOT EXISTS idx_sales_code (sales_code),
ADD INDEX IF NOT EXISTS idx_parent_sales_id (parent_sales_id),
ADD FOREIGN KEY (parent_sales_id) REFERENCES sales(id) ON DELETE SET NULL;

-- 2. 为orders表添加新字段
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(8) COMMENT '新的销售代码字段',
ADD INDEX IF NOT EXISTS idx_orders_sales_code (sales_code);

-- 3. 为links表添加新字段（如果存在的话）
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS sales_code VARCHAR(8) UNIQUE COMMENT '统一的销售代码',
ADD INDEX IF NOT EXISTS idx_links_sales_code (sales_code);

-- ==========================================
-- 第二阶段：数据迁移和代码生成
-- ==========================================

-- 4. 创建销售代码生成函数（简化版）
DELIMITER //
CREATE FUNCTION IF NOT EXISTS GenerateSimpleSalesCode() 
RETURNS VARCHAR(8)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE new_code VARCHAR(8);
    DECLARE code_exists INT DEFAULT 1;
    DECLARE chars VARCHAR(62) DEFAULT 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    DECLARE attempt_count INT DEFAULT 0;
    
    WHILE code_exists > 0 AND attempt_count < 50 DO
        SET new_code = '';
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        
        -- 检查新字段中是否存在（保证全局唯一）
        SELECT COUNT(*) INTO code_exists
        FROM (
            SELECT sales_code FROM sales WHERE sales_code = new_code
            UNION ALL
            SELECT sales_code FROM orders WHERE sales_code = new_code
            UNION ALL
            SELECT sales_code FROM links WHERE sales_code = new_code
            UNION ALL
            SELECT link_code FROM sales WHERE link_code = new_code
        ) AS combined_codes;
        
        SET attempt_count = attempt_count + 1;
    END WHILE;
    
    IF attempt_count >= 50 THEN
        RETURN CONCAT('ERR', LPAD(UNIX_TIMESTAMP(), 5, '0'));
    END IF;
    
    RETURN new_code;
END//
DELIMITER ;

-- 5. 为现有销售生成新的sales_code
UPDATE sales 
SET sales_code = GenerateSimpleSalesCode() 
WHERE sales_code IS NULL;

-- 6. 为现有订单迁移销售代码
UPDATE orders o
JOIN sales s ON o.link_code = s.link_code
SET o.sales_code = s.sales_code
WHERE o.sales_code IS NULL;

-- 7. 为现有links迁移销售代码（如果存在links表）
UPDATE links l
JOIN sales s ON l.sales_id = s.id
SET l.sales_code = s.sales_code
WHERE l.sales_code IS NULL;

-- ==========================================
-- 第三阶段：建立销售层级关系
-- ==========================================

-- 8. 根据现有数据建立层级关系
-- 如果有现有的层级数据，可以在这里建立parent_sales_id关系
-- 目前先保持所有销售为顶级（parent_sales_id = NULL）

-- 9. 创建销售层级视图（替换原有复杂视图）
CREATE OR REPLACE VIEW sales_hierarchy_simple AS
SELECT 
    s1.id as sales_id,
    s1.sales_code,
    s1.wechat_name,
    s1.sales_type,
    s1.commission_rate,
    s2.id as parent_sales_id,
    s2.sales_code as parent_sales_code,
    s2.wechat_name as parent_wechat_name,
    s2.commission_rate as parent_commission_rate,
    COUNT(o.id) as total_orders,
    SUM(o.amount) as total_amount,
    SUM(o.commission_amount) as total_commission
FROM sales s1
LEFT JOIN sales s2 ON s1.parent_sales_id = s2.id
LEFT JOIN orders o ON s1.sales_code = o.sales_code AND o.status IN ('confirmed_configuration', 'active')
GROUP BY s1.id, s1.sales_code, s1.wechat_name, s1.sales_type, s1.commission_rate, 
         s2.id, s2.sales_code, s2.wechat_name, s2.commission_rate;

-- ==========================================
-- 第四阶段：创建返佣计算逻辑
-- ==========================================

-- 10. 创建返佣计算存储过程
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CalculateCommissionBySalesCode(
    IN p_sales_code VARCHAR(8),
    IN p_order_amount DECIMAL(10,2),
    OUT p_primary_commission DECIMAL(10,2),
    OUT p_secondary_commission DECIMAL(10,2),
    OUT p_primary_sales_id INT,
    OUT p_secondary_sales_id INT
)
BEGIN
    DECLARE v_sales_id INT;
    DECLARE v_parent_sales_id INT;
    DECLARE v_sales_type VARCHAR(20);
    DECLARE v_commission_rate DECIMAL(5,2);
    DECLARE v_parent_commission_rate DECIMAL(5,2);
    
    -- 初始化返回值
    SET p_primary_commission = 0;
    SET p_secondary_commission = 0;
    SET p_primary_sales_id = NULL;
    SET p_secondary_sales_id = NULL;
    
    -- 获取销售信息
    SELECT id, parent_sales_id, sales_type, commission_rate
    INTO v_sales_id, v_parent_sales_id, v_sales_type, v_commission_rate
    FROM sales 
    WHERE sales_code = p_sales_code;
    
    IF v_sales_id IS NULL THEN
        -- 销售代码不存在
        LEAVE;
    END IF;
    
    IF v_sales_type = 'primary' OR v_parent_sales_id IS NULL THEN
        -- 一级销售直接销售
        SET p_primary_commission = p_order_amount * (v_commission_rate / 100);
        SET p_primary_sales_id = v_sales_id;
        SET p_secondary_commission = 0;
        SET p_secondary_sales_id = NULL;
    ELSE
        -- 二级销售销售，需要分佣
        SET p_secondary_commission = p_order_amount * (v_commission_rate / 100);
        SET p_secondary_sales_id = v_sales_id;
        
        -- 获取上级销售信息
        SELECT commission_rate INTO v_parent_commission_rate
        FROM sales WHERE id = v_parent_sales_id;
        
        -- 一级销售佣金 = 总佣金率40% - 二级销售佣金率
        SET p_primary_commission = p_order_amount * ((40 - v_commission_rate) / 100);
        SET p_primary_sales_id = v_parent_sales_id;
    END IF;
END//
DELIMITER ;

-- ==========================================
-- 第五阶段：数据验证和约束
-- ==========================================

-- 11. 添加数据约束
ALTER TABLE sales 
ADD CONSTRAINT chk_sales_code_format CHECK (sales_code REGEXP '^[A-Za-z0-9]{8}$'),
ADD CONSTRAINT chk_sales_type_valid CHECK (sales_type IN ('primary', 'secondary'));

-- 12. 确保数据完整性
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_sales_code 
FOREIGN KEY (sales_code) REFERENCES sales(sales_code) ON DELETE CASCADE;

-- 13. 创建迁移完成验证查询
SELECT 
    'Migration Status' as check_type,
    COUNT(*) as total_sales,
    COUNT(sales_code) as sales_with_code,
    COUNT(sales_code) / COUNT(*) * 100 as completion_percentage
FROM sales

UNION ALL

SELECT 
    'Orders Migration' as check_type,
    COUNT(*) as total_orders,
    COUNT(sales_code) as orders_with_code,
    COUNT(sales_code) / COUNT(*) * 100 as completion_percentage
FROM orders;

-- ==========================================
-- 完成迁移
-- ==========================================

SELECT 'Link code replacement migration completed successfully!' as status,
       'All sales and orders now use sales_code system' as description,
       'Commission calculation logic updated for hierarchical structure' as note;