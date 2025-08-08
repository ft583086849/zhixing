-- 🔧 删除name字段（支付宝已移除，不再需要）
-- 在Supabase SQL编辑器中执行此脚本

-- ⚠️ 重要：执行前请备份数据！

-- 1. 修改primary_sales表，删除name字段的NOT NULL约束
ALTER TABLE primary_sales 
ALTER COLUMN name DROP NOT NULL;

-- 2. 修改secondary_sales表，删除name字段的NOT NULL约束  
ALTER TABLE secondary_sales
ALTER COLUMN name DROP NOT NULL;

-- 3. 可选：如果要完全删除name字段（谨慎操作）
-- ALTER TABLE primary_sales DROP COLUMN name;
-- ALTER TABLE secondary_sales DROP COLUMN name;

-- 4. 验证修改结果
SELECT 
    table_name,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name IN ('primary_sales', 'secondary_sales')
  AND column_name = 'name'
ORDER BY table_name;

-- 预期结果：
-- is_nullable 应该显示 'YES'，表示该字段可以为NULL

-- 5. 测试插入数据（不包含name字段）
-- INSERT INTO secondary_sales (
--     wechat_name,
--     payment_method,
--     chain_name,
--     payment_address,
--     sales_code,
--     sales_type,
--     created_at
-- ) VALUES (
--     '测试二级销售',
--     'crypto',
--     'ETH',
--     '0x123456',
--     'TEST_' || NOW()::TEXT,
--     'secondary',
--     NOW()
-- );

-- 如果插入成功，说明name字段的NOT NULL约束已成功移除
