
-- 生产环境数据库部署脚本
-- 执行时间: 2025-08-17T14:27:22.483Z

-- 1. 验证orders_optimized表是否存在
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'orders_optimized';

-- 2. 同步最新数据（如果需要）
INSERT INTO orders_optimized
SELECT * FROM orders 
WHERE id NOT IN (SELECT id FROM orders_optimized)
ON CONFLICT (id) DO NOTHING;

-- 3. 验证数据一致性
SELECT 
  (SELECT COUNT(*) FROM orders) as orders_count,
  (SELECT COUNT(*) FROM orders_optimized) as optimized_count,
  (SELECT MAX(created_at) FROM orders) as orders_latest,
  (SELECT MAX(created_at) FROM orders_optimized) as optimized_latest;

-- 4. 创建或更新触发器（如果还没创建）
-- 执行 create-auto-sync-trigger.sql
