-- 添加缺失的字段到 sales_optimized 表
ALTER TABLE sales_optimized 
ADD COLUMN IF NOT EXISTS real_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_account VARCHAR(255),
ADD COLUMN IF NOT EXISTS chain_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS alipay_account VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);

-- 从原表迁移真实姓名和链名数据
-- 更新一级销售
UPDATE sales_optimized so
SET 
  real_name = COALESCE(ps.real_name, ps.name),
  chain_name = ps.chain_name,
  payment_account = ps.payment_address
FROM primary_sales ps
WHERE so.sales_code = ps.sales_code
  AND so.sales_type = 'primary';

-- 更新二级/独立销售
UPDATE sales_optimized so
SET 
  real_name = COALESCE(ss.real_name, ss.name),
  chain_name = ss.chain_name,
  payment_account = ss.payment_address
FROM secondary_sales ss
WHERE so.sales_code = ss.sales_code
  AND so.sales_type IN ('secondary', 'independent');

-- 验证更新结果
SELECT 
  sales_code,
  wechat_name,
  real_name,
  chain_name,
  payment_account,
  payment_info
FROM sales_optimized
WHERE chain_name IS NOT NULL
LIMIT 10;