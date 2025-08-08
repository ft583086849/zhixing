// 在浏览器控制台运行此脚本，检查双链配置是否正确保存和读取
// 请先登录管理员后台

(async function() {
    console.log('🔍 开始检查双链配置...\n');
    
    // 1. 清除所有缓存
    console.log('1️⃣ 清除缓存...');
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ 缓存已清除');
    
    // 2. 直接从 Supabase 获取配置
    console.log('\n2️⃣ 直接从数据库获取配置...');
    
    // 引入Supabase客户端
    const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
    
    const { createClient } = window.supabase || window.Supabase;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: config, error } = await supabase
        .from('payment_config')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
    
    if (error) {
        console.error('❌ 获取配置失败:', error);
        return;
    }
    
    console.log('📦 数据库中的配置:');
    console.log('====================');
    
    // 第一个链配置
    console.log('\n🔹 链配置（一）:');
    console.log('  - 链名:', config.crypto_chain_name || '❌ 未设置');
    console.log('  - 地址:', config.crypto_address || '❌ 未设置');
    console.log('  - 二维码:', config.crypto_qr_code ? '✅ 已上传' : '❌ 未上传');
    
    // 第二个链配置
    console.log('\n🔹 链配置（二）:');
    console.log('  - 链名:', config.crypto2_chain_name || '❌ 未设置');
    console.log('  - 地址:', config.crypto2_address || '❌ 未设置');
    console.log('  - 二维码:', config.crypto2_qr_code ? '✅ 已上传' : '❌ 未上传');
    
    // 3. 检查字段是否存在
    console.log('\n3️⃣ 检查字段完整性...');
    const hasFirstChain = config.crypto_chain_name && config.crypto_address;
    const hasSecondChain = config.crypto2_chain_name && config.crypto2_address;
    
    if (!hasFirstChain) {
        console.log('⚠️ 第一个链配置不完整');
    }
    
    if (!hasSecondChain) {
        console.log('⚠️ 第二个链配置不完整或字段不存在');
        console.log('\n💡 可能的原因:');
        console.log('  1. 数据库表缺少 crypto2 相关字段');
        console.log('  2. 配置从未保存过');
        console.log('  3. 保存时出错');
    } else {
        console.log('✅ 双链配置完整');
    }
    
    // 4. 测试 API 调用
    console.log('\n4️⃣ 测试 API 调用...');
    try {
        const response = await fetch('/api/admin/payment-config', {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const apiData = await response.json();
            console.log('✅ API 返回的配置:', apiData);
        } else {
            console.log('⚠️ API 调用失败:', response.status);
        }
    } catch (err) {
        console.log('⚠️ 无法调用 API（可能需要登录）');
    }
    
    // 5. 检查 Redux Store
    console.log('\n5️⃣ 检查 Redux Store...');
    const state = window.store?.getState();
    if (state?.paymentConfig) {
        console.log('Redux 中的配置:', state.paymentConfig.config);
    } else {
        console.log('⚠️ Redux Store 不可访问');
    }
    
    // 6. 建议
    console.log('\n💡 诊断建议:');
    
    if (!hasSecondChain) {
        console.log('\n🔧 修复方案 A：检查数据库表结构');
        console.log('需要确保 payment_config 表有以下字段:');
        console.log('  - crypto2_chain_name (text)');
        console.log('  - crypto2_address (text)');
        console.log('  - crypto2_qr_code (text)');
        
        console.log('\n🔧 修复方案 B：手动设置默认值');
        console.log('在控制台运行以下代码:');
        console.log(`
await supabase
  .from('payment_config')
  .update({
    crypto2_chain_name: 'BSC',
    crypto2_address: '0xAE25E29d3baCD91B0fFd0807859531419a85375a'
  })
  .eq('is_active', true);
        `);
        
        console.log('\n🔧 修复方案 C：重新保存配置');
        console.log('1. 访问 /admin/payment-config');
        console.log('2. 填写第二个链配置');
        console.log('3. 点击保存');
    } else {
        console.log('✅ 配置正常，如果页面不显示，请:');
        console.log('1. 强制刷新页面 (Ctrl+F5)');
        console.log('2. 清除浏览器缓存');
        console.log('3. 重新访问购买页面');
    }
    
    return config;
})();
