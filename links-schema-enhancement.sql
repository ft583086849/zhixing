-- 销售链接展示功能数据库架构增强
-- 支持一级销售双链接和二级销售单链接展示
-- 版本：v4.1
-- 日期：2025-01-30

-- 1. 创建新的链接类型枚举和字段
ALTER TABLE links ADD COLUMN IF NOT EXISTS primary_sales_code VARCHAR(8) UNIQUE COMMENT '一级销售面向二级销售的链接代码';
ALTER TABLE links ADD COLUMN IF NOT EXISTS primary_user_code VARCHAR(8) UNIQUE COMMENT '一级销售面向用户的链接代码';
ALTER TABLE links ADD COLUMN IF NOT EXISTS secondary_user_code VARCHAR(8) UNIQUE COMMENT '二级销售面向用户的链接代码';

-- 2. 确保链接代码全局唯一性约束
ALTER TABLE links ADD CONSTRAINT unique_primary_sales_code UNIQUE (primary_sales_code);
ALTER TABLE links ADD CONSTRAINT unique_primary_user_code UNIQUE (primary_user_code);
ALTER TABLE links ADD CONSTRAINT unique_secondary_user_code UNIQUE (secondary_user_code);

-- 3. 为链接代码添加索引优化查询
CREATE INDEX IF NOT EXISTS idx_primary_sales_code ON links(primary_sales_code);
CREATE INDEX IF NOT EXISTS idx_primary_user_code ON links(primary_user_code);
CREATE INDEX IF NOT EXISTS idx_secondary_user_code ON links(secondary_user_code);

-- 4. 创建链接代码生成函数
DELIMITER //
CREATE FUNCTION IF NOT EXISTS GenerateUniqueCode() 
RETURNS VARCHAR(8)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE new_code VARCHAR(8);
    DECLARE code_exists INT DEFAULT 1;
    DECLARE chars VARCHAR(62) DEFAULT 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    WHILE code_exists > 0 DO
        SET new_code = '';
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        SET new_code = CONCAT(new_code, SUBSTRING(chars, FLOOR(1 + RAND() * 62), 1));
        
        -- 检查所有链接代码表中是否存在
        SELECT COUNT(*) INTO code_exists
        FROM links 
        WHERE link_code = new_code 
           OR primary_sales_code = new_code 
           OR primary_user_code = new_code 
           OR secondary_user_code = new_code;
    END WHILE;
    
    RETURN new_code;
END//
DELIMITER ;

-- 5. 创建存储过程：为现有销售生成链接代码
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS GenerateLinksForExistingSales()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE sales_id INT;
    DECLARE sales_type VARCHAR(20);
    DECLARE primary_sales_code VARCHAR(8);
    DECLARE primary_user_code VARCHAR(8);
    DECLARE secondary_user_code VARCHAR(8);
    
    DECLARE sales_cursor CURSOR FOR 
        SELECT s.id, s.sales_type 
        FROM sales s 
        JOIN links l ON s.id = l.sales_id 
        WHERE (s.sales_type = 'primary' AND (l.primary_sales_code IS NULL OR l.primary_user_code IS NULL))
           OR (s.sales_type = 'secondary' AND l.secondary_user_code IS NULL);
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN sales_cursor;
    
    read_loop: LOOP
        FETCH sales_cursor INTO sales_id, sales_type;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        IF sales_type = 'primary' THEN
            SET primary_sales_code = GenerateUniqueCode();
            SET primary_user_code = GenerateUniqueCode();
            
            UPDATE links 
            SET primary_sales_code = primary_sales_code,
                primary_user_code = primary_user_code
            WHERE sales_id = sales_id;
            
        ELSEIF sales_type = 'secondary' THEN
            SET secondary_user_code = GenerateUniqueCode();
            
            UPDATE links 
            SET secondary_user_code = secondary_user_code
            WHERE sales_id = sales_id;
        END IF;
    END LOOP;
    
    CLOSE sales_cursor;
END//
DELIMITER ;

-- 6. 创建视图：销售链接完整信息视图
CREATE OR REPLACE VIEW sales_links_view AS
SELECT 
    s.id as sales_id,
    s.wechat_name,
    s.sales_type,
    l.id as link_id,
    l.link_code as original_code,
    l.primary_sales_code,
    l.primary_user_code,
    l.secondary_user_code,
    CASE 
        WHEN s.sales_type = 'primary' THEN 2
        WHEN s.sales_type = 'secondary' THEN 1
        ELSE 0
    END as link_count,
    s.created_at,
    s.updated_at
FROM sales s
JOIN links l ON s.id = l.sales_id
WHERE s.sales_type IN ('primary', 'secondary');

-- 7. 触发器：新销售创建时自动生成链接代码
DELIMITER //
CREATE TRIGGER IF NOT EXISTS generate_codes_after_link_insert
AFTER INSERT ON links
FOR EACH ROW
BEGIN
    DECLARE sales_type VARCHAR(20);
    DECLARE primary_sales_code VARCHAR(8);
    DECLARE primary_user_code VARCHAR(8);
    DECLARE secondary_user_code VARCHAR(8);
    
    -- 获取销售类型
    SELECT s.sales_type INTO sales_type
    FROM sales s
    WHERE s.id = NEW.sales_id;
    
    IF sales_type = 'primary' THEN
        SET primary_sales_code = GenerateUniqueCode();
        SET primary_user_code = GenerateUniqueCode();
        
        UPDATE links 
        SET primary_sales_code = primary_sales_code,
            primary_user_code = primary_user_code
        WHERE id = NEW.id;
        
    ELSEIF sales_type = 'secondary' THEN
        SET secondary_user_code = GenerateUniqueCode();
        
        UPDATE links 
        SET secondary_user_code = secondary_user_code
        WHERE id = NEW.id;
    END IF;
END//
DELIMITER ;

-- 8. 为现有数据生成链接代码
CALL GenerateLinksForExistingSales();

-- 完成链接架构增强
SELECT 'Links schema enhancement completed successfully!' as status;