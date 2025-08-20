-- 添加收款相关字段到 sales_optimized 表
ALTER TABLE sales_optimized 
ADD COLUMN IF NOT EXISTS payment_account VARCHAR(255),
ADD COLUMN IF NOT EXISTS chain_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS alipay_account VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);

-- 更新收款信息（从原表迁移数据）
-- 更新一级销售的收款信息
UPDATE sales_optimized so
SET 
  payment_account = ps.payment_address,
  chain_name = ps.chain_name,
  payment_method = ps.payment_method,
  alipay_account = ps.alipay_account,
  bank_account = ps.bank_account
FROM primary_sales ps
WHERE so.sales_code = ps.sales_code
  AND so.sales_type = 'primary';

-- 更新二级/独立销售的收款信息
UPDATE sales_optimized so
SET 
  payment_account = ss.payment_address,
  chain_name = ss.chain_name,
  payment_method = ss.payment_method,
  alipay_account = ss.alipay_account,
  bank_account = ss.bank_account
FROM secondary_sales ss
WHERE so.sales_code = ss.sales_code
  AND so.sales_type IN ('secondary', 'independent');

-- 验证更新结果
SELECT 
  sales_type,
  COUNT(*) as total,
  COUNT(payment_account) as has_payment_account,
  COUNT(chain_name) as has_chain_name,
  COUNT(payment_method) as has_payment_method
FROM sales_optimized
GROUP BY sales_type
ORDER BY sales_type;

-- 显示一些有收款信息的记录
SELECT 
  sales_code,
  wechat_name,
  sales_type,
  payment_account,
  chain_name,
  payment_method,
  alipay_account,
  bank_account
FROM sales_optimized
WHERE payment_account IS NOT NULL
LIMIT 10;