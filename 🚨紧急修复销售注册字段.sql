-- 🚨 紧急修复销售注册失败 - 添加缺失字段
-- 执行位置：Supabase SQL Editor

-- 1. 修复 primary_sales 表
ALTER TABLE primary_sales 
ADD COLUMN IF NOT EXISTS sales_type VARCHAR(20) DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS alipay_account VARCHAR(100),
ADD COLUMN IF NOT EXISTS chain_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS crypto_address TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 2. 修复 secondary_sales 表  
ALTER TABLE secondary_sales 
ADD COLUMN IF NOT EXISTS sales_type VARCHAR(20) DEFAULT 'secondary',
ADD COLUMN IF NOT EXISTS alipay_account VARCHAR(100),
ADD COLUMN IF NOT EXISTS chain_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS crypto_address TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 3. 更新现有记录的默认值
UPDATE primary_sales SET 
  sales_type = 'primary' WHERE sales_type IS NULL,
  alipay_account = payment_address WHERE alipay_account IS NULL AND payment_method = 'alipay',
  created_at = NOW() WHERE created_at IS NULL,
  updated_at = NOW() WHERE updated_at IS NULL;

UPDATE secondary_sales SET 
  sales_type = 'secondary' WHERE sales_type IS NULL,
  alipay_account = payment_address WHERE alipay_account IS NULL AND payment_method = 'alipay',
  created_at = NOW() WHERE created_at IS NULL,
  updated_at = NOW() WHERE updated_at IS NULL;

-- 4. 创建索引优化性能
CREATE INDEX IF NOT EXISTS idx_primary_sales_type ON primary_sales(sales_type);
CREATE INDEX IF NOT EXISTS idx_secondary_sales_type ON secondary_sales(sales_type);
CREATE INDEX IF NOT EXISTS idx_primary_sales_wechat ON primary_sales(wechat_name);
CREATE INDEX IF NOT EXISTS idx_secondary_sales_wechat ON secondary_sales(wechat_name);

-- 5. 验证字段是否添加成功
SELECT 'primary_sales字段检查' as table_check, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'primary_sales' 
AND column_name IN ('sales_type', 'alipay_account', 'chain_name', 'crypto_address')
ORDER BY column_name;

SELECT 'secondary_sales字段检查' as table_check, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'secondary_sales' 
AND column_name IN ('sales_type', 'alipay_account', 'chain_name', 'crypto_address')
ORDER BY column_name;

-- 完成提示
SELECT '🎉 字段修复完成！现在可以测试销售注册功能了' as status;