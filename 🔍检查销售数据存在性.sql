-- 🔍 检查张三和王五是否在数据库中

-- 1. 检查张三（一级销售）
SELECT 
    '张三（一级销售）' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ 存在'
        ELSE '❌ 不存在，需要先注册'
    END as status
FROM primary_sales 
WHERE wechat_name = '张三';

-- 查看张三的详细信息
SELECT 
    id,
    wechat_name,
    sales_code,
    commission_rate,
    payment_method,
    payment_account,
    created_at
FROM primary_sales 
WHERE wechat_name = '张三';

-- 2. 检查王五（二级销售）
SELECT 
    '王五（二级销售）' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ 存在'
        ELSE '❌ 不存在，需要先注册'
    END as status
FROM secondary_sales 
WHERE wechat_name = '王五';

-- 查看王五的详细信息
SELECT 
    ss.id,
    ss.wechat_name,
    ss.sales_code,
    ss.commission_rate,
    ss.primary_sales_id,
    ps.wechat_name as primary_sales_name,
    ss.payment_method,
    ss.payment_account,
    ss.created_at
FROM secondary_sales ss
LEFT JOIN primary_sales ps ON ps.id = ss.primary_sales_id
WHERE ss.wechat_name = '王五';

-- 3. 如果不存在，显示如何添加测试数据
SELECT '
如果张三不存在，执行以下SQL添加：

INSERT INTO primary_sales (
    wechat_name,
    sales_code,
    commission_rate,
    payment_method,
    payment_account,
    secondary_registration_code,
    created_at,
    updated_at
) VALUES (
    ''张三'',
    ''PRI_ZHANGSAN_'' || extract(epoch from now())::text,
    0.4,
    ''alipay'',
    ''zhangsan@alipay.com'',
    ''SEC_REG_'' || extract(epoch from now())::text,
    now(),
    now()
);
' as insert_primary_sales_sql;

SELECT '
如果王五不存在，先确保张三存在，然后执行：

INSERT INTO secondary_sales (
    wechat_name,
    sales_code,
    commission_rate,
    primary_sales_id,
    payment_method,
    payment_account,
    created_at,
    updated_at
) VALUES (
    ''王五'',
    ''SEC_WANGWU_'' || extract(epoch from now())::text,
    0.1,
    (SELECT id FROM primary_sales WHERE wechat_name = ''张三'' LIMIT 1),
    ''bank_transfer'',
    ''王五的银行账号'',
    now(),
    now()
);
' as insert_secondary_sales_sql;

-- 4. 检查视图是否能正确查询
SELECT 
    '视图测试 - primary_sales_stats' as test_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE wechat_name = '张三') as zhangsan_records
FROM primary_sales_stats;

SELECT 
    '视图测试 - secondary_sales_stats' as test_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE wechat_name = '王五') as wangwu_records
FROM secondary_sales_stats;



