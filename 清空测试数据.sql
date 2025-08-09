-- ================================================
-- 生产环境数据清理脚本
-- 功能：清空所有测试数据，保留系统配置
-- 执行前请先备份数据！
-- ================================================

-- 1. 首先备份重要配置（如果需要保留）
-- SELECT * FROM payment_config WHERE is_active = true;
-- SELECT * FROM admin_users WHERE role = 'admin';

-- ================================================
-- 开始清理数据（按依赖关系顺序）
-- ================================================

-- 2. 清空订单相关表（最底层）
TRUNCATE TABLE orders CASCADE;
-- 或者使用 DELETE 更安全
-- DELETE FROM orders;

-- 3. 清空销售人员表
DELETE FROM secondary_sales;
DELETE FROM primary_sales;

-- 4. 清空支付配置（可选 - 如果要保留配置请注释掉）
-- DELETE FROM payment_config;

-- 5. 清空收益分配配置（可选 - 如果要保留配置请注释掉）
-- DELETE FROM profit_distribution;

-- 6. 清空管理员用户（可选 - 建议保留至少一个管理员）
-- DELETE FROM admin_users WHERE username != 'admin';

-- ================================================
-- 重置自增序列（PostgreSQL/Supabase）
-- ================================================

-- 重置订单ID序列
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;

-- 重置销售人员ID序列
ALTER SEQUENCE IF EXISTS primary_sales_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS secondary_sales_id_seq RESTART WITH 1;

-- ================================================
-- 插入初始数据（可选）
-- ================================================

-- 保留或创建默认管理员账号
-- INSERT INTO admin_users (username, password, role, created_at)
-- VALUES ('admin', '加密后的密码', 'admin', NOW())
-- ON CONFLICT (username) DO NOTHING;

-- 创建默认支付配置（如果删除了）
-- INSERT INTO payment_config (
--   alipay_account, alipay_name, 
--   crypto_chain_name, crypto_address,
--   is_active, created_at
-- ) VALUES (
--   '', '', 'TRC20', '', true, NOW()
-- ) ON CONFLICT DO NOTHING;

-- ================================================
-- 验证清理结果
-- ================================================

-- 检查各表记录数
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'primary_sales', COUNT(*) FROM primary_sales
UNION ALL
SELECT 'secondary_sales', COUNT(*) FROM secondary_sales;

-- ================================================
-- 完成提示
-- ================================================
-- 数据清理完成！
-- 请确认：
-- 1. 所有测试数据已清空
-- 2. 管理员账号仍可登录
-- 3. 系统配置正常
-- 4. 可以开始真实运营
