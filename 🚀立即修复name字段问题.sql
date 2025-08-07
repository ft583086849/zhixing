-- ========================================
-- 🚀 立即修复线上地址码收款 name 字段问题
-- ========================================
-- 
-- 问题：线上地址码收款时没有 name 输入框，导致插入失败
-- 解决：在数据库层面处理，不污染数据

-- 方案1：修改字段约束（简单直接）
-- 让 name 字段可以为空，这样不会报错
ALTER TABLE primary_sales 
ALTER COLUMN name DROP NOT NULL;

-- 方案2：添加默认值（推荐）
-- 保持非空约束，但提供默认值
ALTER TABLE primary_sales 
ALTER COLUMN name SET DEFAULT '线上用户';

-- 方案3：智能触发器（最佳方案）
-- 根据支付方式智能处理 name 字段
CREATE OR REPLACE FUNCTION smart_handle_sales_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在 name 为空且是线上地址码支付时处理
  IF (NEW.name IS NULL OR NEW.name = '') AND NEW.payment_method = 'crypto' THEN
    -- 设置一个合理的默认值
    NEW.name = '线上用户';
  END IF;
  
  -- 支付宝必须有真实姓名
  IF NEW.payment_method = 'alipay' AND (NEW.name IS NULL OR NEW.name = '') THEN
    RAISE EXCEPTION '支付宝收款必须提供收款人姓名';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS smart_handle_sales_name_trigger ON primary_sales;

-- 创建新触发器
CREATE TRIGGER smart_handle_sales_name_trigger
BEFORE INSERT OR UPDATE ON primary_sales
FOR EACH ROW
EXECUTE FUNCTION smart_handle_sales_name();

-- ========================================
-- 修复现有数据（如果需要）
-- ========================================
-- 查看有多少记录 name 为空
SELECT COUNT(*) as empty_name_count
FROM primary_sales
WHERE name IS NULL OR name = '';

-- 修复现有的空数据
UPDATE primary_sales 
SET name = CASE 
  WHEN payment_method = 'crypto' THEN '线上用户'
  ELSE COALESCE(wechat_name, '未知用户')
END
WHERE name IS NULL OR name = '';

-- ========================================
-- 验证修复
-- ========================================
-- 测试插入线上地址码收款（不提供 name）
-- 应该成功，name 自动设置为 '线上用户'
/*
INSERT INTO primary_sales (
  sales_code, 
  wechat_name, 
  payment_method, 
  payment_address,
  sales_type
) VALUES (
  'TEST_CRYPTO_001',
  'test_wechat',
  'crypto',
  '0x123456',
  'primary'
);
*/

-- 查看结果
SELECT sales_code, wechat_name, name, payment_method 
FROM primary_sales 
WHERE sales_code = 'TEST_CRYPTO_001';

-- ========================================
-- 使用说明
-- ========================================
-- 1. 登录 Supabase 控制台
-- 2. 进入 SQL Editor
-- 3. 选择执行方案3（智能触发器）- 推荐
-- 4. 执行后测试线上地址码收款功能
-- 
-- 效果：
-- - 线上地址码收款时，name 自动设置为 '线上用户'
-- - 支付宝收款时，仍然要求填写真实姓名
-- - 不会产生脏数据，不会影响现有逻辑
