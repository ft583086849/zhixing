-- ================================================
-- 生产环境数据清理脚本 - 立即执行版
-- 时间：2024年
-- 功能：清空所有测试数据，准备生产环境
-- ================================================

-- 步骤1：清空所有订单数据
DELETE FROM orders;

-- 步骤2：清空所有销售人员数据
DELETE FROM secondary_sales;
DELETE FROM primary_sales;

-- 步骤3：重置自增ID序列（PostgreSQL/Supabase）
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS primary_sales_id_seq RESTART WITH 1;  
ALTER SEQUENCE IF EXISTS secondary_sales_id_seq RESTART WITH 1;

-- 步骤4：验证清理结果
SELECT 
  '清理完成' as status,
  (SELECT COUNT(*) FROM orders) as orders_count,
  (SELECT COUNT(*) FROM primary_sales) as primary_sales_count,
  (SELECT COUNT(*) FROM secondary_sales) as secondary_sales_count;

-- ================================================
-- 清理完成！系统已准备好投入使用
-- ================================================
