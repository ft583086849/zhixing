// 在购买页面控制台运行此脚本，验证双链配置是否生效

(async function() {
    console.log('🔍 验证购买页面双链配置...\n');
    
    // 1. 清除缓存
    console.log('1️⃣ 清除所有缓存...');
    localStorage.clear();
    sessionStorage.clear();
    
    // 删除所有 cookies
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('✅ 缓存已清除\n');
    
    // 2. 检查 Redux Store
    console.log('2️⃣ 检查 Redux Store 中的配置...');
    const state = window.store?.getState();
    
    if (state?.paymentConfig?.config) {
        const config = state.paymentConfig.config;
        console.log('当前配置:');
        console.log('====================');
        
        // 第一个链
        console.log('\n🔹 链配置（一）:');
        console.log('  链名:', config.crypto_chain_name || '未设置');
        console.log('  地址:', config.crypto_address || '未设置');
        console.log('  二维码:', config.crypto_qr_code ? '✅ 有数据' : '❌ 无数据');
        
        // 第二个链
        console.log('\n🔹 链配置（二）:');
        const hasCrypto2 = config.crypto2_chain_name && config.crypto2_address;
        
        if (hasCrypto2) {
            console.log('  ✅ 配置存在');
            console.log('  链名:', config.crypto2_chain_name);
            console.log('  地址:', config.crypto2_address);
            console.log('  二维码:', config.crypto2_qr_code ? '✅ 有数据' : '❌ 无数据');
        } else {
            console.log('  ❌ 配置不存在或不完整');
            console.log('  链名:', config.crypto2_chain_name || '未设置');
            console.log('  地址:', config.crypto2_address || '未设置');
        }
        
        console.log('====================');
        
        // 3. 检查页面显示
        console.log('\n3️⃣ 检查页面显示...');
        
        // 查找 Tabs 组件
        const tabs = document.querySelector('.ant-tabs');
        const tabPanes = document.querySelectorAll('.ant-tabs-tab');
        
        if (tabs && tabPanes.length > 1) {
            console.log('✅ 找到双链切换 Tabs');
            console.log('  Tab 数量:', tabPanes.length);
            tabPanes.forEach((tab, index) => {
                console.log(`  Tab ${index + 1}:`, tab.textContent);
            });
        } else if (tabs && tabPanes.length === 1) {
            console.log('⚠️ 只有一个 Tab，双链未生效');
        } else {
            console.log('⚠️ 未找到 Tabs 组件');
            
            // 查找链上收款信息
            const cryptoInfo = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent?.includes('链名') || el.textContent?.includes('收款地址')
            );
            
            if (cryptoInfo.length > 0) {
                console.log('找到链上收款信息元素:', cryptoInfo.length, '个');
            }
        }
        
        // 4. 诊断建议
        console.log('\n💡 诊断结果:');
        
        if (hasCrypto2 && tabs && tabPanes.length > 1) {
            console.log('✅ 双链配置正常显示！');
        } else if (hasCrypto2 && (!tabs || tabPanes.length <= 1)) {
            console.log('⚠️ 配置存在但页面未显示双链');
            console.log('\n可能的原因:');
            console.log('1. 页面组件渲染条件有问题');
            console.log('2. 缓存未完全清除');
            console.log('3. 需要强制刷新页面');
            
            console.log('\n解决方案:');
            console.log('执行强制刷新: location.reload(true);');
        } else if (!hasCrypto2) {
            console.log('❌ 第二个链配置不完整');
            console.log('\n解决方案:');
            console.log('1. 返回管理后台: /admin/payment-config');
            console.log('2. 确保第二个链的链名和地址都已填写');
            console.log('3. 上传第二个链的二维码（可选）');
            console.log('4. 点击保存配置');
        }
        
    } else {
        console.log('⚠️ 无法访问 Redux Store');
        console.log('可能需要等待页面加载完成');
    }
    
    // 5. 显示当前页面 URL
    console.log('\n📍 当前页面:', window.location.href);
    
    // 6. 快速测试按钮
    console.log('\n🚀 快速操作:');
    console.log('复制以下代码运行:');
    console.log('\n// 强制刷新页面');
    console.log('location.reload(true);');
    console.log('\n// 返回管理后台');
    console.log('window.location.href = "/admin/payment-config";');
})();
