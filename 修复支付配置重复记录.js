// 在浏览器控制台运行此脚本，修复支付配置表中的重复记录问题

(async function() {
    console.log('🔧 修复支付配置重复记录...\n');
    
    // 1. 获取 Supabase 客户端
    let supabase = window.supabaseClient;
    
    if (!supabase) {
        const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
        
        if (window.supabase?.createClient) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        } else {
            console.error('❌ 无法创建 Supabase 客户端');
            console.log('请在应用页面中运行此脚本');
            return;
        }
    }
    
    console.log('1️⃣ 查询所有活跃的支付配置...');
    
    // 2. 查询所有 is_active = true 的记录
    const { data: configs, error: queryError } = await supabase
        .from('payment_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    
    if (queryError) {
        console.error('❌ 查询失败:', queryError);
        return;
    }
    
    console.log(`📊 找到 ${configs.length} 条活跃的配置记录\n`);
    
    if (configs.length === 0) {
        console.log('⚠️ 没有找到活跃的配置');
        return;
    }
    
    if (configs.length === 1) {
        console.log('✅ 只有一条活跃配置，无需修复');
        return;
    }
    
    // 3. 显示所有配置
    console.log('当前活跃的配置:');
    console.log('====================');
    configs.forEach((config, index) => {
        console.log(`\n配置 ${index + 1}:`);
        console.log('  ID:', config.id);
        console.log('  创建时间:', config.created_at);
        console.log('  更新时间:', config.updated_at);
        console.log('  链1:', config.crypto_chain_name, '/', config.crypto_address?.substring(0, 20) + '...');
        console.log('  链2:', config.crypto2_chain_name, '/', config.crypto2_address?.substring(0, 20) + '...');
        console.log('  二维码1:', config.crypto_qr_code ? '✅ 有' : '❌ 无');
        console.log('  二维码2:', config.crypto2_qr_code ? '✅ 有' : '❌ 无');
    });
    console.log('====================\n');
    
    // 4. 选择要保留的配置（最新的或最完整的）
    console.log('2️⃣ 分析配置完整性...');
    
    // 计算每个配置的完整性分数
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
    
    // 按分数和更新时间排序（分数高的优先，同分则时间新的优先）
    configsWithScore.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
    });
    
    const keepConfig = configsWithScore[0];
    const removeConfigs = configsWithScore.slice(1);
    
    console.log(`\n✅ 将保留配置 ID: ${keepConfig.id}`);
    console.log(`   完整性分数: ${keepConfig.score}/6`);
    console.log(`   更新时间: ${keepConfig.updated_at || keepConfig.created_at}`);
    
    console.log(`\n❌ 将停用 ${removeConfigs.length} 条重复配置`);
    
    // 5. 询问用户确认
    const confirmMsg = `
确认操作：
- 保留配置 ID: ${keepConfig.id}（分数: ${keepConfig.score}/6）
- 停用其他 ${removeConfigs.length} 条配置

是否继续？`;
    
    if (!confirm(confirmMsg)) {
        console.log('🚫 操作已取消');
        return;
    }
    
    // 6. 停用其他配置
    console.log('\n3️⃣ 停用重复配置...');
    
    for (const config of removeConfigs) {
        const { error: updateError } = await supabase
            .from('payment_config')
            .update({ is_active: false })
            .eq('id', config.id);
        
        if (updateError) {
            console.error(`❌ 停用配置 ${config.id} 失败:`, updateError);
        } else {
            console.log(`✅ 已停用配置 ${config.id}`);
        }
    }
    
    // 7. 清除缓存
    console.log('\n4️⃣ 清除缓存...');
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('\n✨ 修复完成！');
    console.log('请刷新页面查看效果');
    
    // 8. 验证结果
    const { data: finalCheck, error: finalError } = await supabase
        .from('payment_config')
        .select('id')
        .eq('is_active', true);
    
    if (!finalError && finalCheck) {
        console.log(`\n📊 最终检查: 现在有 ${finalCheck.length} 条活跃配置`);
        if (finalCheck.length === 1) {
            console.log('✅ 问题已解决！');
        } else {
            console.log('⚠️ 仍有多条活跃配置，可能需要手动处理');
        }
    }
})();
