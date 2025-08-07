-- 🔧 快速修复二级销售查询问题
-- 在 Supabase SQL Editor 中执行这些命令

-- 1. 查看 Zhixing 是否存在于二级销售表中
SELECT * FROM secondary_sales 
WHERE wechat_name = 'Zhixing';

-- 2. 如果 Zhixing 不存在，需要先注册为二级销售
-- 请先确认其对应的一级销售信息，然后使用正确的 primary_sales_id
/*
INSERT INTO secondary_sales (
    wechat_name,
    sales_code,
    payment_account,
    payment_method,
    primary_sales_id,
    commission_rate,
    created_at,
    updated_at
) VALUES (
    'Zhixing',
    'SEC_ZHIXING_' || extract(epoch from now())::text,
    '支付宝账号或银行卡号',
    'alipay', -- 或 'bank_transfer'
    (SELECT id FROM primary_sales WHERE wechat_name = '一级销售微信号'), -- 替换为实际的一级销售微信号
    0.1, -- 10% 佣金率
    now(),
    now()
);
*/

-- 3. 查看 Zhixing 的订单数据
SELECT 
    COUNT(*) as order_count,
    SUM(amount) as total_amount,
    COUNT(CASE WHEN config_confirmed = true THEN 1 END) as confirmed_orders
FROM orders 
WHERE sales_code IN (
    SELECT sales_code FROM secondary_sales WHERE wechat_name = 'Zhixing'
);

-- 4. 检查是否有订单关联到 Zhixing
SELECT 
    o.*,
    s.wechat_name as sales_wechat
FROM orders o
LEFT JOIN secondary_sales s ON o.sales_code = s.sales_code
WHERE s.wechat_name = 'Zhixing'
ORDER BY o.created_at DESC
LIMIT 10;

-- 5. 如果需要，更新订单的 sales_code 以关联到 Zhixing
-- 注意：只有确认这些订单确实属于 Zhixing 时才执行
/*
UPDATE orders 
SET sales_code = (
    SELECT sales_code FROM secondary_sales WHERE wechat_name = 'Zhixing' LIMIT 1
)
WHERE customer_wechat IN ('客户微信1', '客户微信2'); -- 替换为实际的客户微信号
*/

