-- 🚀 快速添加张三和王五的测试数据
-- 在 Supabase SQL Editor 中执行

-- ========================================
-- 1. 先检查是否已存在
-- ========================================
SELECT 
    '检查结果' as title,
    (SELECT COUNT(*) FROM primary_sales WHERE wechat_name = '张三') as 张三是否存在,
    (SELECT COUNT(*) FROM secondary_sales WHERE wechat_name = '王五') as 王五是否存在;

-- ========================================
-- 2. 如果张三不存在，添加张三（一级销售）
-- ========================================
INSERT INTO primary_sales (
    wechat_name,
    sales_code,
    commission_rate,
    payment_method,
    payment_account,
    secondary_registration_code,
    created_at,
    updated_at
) 
SELECT 
    '张三',
    'PRI_ZHANGSAN_' || FLOOR(EXTRACT(EPOCH FROM NOW()))::text,
    0.4,  -- 40%佣金率
    'alipay',
    'zhangsan@alipay.com',
    'SEC_REG_ZHANGSAN_' || FLOOR(EXTRACT(EPOCH FROM NOW()))::text,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM primary_sales WHERE wechat_name = '张三'
);

-- ========================================
-- 3. 如果王五不存在，添加王五（张三的二级销售）
-- ========================================
INSERT INTO secondary_sales (
    wechat_name,
    sales_code,
    commission_rate,
    primary_sales_id,
    payment_method,
    payment_account,
    created_at,
    updated_at
)
SELECT 
    '王五',
    'SEC_WANGWU_' || FLOOR(EXTRACT(EPOCH FROM NOW()))::text,
    0.1,  -- 10%佣金率
    (SELECT id FROM primary_sales WHERE wechat_name = '张三' LIMIT 1),
    'bank_transfer',
    '6222000000000000',  -- 示例银行卡号
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM secondary_sales WHERE wechat_name = '王五'
);

-- ========================================
-- 4. 为张三添加测试订单（可选）
-- ========================================
INSERT INTO orders (
    customer_wechat,
    tradingview_username,
    amount,
    sales_code,
    status,
    config_confirmed,
    payment_date,
    commission_amount,
    created_at,
    updated_at
)
SELECT 
    '测试客户1',
    'test_user_1',
    5000,  -- 5000元订单
    sales_code,
    'completed',
    true,  -- 已确认
    NOW(),
    5000 * 0.4,  -- 佣金 = 金额 * 40%
    NOW(),
    NOW()
FROM primary_sales 
WHERE wechat_name = '张三'
AND NOT EXISTS (
    SELECT 1 FROM orders 
    WHERE sales_code = (SELECT sales_code FROM primary_sales WHERE wechat_name = '张三')
    AND customer_wechat = '测试客户1'
);

-- ========================================
-- 5. 为王五添加测试订单（可选）
-- ========================================
INSERT INTO orders (
    customer_wechat,
    tradingview_username,
    amount,
    sales_code,
    status,
    config_confirmed,
    payment_date,
    commission_amount,
    created_at,
    updated_at
)
SELECT 
    '测试客户2',
    'test_user_2',
    3000,  -- 3000元订单
    sales_code,
    'completed',
    true,  -- 已确认
    NOW(),
    3000 * 0.1,  -- 佣金 = 金额 * 10%
    NOW(),
    NOW()
FROM secondary_sales 
WHERE wechat_name = '王五'
AND NOT EXISTS (
    SELECT 1 FROM orders 
    WHERE sales_code = (SELECT sales_code FROM secondary_sales WHERE wechat_name = '王五')
    AND customer_wechat = '测试客户2'
);

-- ========================================
-- 6. 验证数据
-- ========================================
SELECT 
    '一级销售 - 张三' as type,
    ps.wechat_name,
    ps.sales_code,
    ps.commission_rate,
    pss.total_orders,
    pss.total_amount,
    pss.total_commission
FROM primary_sales ps
LEFT JOIN primary_sales_stats pss ON ps.wechat_name = pss.wechat_name
WHERE ps.wechat_name = '张三';

SELECT 
    '二级销售 - 王五' as type,
    ss.wechat_name,
    ss.sales_code,
    ss.commission_rate,
    sss.total_orders,
    sss.total_amount,
    sss.total_commission,
    ps.wechat_name as belongs_to
FROM secondary_sales ss
LEFT JOIN secondary_sales_stats sss ON ss.wechat_name = sss.wechat_name
LEFT JOIN primary_sales ps ON ps.id = ss.primary_sales_id
WHERE ss.wechat_name = '王五';

-- ========================================
-- 7. 最终检查
-- ========================================
SELECT '✅ 数据添加完成！现在可以：' as message
UNION ALL
SELECT '1. 访问 https://zhixing-seven.vercel.app/primary-sales-settlement'
UNION ALL
SELECT '   输入"张三"查询一级销售数据'
UNION ALL
SELECT '2. 访问 https://zhixing-seven.vercel.app/sales-reconciliation'
UNION ALL
SELECT '   输入"王五"查询二级销售数据';




