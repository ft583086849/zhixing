-- 📊 将旧的payment_address数据迁移到payment_account字段
-- 解决前台看不到收款地址的问题

-- 1. 更新一级销售表：将payment_address的值复制到payment_account
UPDATE primary_sales 
SET payment_account = payment_address 
WHERE payment_address IS NOT NULL 
  AND payment_address != ''
  AND payment_address != '未设置'
  AND (payment_account IS NULL OR payment_account = '' OR payment_account = '未设置');

-- 2. 更新二级销售表：将payment_address的值复制到payment_account  
UPDATE secondary_sales
SET payment_account = payment_address
WHERE payment_address IS NOT NULL
  AND payment_address != ''
  AND payment_address != '未设置'
  AND (payment_account IS NULL OR payment_account = '' OR payment_account = '未设置');

-- 3. 查看迁移结果
SELECT 
  wechat_name,
  chain_name,
  payment_address,
  payment_account,
  CASE 
    WHEN payment_account IS NOT NULL AND payment_account != '' AND payment_account != '未设置' 
    THEN '✅ 已修复'
    ELSE '❌ 待修复'
  END as status
FROM primary_sales
WHERE wechat_name = 'Kevin_十三';

-- 查看所有需要修复的记录
SELECT 
  '一级销售' as type,
  wechat_name,
  payment_address,
  payment_account
FROM primary_sales
WHERE payment_address IS NOT NULL 
  AND payment_address != ''
  AND payment_address != '未设置'
UNION ALL
SELECT 
  '二级销售' as type,
  wechat_name,
  payment_address,
  payment_account
FROM secondary_sales
WHERE payment_address IS NOT NULL
  AND payment_address != ''
  AND payment_address != '未设置';
