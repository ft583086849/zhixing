// 在管理后台页面控制台运行此脚本，手动保存第二个链的二维码

(async function() {
    console.log('📸 手动保存第二个链二维码...\n');
    
    // 1. 创建文件选择器
    console.log('1️⃣ 请选择二维码图片...');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            console.log('❌ 未选择文件');
            return;
        }
        
        console.log('✅ 文件选择:', file.name);
        console.log('  大小:', (file.size / 1024).toFixed(2), 'KB');
        console.log('  类型:', file.type);
        
        // 2. 读取文件为 base64
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const base64Data = evt.target.result;
            console.log('\n2️⃣ 文件读取成功');
            console.log('  数据长度:', base64Data.length);
            
            // 3. 获取 Supabase 客户端
            let supabase = window.supabaseClient;
            
            if (!supabase) {
                const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
                const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
                
                if (window.supabase?.createClient) {
                    supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
                }
            }
            
            if (!supabase) {
                console.error('❌ 无法创建 Supabase 客户端');
                console.log('请在管理后台页面运行此脚本');
                return;
            }
            
            console.log('\n3️⃣ 保存到数据库...');
            
            // 4. 更新数据库
            const { data, error } = await supabase
                .from('payment_config')
                .update({
                    crypto2_qr_code: base64Data,
                    crypto2_chain_name: 'BSC',
                    crypto2_address: '0xAE25E29d3baCD91B0fFd0807859531419a85375a',
                    updated_at: new Date().toISOString()
                })
                .eq('is_active', true)
                .select()
                .single();
            
            if (error) {
                console.error('❌ 保存失败:', error);
            } else {
                console.log('✅ 保存成功！');
                console.log('\n📊 更新后的配置:');
                console.log('  链名:', data.crypto2_chain_name);
                console.log('  地址:', data.crypto2_address);
                console.log('  二维码:', data.crypto2_qr_code ? '已保存' : '未保存');
                
                // 5. 清除缓存
                console.log('\n4️⃣ 清除缓存...');
                localStorage.clear();
                sessionStorage.clear();
                
                // 6. 提示刷新
                console.log('\n✨ 操作完成！');
                console.log('请刷新页面查看效果:');
                console.log('1. 刷新管理后台页面，查看二维码是否显示');
                console.log('2. 访问购买页面，查看双链选项是否显示');
                
                // 自动刷新（可选）
                const shouldRefresh = confirm('是否立即刷新页面？');
                if (shouldRefresh) {
                    location.reload(true);
                }
            }
        };
        
        reader.readAsDataURL(file);
    };
    
    // 触发文件选择
    input.click();
})();
