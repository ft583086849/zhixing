-- =====================================================
-- 为 sales_optimized 表添加 chain_name 字段并迁移数据
-- =====================================================

-- 1. 添加 chain_name 和 payment_account 字段（如果不存在）
ALTER TABLE sales_optimized 
ADD COLUMN IF NOT EXISTS chain_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_account VARCHAR(255);

-- 2. 从 primary_sales 表迁移链名和支付地址
UPDATE sales_optimized so
SET 
  chain_name = ps.chain_name,
  payment_account = ps.payment_address
FROM primary_sales ps
WHERE so.sales_code = ps.sales_code
  AND so.sales_type = 'primary';

-- 3. 从 secondary_sales 表迁移链名和支付地址
UPDATE sales_optimized so
SET 
  chain_name = ss.chain_name,
  payment_account = ss.payment_address
FROM secondary_sales ss
WHERE so.sales_code = ss.sales_code
  AND so.sales_type IN ('secondary', 'independent');

-- 4. 确保 payment_info 字段也有值（如果 payment_account 为空）
UPDATE sales_optimized
SET payment_info = payment_account
WHERE payment_info IS NULL 
  AND payment_account IS NOT NULL;

-- 5. 验证更新结果
SELECT 
  sales_type,
  COUNT(*) as total_count,
  COUNT(chain_name) as has_chain_name,
  COUNT(payment_account) as has_payment_account,
  COUNT(payment_info) as has_payment_info
FROM sales_optimized
GROUP BY sales_type
ORDER BY sales_type;

-- 6. 显示一些有链名的记录样例
SELECT 
  sales_code,
  wechat_name,
  sales_type,
  chain_name,
  CASE 
    WHEN LENGTH(payment_account) > 20 THEN 
      CONCAT(SUBSTRING(payment_account, 1, 10), '...', SUBSTRING(payment_account, -6))
    ELSE payment_account
  END as payment_account_display
FROM sales_optimized
WHERE chain_name IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 7. 检查链名分布
SELECT 
  chain_name,
  COUNT(*) as count
FROM sales_optimized
WHERE chain_name IS NOT NULL
GROUP BY chain_name
ORDER BY count DESC;