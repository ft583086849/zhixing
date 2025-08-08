// 修复810测试的二级销售关联问题
// 在任意页面控制台运行

(async function() {
    console.log('🔧 修复810测试的二级销售关联...\n');
    
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
        } else {
            console.error('❌ 无法创建 Supabase 客户端');
            return;
        }
    }
    
    // 步骤1: 查找810测试的一级销售
    console.log('1️⃣ 查找810测试的一级销售...');
    
    const { data: primarySales, error: primaryError } = await supabase
        .from('primary_sales')
        .select('*')
        .or('wechat_name.ilike.%810测试%,wechat_name.eq.810测试');
    
    if (primaryError || !primarySales || primarySales.length === 0) {
        console.error('❌ 未找到810测试的一级销售');
        
        // 显示所有一级销售供选择
        const { data: allPrimary } = await supabase
            .from('primary_sales')
            .select('id, wechat_name, sales_code')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (allPrimary && allPrimary.length > 0) {
            console.log('\n最近的一级销售:');
            allPrimary.forEach((p, i) => {
                console.log(`${i + 1}. ${p.wechat_name} (ID: ${p.id})`);
            });
        }
        return;
    }
    
    const primary = primarySales[0];
    console.log('✅ 找到一级销售:');
    console.log('  微信号:', primary.wechat_name);
    console.log('  ID:', primary.id);
    console.log('  销售代码:', primary.sales_code);
    
    // 步骤2: 查找需要关联的二级销售
    console.log('\n2️⃣ 查找可能属于810测试的二级销售...');
    
    // 查找名称相关的二级销售
    const { data: potentialSecondary, error: secondaryError } = await supabase
        .from('secondary_sales')
        .select('*')
        .or('wechat_name.ilike.%810%,wechat_name.ilike.%二级%')
        .order('created_at', { ascending: false });
    
    if (!potentialSecondary || potentialSecondary.length === 0) {
        console.log('❌ 未找到可能的二级销售');
        return;
    }
    
    console.log(`找到 ${potentialSecondary.length} 个可能的二级销售:\n`);
    
    // 分类显示
    const unlinked = potentialSecondary.filter(s => !s.primary_sales_id);
    const linkedToOther = potentialSecondary.filter(s => s.primary_sales_id && s.primary_sales_id !== primary.id);
    const alreadyLinked = potentialSecondary.filter(s => s.primary_sales_id === primary.id);
    
    if (alreadyLinked.length > 0) {
        console.log('✅ 已正确关联的二级销售:');
        alreadyLinked.forEach(s => {
            console.log(`  - ${s.wechat_name} (ID: ${s.id})`);
        });
    }
    
    if (unlinked.length > 0) {
        console.log('\n⚠️ 未关联的二级销售（需要修复）:');
        unlinked.forEach(s => {
            console.log(`  - ${s.wechat_name} (ID: ${s.id})`);
        });
    }
    
    if (linkedToOther.length > 0) {
        console.log('\n⚠️ 关联到其他一级的二级销售:');
        linkedToOther.forEach(s => {
            console.log(`  - ${s.wechat_name} (ID: ${s.id}, 当前关联: ${s.primary_sales_id})`);
        });
    }
    
    // 步骤3: 询问是否修复
    if (unlinked.length > 0) {
        console.log('\n3️⃣ 准备修复关联...');
        
        const secondaryNames = unlinked.map(s => s.wechat_name).join(', ');
        const confirmMsg = `
是否将以下二级销售关联到 ${primary.wechat_name}？
${secondaryNames}

共 ${unlinked.length} 个二级销售
`;
        
        if (confirm(confirmMsg)) {
            console.log('\n开始修复...');
            
            let successCount = 0;
            let failCount = 0;
            
            for (const secondary of unlinked) {
                const { error: updateError } = await supabase
                    .from('secondary_sales')
                    .update({ 
                        primary_sales_id: primary.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', secondary.id);
                
                if (updateError) {
                    console.error(`❌ 修复 ${secondary.wechat_name} 失败:`, updateError);
                    failCount++;
                } else {
                    console.log(`✅ 成功关联 ${secondary.wechat_name}`);
                    successCount++;
                }
            }
            
            console.log('\n📊 修复结果:');
            console.log(`成功: ${successCount} 个`);
            console.log(`失败: ${failCount} 个`);
            
            if (successCount > 0) {
                console.log('\n✨ 修复完成！');
                console.log('\n下一步:');
                console.log('1. 访问一级销售对账页面');
                console.log('2. 查询 "810测试"');
                console.log('3. 应该能看到二级销售了');
            }
        } else {
            console.log('🚫 操作已取消');
        }
    } else if (alreadyLinked.length > 0) {
        console.log('\n✅ 关联正常，无需修复');
        console.log(`810测试已关联 ${alreadyLinked.length} 个二级销售`);
        
        console.log('\n💡 如果对账页面仍显示0，可能是:');
        console.log('1. 缓存问题 - 清除缓存后重试');
        console.log('2. 查询条件问题 - 确保输入完整的 "810测试"');
    } else {
        console.log('\n⚠️ 没有找到需要修复的二级销售');
    }
    
    // 验证修复结果
    console.log('\n4️⃣ 验证当前状态...');
    
    const { data: finalCheck } = await supabase
        .from('secondary_sales')
        .select('id, wechat_name')
        .eq('primary_sales_id', primary.id);
    
    if (finalCheck && finalCheck.length > 0) {
        console.log(`\n✅ ${primary.wechat_name} 当前有 ${finalCheck.length} 个二级销售:`);
        finalCheck.forEach(s => {
            console.log(`  - ${s.wechat_name}`);
        });
    } else {
        console.log('\n⚠️ 当前没有关联的二级销售');
    }
})();
