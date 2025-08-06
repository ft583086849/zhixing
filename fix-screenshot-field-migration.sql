-- 修复截图字段类型问题
-- 将screenshot_path字段从VARCHAR(500)改为LONGTEXT以支持Base64图片数据

-- 查看当前字段类型
DESCRIBE orders;

-- 修改字段类型
ALTER TABLE orders 
MODIFY COLUMN screenshot_path LONGTEXT COMMENT '付款截图数据（Base64格式）';

-- 验证修改结果
DESCRIBE orders;

-- 显示修改后的字段信息
SHOW FULL COLUMNS FROM orders WHERE Field = 'screenshot_path';