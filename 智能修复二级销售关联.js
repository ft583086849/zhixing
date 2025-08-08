// 智能修复二级销售的primary_sales_id关联
// 让用户可以精确选择要关联的二级销售

(async function() {
    console.log('🔧 智能修复二级销售关联工具\n');
    console.log('=====================================');
    console.log('问题说明：');
    console.log('管理员系统通过名称模糊匹配能找到二级销售');
    console.log('一级对账页面只通过primary_sales_id精确匹配');
    console.log('如果primary_sales_id为空，对账页面就看不到');
    console.log('=====================================\n');
    
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
    
    // 步骤1：输入一级销售微信号
    const primaryWechat = prompt('请输入一级销售的微信号（如：810测试）:');
    if (!primaryWechat) {
        console.log('❌ 操作已取消');
        return;
    }
    
    console.log(`\n1️⃣ 查找一级销售 "${primaryWechat}"...`);
    
    // 查找一级销售
    const { data: primarySales, error: primaryError } = await supabase
        .from('primary_sales')
        .select('*')
        .or(`wechat_name.eq.${primaryWechat},wechat_name.ilike.%${primaryWechat}%`);
    
    if (primaryError || !primarySales || primarySales.length === 0) {
        console.error('❌ 未找到一级销售');
        return;
    }
    
    let primary;
    if (primarySales.length === 1) {
        primary = primarySales[0];
        console.log('✅ 找到一级销售:');
    } else {
        console.log(`找到 ${primarySales.length} 个匹配的一级销售:`);
        primarySales.forEach((p, i) => {
            console.log(`${i + 1}. ${p.wechat_name} (ID: ${p.id})`);
        });
        
        const choice = prompt(`请选择（输入序号1-${primarySales.length}）:`) - 1;
        if (choice < 0 || choice >= primarySales.length) {
            console.log('❌ 无效选择');
            return;
        }
        primary = primarySales[choice];
    }
    
    console.log('  微信号:', primary.wechat_name);
    console.log('  ID:', primary.id);
    console.log('  销售代码:', primary.sales_code);
    
    // 步骤2：查找所有二级销售
    console.log('\n2️⃣ 查找所有二级销售...');
    
    const { data: allSecondary, error: secondaryError } = await supabase
        .from('secondary_sales')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (secondaryError || !allSecondary || allSecondary.length === 0) {
        console.error('❌ 未找到二级销售');
        return;
    }
    
    // 分类二级销售
    const alreadyLinked = allSecondary.filter(s => s.primary_sales_id === primary.id);
    const unlinked = allSecondary.filter(s => !s.primary_sales_id);
    const linkedToOther = allSecondary.filter(s => s.primary_sales_id && s.primary_sales_id !== primary.id);
    
    console.log(`\n📊 二级销售统计:`);
    console.log(`  已关联到 ${primary.wechat_name}: ${alreadyLinked.length} 个`);
    console.log(`  未关联到任何一级: ${unlinked.length} 个`);
    console.log(`  关联到其他一级: ${linkedToOther.length} 个`);
    
    if (alreadyLinked.length > 0) {
        console.log(`\n✅ 已关联的二级销售:`);
        alreadyLinked.forEach(s => {
            console.log(`  - ${s.wechat_name} (ID: ${s.id})`);
        });
    }
    
    // 步骤3：智能推荐可能的二级销售
    console.log('\n3️⃣ 智能分析可能的二级销售...');
    
    // 查找名称相关的
    const nameRelated = allSecondary.filter(s => {
        const name = s.wechat_name?.toLowerCase() || '';
        const primaryName = primary.wechat_name?.toLowerCase() || '';
        
        // 检查是否包含一级销售的名称
        if (name.includes(primaryName.replace('测试', '').replace('一级', ''))) return true;
        
        // 检查是否有"二级"关键词且包含部分匹配
        if (name.includes('二级')) {
            const primaryWords = primaryName.split(/[\s_-]/);
            return primaryWords.some(word => word.length > 1 && name.includes(word));
        }
        
        return false;
    });
    
    if (nameRelated.length > 0 && !nameRelated.every(s => s.primary_sales_id === primary.id)) {
        console.log('\n🎯 推荐关联（基于名称相似性）:');
        nameRelated.forEach(s => {
            const status = s.primary_sales_id === primary.id ? '✅ 已关联' : 
                          s.primary_sales_id ? `⚠️ 关联到其他(${s.primary_sales_id})` : 
                          '❌ 未关联';
            console.log(`  - ${s.wechat_name} [${status}]`);
        });
    }
    
    // 步骤4：让用户选择要关联的二级销售
    console.log('\n4️⃣ 选择要关联的二级销售...');
    
    // 显示未关联的二级销售供选择
    if (unlinked.length > 0) {
        console.log('\n未关联的二级销售列表:');
        const displayList = unlinked.slice(0, 30); // 最多显示30个
        displayList.forEach((s, i) => {
            console.log(`${i + 1}. ${s.wechat_name} (创建时间: ${s.created_at?.substring(0, 10)})`);
        });
        
        if (unlinked.length > 30) {
            console.log(`... 还有 ${unlinked.length - 30} 个未显示`);
        }
        
        const input = prompt(`
请输入要关联的二级销售序号（多个用逗号分隔，如: 1,3,5）
或输入微信号关键词（如: 二级）来筛选
或输入 'all' 关联所有名称匹配的
或按 ESC 取消:
        `);
        
        if (!input) {
            console.log('🚫 操作已取消');
            return;
        }
        
        let toLink = [];
        
        if (input.toLowerCase() === 'all') {
            // 关联所有名称匹配的
            toLink = nameRelated.filter(s => !s.primary_sales_id);
        } else if (input.includes(',')) {
            // 通过序号选择
            const indices = input.split(',').map(s => parseInt(s.trim()) - 1);
            toLink = indices.map(i => displayList[i]).filter(Boolean);
        } else if (!isNaN(input)) {
            // 单个序号
            const index = parseInt(input) - 1;
            if (displayList[index]) {
                toLink = [displayList[index]];
            }
        } else {
            // 关键词筛选
            toLink = unlinked.filter(s => 
                s.wechat_name?.toLowerCase().includes(input.toLowerCase())
            );
        }
        
        if (toLink.length === 0) {
            console.log('❌ 未找到匹配的二级销售');
            return;
        }
        
        // 确认关联
        console.log('\n将关联以下二级销售:');
        toLink.forEach(s => {
            console.log(`  - ${s.wechat_name}`);
        });
        
        if (confirm(`确认将这 ${toLink.length} 个二级销售关联到 ${primary.wechat_name}？`)) {
            console.log('\n5️⃣ 执行关联...');
            
            let successCount = 0;
            for (const secondary of toLink) {
                const { error: updateError } = await supabase
                    .from('secondary_sales')
                    .update({ 
                        primary_sales_id: primary.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', secondary.id);
                
                if (updateError) {
                    console.error(`❌ 关联 ${secondary.wechat_name} 失败:`, updateError);
                } else {
                    console.log(`✅ 成功关联 ${secondary.wechat_name}`);
                    successCount++;
                }
            }
            
            console.log(`\n✨ 关联完成: 成功 ${successCount}/${toLink.length}`);
        } else {
            console.log('🚫 操作已取消');
            return;
        }
    } else {
        console.log('⚠️ 没有未关联的二级销售');
    }
    
    // 最终验证
    console.log('\n6️⃣ 验证结果...');
    
    const { data: finalCheck } = await supabase
        .from('secondary_sales')
        .select('id, wechat_name, commission_rate')
        .eq('primary_sales_id', primary.id);
    
    if (finalCheck && finalCheck.length > 0) {
        console.log(`\n✅ ${primary.wechat_name} 现在有 ${finalCheck.length} 个二级销售:`);
        finalCheck.forEach(s => {
            const rate = s.commission_rate ? `${(s.commission_rate * 100).toFixed(0)}%` : '未设置';
            console.log(`  - ${s.wechat_name} (佣金率: ${rate})`);
        });
        
        console.log('\n📝 下一步:');
        console.log('1. 访问一级销售对账页面: /primary-sales-settlement');
        console.log(`2. 查询 "${primary.wechat_name}"`);
        console.log('3. 应该能看到所有二级销售了');
        console.log('4. 可以为每个二级销售设置佣金率');
    }
})();
