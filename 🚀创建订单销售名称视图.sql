-- 🚀 创建订单销售名称视图
-- 解决问题：让一级销售能看到具体的二级销售名字
-- 请在 Supabase SQL Editor 中执行此脚本

-- =============================================
-- 1. 创建视图：自动关联销售名字
-- =============================================
CREATE OR REPLACE VIEW orders_with_sales_names AS
SELECT 
  o.*,
  
  -- 添加二级销售详细信息
  s.wechat_name as secondary_sales_wechat_name,
  s.sales_code as secondary_sales_code,
  
  -- 添加一级销售详细信息
  p.wechat_name as primary_sales_wechat_name,
  p.sales_code as primary_sales_code,
  
  -- 生成显示名称（用于表格显示）
  CASE 
    WHEN o.sales_type = 'secondary' AND s.wechat_name IS NOT NULL 
      THEN s.wechat_name
    WHEN o.sales_type = 'secondary' 
      THEN '二级销售'
    ELSE '直接销售'
  END as sales_display_name,
  
  -- 判断销售类型的详细描述
  CASE 
    WHEN o.sales_type = 'secondary' AND s.wechat_name IS NOT NULL 
      THEN '二级销售 - ' || s.wechat_name
    WHEN o.sales_type = 'secondary' 
      THEN '二级销售 - 未知'
    WHEN o.sales_type = 'primary' 
      THEN '一级销售直接订单'
    ELSE '直接销售'
  END as sales_type_description

FROM orders o
LEFT JOIN secondary_sales s ON o.secondary_sales_id = s.id
LEFT JOIN primary_sales p ON o.primary_sales_id = p.id;

-- =============================================
-- 2. 授权访问权限
-- =============================================
GRANT SELECT ON orders_with_sales_names TO anon;
GRANT SELECT ON orders_with_sales_names TO authenticated;
GRANT SELECT ON orders_with_sales_names TO service_role;

-- =============================================
-- 3. 创建索引优化查询性能
-- =============================================
-- 如果还没有这些索引，创建它们
CREATE INDEX IF NOT EXISTS idx_orders_secondary_sales_id ON orders(secondary_sales_id);
CREATE INDEX IF NOT EXISTS idx_orders_primary_sales_id ON orders(primary_sales_id);
CREATE INDEX IF NOT EXISTS idx_orders_sales_type ON orders(sales_type);

-- =============================================
-- 4. 测试视图
-- =============================================
-- 查看视图数据
SELECT 
  order_number,
  customer_wechat,
  amount,
  sales_type,
  sales_display_name,
  sales_type_description,
  secondary_sales_wechat_name,
  status
FROM orders_with_sales_names
LIMIT 10;

-- =============================================
-- 5. 验证结果
-- =============================================
-- 统计各类型订单
SELECT 
  sales_type,
  sales_display_name,
  COUNT(*) as order_count,
  SUM(amount) as total_amount
FROM orders_with_sales_names
GROUP BY sales_type, sales_display_name
ORDER BY sales_type, sales_display_name;

-- =============================================
-- 使用说明
-- =============================================
-- 前端代码修改：
-- 原来：supabase.from('orders').select('*')
-- 改为：supabase.from('orders_with_sales_names').select('*')
-- 
-- 然后可以直接使用：
-- - secondary_sales_wechat_name: 二级销售的微信名
-- - sales_display_name: 用于表格显示的名称
-- - sales_type_description: 详细的销售类型描述
