// 一键修复重复记录并上传第二个链二维码
// 在任意页面控制台运行

(async function() {
    console.log('🚀 开始一键修复并上传...\n');
    
    // 获取 Supabase 客户端
    let supabase = window.supabaseClient;
    
    if (!supabase) {
        const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
        
        if (window.supabase?.createClient) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        } else {
            // 尝试动态加载
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            document.head.appendChild(script);
            await new Promise(resolve => script.onload = resolve);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (window.supabase?.createClient) {
                supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            } else {
                console.error('❌ 无法创建 Supabase 客户端');
                return;
            }
        }
    }
    
    // ========== 第一步：修复重复记录 ==========
    console.log('📊 第一步：检查并修复重复记录...\n');
    
    const { data: configs, error: queryError } = await supabase
        .from('payment_config')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
    
    if (queryError) {
        console.error('❌ 查询失败:', queryError);
        return;
    }
    
    console.log(`找到 ${configs.length} 条活跃配置\n`);
    
    if (configs.length > 1) {
        // 计算完整性分数
        const configsWithScore = configs.map(config => {
            let score = 0;
            if (config.crypto_chain_name) score++;
            if (config.crypto_address) score++;
            if (config.crypto_qr_code) score++;
            if (config.crypto2_chain_name) score++;
            if (config.crypto2_address) score++;
            if (config.crypto2_qr_code) score++;
            return { ...config, score };
        });
        
        // 排序并选择最佳配置
        configsWithScore.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
        });
        
        const keepConfig = configsWithScore[0];
        const removeConfigs = configsWithScore.slice(1);
        
        console.log(`保留配置 ID: ${keepConfig.id}（分数: ${keepConfig.score}/6）`);
        console.log(`停用其他 ${removeConfigs.length} 条配置\n`);
        
        // 停用重复配置
        for (const config of removeConfigs) {
            await supabase
                .from('payment_config')
                .update({ is_active: false })
                .eq('id', config.id);
        }
        
        console.log('✅ 重复记录已修复\n');
    }
    
    // ========== 第二步：获取当前配置 ==========
    console.log('📝 第二步：获取当前配置...\n');
    
    const { data: currentConfig, error: configError } = await supabase
        .from('payment_config')
        .select('*')
        .eq('is_active', true)
        .single();
    
    if (configError) {
        console.error('❌ 获取配置失败:', configError);
        return;
    }
    
    console.log('当前配置:');
    console.log('  链1:', currentConfig.crypto_chain_name || '未设置');
    console.log('  链2:', currentConfig.crypto2_chain_name || '未设置');
    console.log('  二维码2:', currentConfig.crypto2_qr_code ? '✅ 已有' : '❌ 未上传');
    
    // ========== 第三步：上传二维码 ==========
    if (!currentConfig.crypto2_qr_code) {
        console.log('\n📸 第三步：上传第二个链的二维码...\n');
        console.log('请选择二维码图片文件...');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
                console.log('❌ 未选择文件');
                return;
            }
            
            console.log('✅ 选择文件:', file.name);
            
            const reader = new FileReader();
            reader.onload = async (evt) => {
                const base64Data = evt.target.result;
                
                console.log('正在保存...');
                
                const { data, error } = await supabase
                    .from('payment_config')
                    .update({
                        crypto2_qr_code: base64Data,
                        crypto2_chain_name: currentConfig.crypto2_chain_name || 'BSC',
                        crypto2_address: currentConfig.crypto2_address || '0xAE25E29d3baCD91B0fFd0807859531419a85375a',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', currentConfig.id)
                    .select()
                    .single();
                
                if (error) {
                    console.error('❌ 保存失败:', error);
                } else {
                    console.log('✅ 二维码保存成功！');
                    
                    // 清除缓存
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    console.log('\n✨ 全部完成！');
                    console.log('\n下一步:');
                    console.log('1. 刷新页面查看效果');
                    console.log('2. 访问购买页面验证双链显示');
                    
                    if (confirm('是否立即刷新页面？')) {
                        location.reload(true);
                    }
                }
            };
            
            reader.readAsDataURL(file);
        };
        
        input.click();
    } else {
        console.log('\n✅ 第二个链的二维码已存在，无需上传');
        
        // 清除缓存
        localStorage.clear();
        sessionStorage.clear();
        
        console.log('\n✨ 修复完成！');
        console.log('请刷新页面查看效果');
    }
})();
