// 在管理后台页面控制台运行此脚本，检查二维码上传状态

(async function() {
    console.log('🔍 检查二维码上传状态...\n');
    
    // 1. 检查当前页面状态
    console.log('1️⃣ 检查页面状态...');
    
    // 尝试获取 React 组件状态
    const reactFiber = document.querySelector('[class*="ant-"]')?._reactInternalFiber || 
                      document.querySelector('[class*="ant-"]')?._reactInternalInstance;
    
    if (reactFiber) {
        console.log('✅ 找到 React 组件');
    }
    
    // 2. 检查 Redux Store
    console.log('\n2️⃣ 检查 Redux Store...');
    const state = window.store?.getState();
    if (state?.paymentConfig?.config) {
        const config = state.paymentConfig.config;
        console.log('Redux 中的配置:');
        console.log('  crypto2_chain_name:', config.crypto2_chain_name || '未设置');
        console.log('  crypto2_address:', config.crypto2_address || '未设置');
        console.log('  crypto2_qr_code:', config.crypto2_qr_code ? '有数据（长度: ' + config.crypto2_qr_code.length + '）' : '❌ 无数据');
    } else {
        console.log('⚠️ 无法访问 Redux Store');
    }
    
    // 3. 直接查询数据库
    console.log('\n3️⃣ 查询数据库...');
    
    // 获取 Supabase 客户端
    let supabase = window.supabaseClient;
    
    if (!supabase) {
        // 创建客户端
        const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
        
        if (window.supabase?.createClient) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        }
    }
    
    if (supabase) {
        const { data: config, error } = await supabase
            .from('payment_config')
            .select('crypto2_chain_name, crypto2_address, crypto2_qr_code, updated_at')
            .eq('is_active', true)
            .limit(1)
            .single();
        
        if (config) {
            console.log('数据库中的配置:');
            console.log('  crypto2_chain_name:', config.crypto2_chain_name || '未设置');
            console.log('  crypto2_address:', config.crypto2_address || '未设置');
            console.log('  crypto2_qr_code:', config.crypto2_qr_code ? '✅ 有数据（长度: ' + config.crypto2_qr_code.length + '）' : '❌ 无数据');
            console.log('  最后更新时间:', config.updated_at);
            
            // 如果有二维码数据，显示前100个字符
            if (config.crypto2_qr_code) {
                console.log('\n📸 二维码数据预览:');
                console.log(config.crypto2_qr_code.substring(0, 100) + '...');
            }
        }
    } else {
        console.log('⚠️ 无法创建 Supabase 客户端');
    }
    
    // 4. 提供解决方案
    console.log('\n💡 解决方案:');
    console.log('\n方案1: 重新上传并保存');
    console.log('1. 点击"上传收款码"按钮');
    console.log('2. 选择图片文件');
    console.log('3. 确认图片显示后');
    console.log('4. 点击"保存配置"按钮');
    
    console.log('\n方案2: 手动测试上传');
    console.log('在控制台运行以下代码测试文件选择:');
    console.log(`
// 创建文件选择器
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/*';
input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            console.log('✅ 文件读取成功');
            console.log('文件名:', file.name);
            console.log('文件大小:', file.size);
            console.log('数据长度:', evt.target.result.length);
            // 可以将这个数据复制到剪贴板
            navigator.clipboard.writeText(evt.target.result);
            console.log('📋 图片数据已复制到剪贴板');
        };
        reader.readAsDataURL(file);
    }
};
input.click();
    `);
    
    console.log('\n方案3: 清除缓存重试');
    console.log('1. 清除浏览器缓存: localStorage.clear(); sessionStorage.clear();');
    console.log('2. 刷新页面: location.reload(true);');
    console.log('3. 重新上传图片并保存');
})();
