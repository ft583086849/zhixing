// 一键修复810测试的所有二级销售关联问题
// 在任意页面控制台运行

(async function() {
    console.log('🔧 一键修复810测试的二级销售关联\n');
    console.log('=====================================');
    
    // 获取 Supabase 客户端
    let supabase = window.supabaseClient;
    
    if (!supabase) {
        const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
        
        if (!window.supabase) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            document.head.appendChild(script);
            await new Promise(resolve => script.onload = resolve);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (window.supabase?.createClient) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        }
    }
    
    // 步骤1: 查找810测试的一级销售
    console.log('1️⃣ 查找810测试...\n');
    
    const { data: primary810 } = await supabase
        .from('primary_sales')
        .select('*')
        .eq('wechat_name', '810测试')
        .single();
    
    if (!primary810) {
        console.error('❌ 未找到810测试的一级销售');
        return;
    }
    
    console.log('✅ 找到810测试:');
    console.log('  ID:', primary810.id);
    console.log('  销售代码:', primary810.sales_code);
    console.log('  二级注册码:', primary810.secondary_registration_code);
    
    // 步骤2: 修复有注册码的二级销售
    console.log('\n2️⃣ 修复有注册码的二级销售...\n');
    
    if (primary810.secondary_registration_code) {
        const { data: brokenSecondary } = await supabase
            .from('secondary_sales')
            .select('*')
            .eq('registration_code', primary810.secondary_registration_code)
            .is('primary_sales_id', null);
        
        if (brokenSecondary && brokenSecondary.length > 0) {
            console.log(`找到 ${brokenSecondary.length} 个需要修复的二级销售:`);
            
            for (const secondary of brokenSecondary) {
                const { error } = await supabase
                    .from('secondary_sales')
                    .update({ 
                        primary_sales_id: primary810.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', secondary.id);
                
                if (!error) {
                    console.log(`✅ 修复了 ${secondary.wechat_name}`);
                } else {
                    console.error(`❌ 修复 ${secondary.wechat_name} 失败:`, error);
                }
            }
        } else {
            console.log('没有需要修复的有注册码的二级销售');
        }
    }
    
    // 步骤3: 显示名称相关但未关联的二级销售（仅显示，不自动关联）
    console.log('\n3️⃣ 分析未关联的二级销售...\n');
    
    // 查找所有未关联的二级销售
    const { data: unlinkedSecondary } = await supabase
        .from('secondary_sales')
        .select('*')
        .is('primary_sales_id', null)
        .order('created_at', { ascending: false });
    
    if (unlinkedSecondary && unlinkedSecondary.length > 0) {
        // 分类显示
        const nameRelated = unlinkedSecondary.filter(s => 
            s.wechat_name?.toLowerCase().includes('810')
        );
        const withRegCode = unlinkedSecondary.filter(s => s.registration_code);
        const independent = unlinkedSecondary.filter(s => !s.registration_code);
        
        console.log(`📊 未关联的二级销售统计:`);
        console.log(`  总计: ${unlinkedSecondary.length} 个`);
        console.log(`  名称包含810: ${nameRelated.length} 个`);
        console.log(`  有注册码: ${withRegCode.length} 个`);
        console.log(`  独立二级: ${independent.length} 个`);
        
        if (nameRelated.length > 0) {
            console.log('\n⚠️ 名称包含810但未关联的二级销售:');
            nameRelated.forEach(s => {
                console.log(`  - ${s.wechat_name}`);
                console.log(`    registration_code: ${s.registration_code || '无'}`);
                console.log(`    创建时间: ${s.created_at?.substring(0, 19)}`);
            });
            console.log('\n💡 这些可能应该关联到810测试，但需要人工确认');
        }
    } else {
        console.log('✅ 没有未关联的二级销售');
    }
    
    // 步骤4: 显示最终结果
    console.log('\n4️⃣ 验证最终结果...\n');
    
    const { data: finalSecondary } = await supabase
        .from('secondary_sales')
        .select('id, wechat_name, commission_rate')
        .eq('primary_sales_id', primary810.id);
    
    console.log(`✅ 810测试现在有 ${finalSecondary?.length || 0} 个二级销售:`);
    
    if (finalSecondary && finalSecondary.length > 0) {
        finalSecondary.forEach(s => {
            const rate = s.commission_rate ? 
                `${(s.commission_rate * 100).toFixed(0)}%` : 
                '未设置';
            console.log(`  - ${s.wechat_name} (佣金率: ${rate})`);
        });
        
        // 步骤5: 提供对账页面链接
        console.log('\n5️⃣ 验证对账页面...\n');
        
        const settlementUrl = `${window.location.origin}/primary-sales-settlement`;
        console.log('✨ 修复完成！');
        console.log('\n下一步:');
        console.log(`1. 访问对账页面: ${settlementUrl}`);
        console.log('2. 查询"810测试"');
        console.log('3. 应该能看到所有二级销售了');
        console.log('4. 可以为每个二级销售设置佣金率');
        
        // 自动复制查询文本
        try {
            await navigator.clipboard.writeText('810测试');
            console.log('\n📋 "810测试"已复制到剪贴板，可以直接粘贴查询');
        } catch (err) {
            // 忽略复制失败
        }
    } else {
        console.log('\n⚠️ 810测试还没有二级销售');
        console.log('可能需要先让二级销售通过注册链接注册');
        
        if (primary810.secondary_registration_code) {
            const regLink = `${window.location.origin}/secondary-sales?registration_code=${primary810.secondary_registration_code}`;
            console.log('\n二级销售注册链接:');
            console.log(regLink);
        }
    }
})();
