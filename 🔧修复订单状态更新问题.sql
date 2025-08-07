-- ================================================
-- 修复订单状态更新问题
-- 请在Supabase控制台的SQL编辑器中执行
-- ================================================

-- 1. 完全禁用orders表的RLS（包括读写权限）
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 2. 检查orders表的结构，确认id字段类型
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('id', 'order_number', 'status', 'updated_at')
ORDER BY ordinal_position;

-- 3. 查看前几条订单数据，了解ID格式
SELECT id, order_number, status, created_at, updated_at 
FROM orders 
LIMIT 5;

-- 4. 测试更新一条订单（使用实际的订单ID）
-- 注意：请将下面的 1 替换为实际的订单ID
-- UPDATE orders 
-- SET status = 'confirmed_payment', 
--     updated_at = NOW() 
-- WHERE id = 1;

-- 5. 如果orders表的updated_at字段不存在，添加它
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 6. 创建或更新触发器，自动更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 验证RLS是否完全禁用
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('orders', 'primary_sales', 'secondary_sales', 'admins');

-- 8. 授予anon角色完整权限（如果需要）
GRANT ALL ON orders TO anon;
GRANT ALL ON primary_sales TO anon;
GRANT ALL ON secondary_sales TO anon;
