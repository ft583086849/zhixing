-- 🔧 紧急修复销售注册失败 - 添加缺失的sales_type字段
-- 问题：代码发送sales_type字段，但数据库表中不存在该字段
-- 错误：Could not find the 'sales_type' column in the schema cache

-- ===============================================
-- 1. 为 primary_sales 表添加 sales_type 字段
-- ===============================================

ALTER TABLE primary_sales 
ADD COLUMN sales_type ENUM('primary', 'secondary', 'legacy') 
DEFAULT 'primary' 
COMMENT '销售类型：primary=一级销售, secondary=二级销售, legacy=历史销售';

-- ===============================================
-- 2. 为 secondary_sales 表添加 sales_type 字段  
-- ===============================================

ALTER TABLE secondary_sales 
ADD COLUMN sales_type ENUM('primary', 'secondary', 'legacy') 
DEFAULT 'secondary'
COMMENT '销售类型：primary=一级销售, secondary=二级销售, legacy=历史销售';

-- ===============================================
-- 3. 更新现有数据的sales_type值
-- ===============================================

-- 更新primary_sales表中的现有记录
UPDATE primary_sales 
SET sales_type = 'primary' 
WHERE sales_type IS NULL;

-- 更新secondary_sales表中的现有记录  
UPDATE secondary_sales 
SET sales_type = 'secondary' 
WHERE sales_type IS NULL;

-- ===============================================
-- 4. 验证修复结果
-- ===============================================

-- 检查primary_sales表结构
DESCRIBE primary_sales;

-- 检查secondary_sales表结构
DESCRIBE secondary_sales;

-- 验证数据更新
SELECT sales_type, COUNT(*) as count 
FROM primary_sales 
GROUP BY sales_type;

SELECT sales_type, COUNT(*) as count 
FROM secondary_sales 
GROUP BY sales_type;

-- ===============================================
-- 5. 测试插入操作（验证字段可用性）
-- ===============================================

-- 测试primary_sales插入
INSERT INTO primary_sales (
    wechat_name, 
    payment_method, 
    alipay_account, 
    name, 
    sales_type
) VALUES (
    'TEST_PRIMARY_VALIDATION', 
    'alipay', 
    'test@test.com', 
    '测试收款人', 
    'primary'
);

-- 测试secondary_sales插入
INSERT INTO secondary_sales (
    wechat_name, 
    payment_method, 
    alipay_account, 
    name, 
    sales_type
) VALUES (
    'TEST_SECONDARY_VALIDATION', 
    'alipay', 
    'test2@test.com', 
    '测试收款人2', 
    'secondary'
);

-- ===============================================
-- 6. 清理测试数据
-- ===============================================

-- 删除测试数据
DELETE FROM primary_sales WHERE wechat_name = 'TEST_PRIMARY_VALIDATION';
DELETE FROM secondary_sales WHERE wechat_name = 'TEST_SECONDARY_VALIDATION';

-- ===============================================
-- 修复完成提示
-- ===============================================

SELECT 'sales_type字段修复完成！' as status,
       '现在可以正常进行销售注册了' as message;