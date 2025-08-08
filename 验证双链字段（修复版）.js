// 在浏览器控制台运行此脚本，验证字段添加是否成功
// 需要先访问应用的任意页面（如 /admin/payment-config）

(async function() {
    console.log('🔍 验证双链字段是否添加成功...\n');
    
    // 1. 清除缓存
    console.log('1️⃣ 清除缓存...');
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ 缓存已清除\n');
    
    // 2. 尝试获取现有的 Supabase 客户端或创建新的
    console.log('2️⃣ 初始化 Supabase 客户端...');
    
    let supabase;
    
    // 方法1: 尝试从 window 获取已存在的客户端
    if (window.supabaseClient) {
        supabase = window.supabaseClient;
        console.log('✅ 使用现有的 Supabase 客户端\n');
    } else {
        // 方法2: 动态加载 Supabase 库
        console.log('📦 动态加载 Supabase 库...');
        
        // 创建 script 标签
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        document.head.appendChild(script);
        
        // 等待脚本加载
        await new Promise((resolve) => {
            script.onload = resolve;
        });
        
        // 等待一下让库完全加载
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 创建客户端
        const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
        
        if (window.supabase && window.supabase.createClient) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            console.log('✅ Supabase 客户端创建成功\n');
        } else {
            console.error('❌ 无法创建 Supabase 客户端');
            console.log('\n💡 请尝试以下方法:');
            console.log('1. 先访问管理后台页面: /admin/payment-config');
            console.log('2. 确保已登录系统');
            console.log('3. 然后再运行此脚本');
            return;
        }
    }
    
    // 3. 获取配置数据
    console.log('3️⃣ 检查数据库配置...');
    
    try {
        const { data: config, error } = await supabase
            .from('payment_config')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single();
        
        if (error) {
            console.error('❌ 获取配置失败:', error);
            console.log('\n💡 可能的原因:');
            console.log('1. 数据库连接问题');
            console.log('2. 表名不正确');
            console.log('3. 没有活跃的配置记录');
            return;
        }
        
        console.log('\n📊 配置数据获取成功！');
        console.log('====================');
        
        // 检查第一个链配置
        console.log('\n🔹 链配置（一）:');
        console.log('  链名:', config.crypto_chain_name || '❌ 未设置');
        console.log('  地址:', config.crypto_address || '❌ 未设置');
        console.log('  二维码:', config.crypto_qr_code ? '✅ 已上传' : '❌ 未上传');
        
        // 检查第二个链配置
        console.log('\n🔹 链配置（二）:');
        const hasCrypto2ChainName = 'crypto2_chain_name' in config;
        const hasCrypto2Address = 'crypto2_address' in config;
        const hasCrypto2QrCode = 'crypto2_qr_code' in config;
        
        if (!hasCrypto2ChainName || !hasCrypto2Address || !hasCrypto2QrCode) {
            console.log('  ❌ 字段不存在！需要添加数据库字段');
            console.log('\n📝 解决方案:');
            console.log('1. 登录 Supabase: https://app.supabase.com');
            console.log('2. 选择你的项目');
            console.log('3. 点击左侧 SQL Editor');
            console.log('4. 执行以下 SQL:');
            console.log(`
ALTER TABLE payment_config 
ADD COLUMN IF NOT EXISTS crypto2_chain_name TEXT DEFAULT 'BSC';

ALTER TABLE payment_config 
ADD COLUMN IF NOT EXISTS crypto2_address TEXT DEFAULT '0xAE25E29d3baCD91B0fFd0807859531419a85375a';

ALTER TABLE payment_config 
ADD COLUMN IF NOT EXISTS crypto2_qr_code TEXT;
            `);
        } else {
            console.log('  ✅ 字段存在');
            console.log('  链名:', config.crypto2_chain_name || '❌ 未设置');
            console.log('  地址:', config.crypto2_address || '❌ 未设置');
            console.log('  二维码:', config.crypto2_qr_code ? '✅ 已上传' : '❌ 未上传');
            
            // 如果字段存在但值为空，设置默认值
            if (!config.crypto2_chain_name || !config.crypto2_address) {
                console.log('\n4️⃣ 设置默认值...');
                
                const { data: updated, error: updateError } = await supabase
                    .from('payment_config')
                    .update({
                        crypto2_chain_name: config.crypto2_chain_name || 'BSC',
                        crypto2_address: config.crypto2_address || '0xAE25E29d3baCD91B0fFd0807859531419a85375a'
                    })
                    .eq('id', config.id)
                    .select()
                    .single();
                
                if (updateError) {
                    console.error('❌ 设置默认值失败:', updateError);
                } else {
                    console.log('✅ 默认值已设置');
                }
            }
            
            console.log('\n✨ 配置状态正常！');
            console.log('\n下一步:');
            console.log('1. 访问管理后台: /admin/payment-config');
            console.log('2. 检查第二个链配置是否显示');
            console.log('3. 上传第二个链的收款二维码（如需要）');
            console.log('4. 保存配置');
            console.log('5. 清除缓存后访问购买页面查看效果');
        }
        
        console.log('====================');
        
        // 显示完整配置（调试用）
        console.log('\n📋 完整配置数据:');
        console.log(config);
        
    } catch (err) {
        console.error('❌ 发生错误:', err);
        console.log('\n💡 请确保:');
        console.log('1. 已登录到系统');
        console.log('2. 在应用页面中运行（不是独立的控制台）');
    }
})();
