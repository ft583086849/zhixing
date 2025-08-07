-- 创建管理员全局收款配置表
-- 用于存储全局统一的收款信息

-- 1. 创建收款配置表
CREATE TABLE IF NOT EXISTS payment_config (
    id SERIAL PRIMARY KEY,
    -- 支付宝收款信息
    alipay_account VARCHAR(100) DEFAULT '752304285@qq.com',
    alipay_name VARCHAR(50) DEFAULT '梁',
    alipay_qr_code TEXT,
    
    -- 加密货币收款信息
    crypto_chain_name VARCHAR(50) DEFAULT 'TRC10/TRC20',
    crypto_address VARCHAR(255) DEFAULT 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
    crypto_qr_code TEXT,
    
    -- 通用配置
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 插入默认收款配置
INSERT INTO payment_config (
    alipay_account,
    alipay_name,
    crypto_chain_name,
    crypto_address,
    is_active
) VALUES (
    '752304285@qq.com',
    '梁',
    'TRC10/TRC20',
    'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
    true
) ON CONFLICT DO NOTHING;

-- 3. 验证创建结果
SELECT 
    'payment_config表创建' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_config')
        THEN '✅ 成功' 
        ELSE '❌ 失败' 
    END as status;

-- 4. 查看配置数据
SELECT 
    id,
    alipay_account,
    alipay_name,
    crypto_chain_name,
    crypto_address,
    is_active,
    created_at
FROM payment_config
WHERE is_active = true;
