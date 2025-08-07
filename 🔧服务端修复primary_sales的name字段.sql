-- ========================================
-- 🔧 服务端修复 primary_sales 表 name 字段问题
-- ========================================

-- 问题：线上地址收款时 name 字段为 null 导致插入失败
-- 解决方案：添加默认值或触发器自动填充

-- 方案1：修改字段默认值（推荐）
-- 给 name 字段添加默认值，这样即使没有传入也不会报错
ALTER TABLE primary_sales 
ALTER COLUMN name SET DEFAULT '线上客户';

-- 方案2：创建触发器自动填充（备选）
-- 如果方案1不行，可以使用触发器
CREATE OR REPLACE FUNCTION fix_primary_sales_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果 name 为空，自动填充
  IF NEW.name IS NULL OR NEW.name = '' THEN
    -- 尝试从其他字段获取
    IF NEW.wechat_name IS NOT NULL AND NEW.wechat_name != '' THEN
      NEW.name = NEW.wechat_name;
    ELSIF NEW.customer_name IS NOT NULL AND NEW.customer_name != '' THEN
      NEW.name = NEW.customer_name;
    ELSE
      -- 根据支付方式设置默认值
      IF NEW.payment_method = 'alipay' THEN
        NEW.name = '支付宝客户';
      ELSIF NEW.payment_method = 'wechat' THEN
        NEW.name = '微信客户';
      ELSE
        NEW.name = '线上客户';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER ensure_primary_sales_name
BEFORE INSERT OR UPDATE ON primary_sales
FOR EACH ROW
EXECUTE FUNCTION fix_primary_sales_name();

-- 方案3：修改表约束（最灵活）
-- 先删除非空约束
ALTER TABLE primary_sales 
ALTER COLUMN name DROP NOT NULL;

-- 然后添加检查约束，允许特定的默认值
ALTER TABLE primary_sales 
ADD CONSTRAINT check_name_not_empty
CHECK (name IS NOT NULL AND name != '');

-- 方案4：创建视图或存储过程处理插入
-- 创建一个安全的插入函数
CREATE OR REPLACE FUNCTION safe_insert_primary_sales(
  p_sales_code VARCHAR,
  p_sales_type VARCHAR,
  p_name VARCHAR DEFAULT NULL,
  p_wechat_name VARCHAR DEFAULT NULL,
  p_amount DECIMAL DEFAULT 0,
  p_payment_method VARCHAR DEFAULT 'online'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO primary_sales (
    sales_code,
    sales_type,
    name,
    wechat_name,
    amount,
    payment_method,
    created_at
  ) VALUES (
    p_sales_code,
    p_sales_type,
    COALESCE(p_name, p_wechat_name, '线上客户'), -- 自动填充 name
    p_wechat_name,
    p_amount,
    p_payment_method,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 📋 使用说明
-- ========================================
-- 1. 登录 Supabase 控制台
-- 2. 进入 SQL Editor
-- 3. 选择合适的方案执行（推荐方案1）
-- 4. 执行后测试线上地址收款功能

-- 测试查询：查看当前表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'primary_sales'
  AND column_name = 'name';

-- 测试插入（验证修复是否生效）
-- INSERT INTO primary_sales (sales_code, sales_type, amount, payment_method)
-- VALUES ('TEST001', 'online', 100, 'online_address');
