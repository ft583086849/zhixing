// 自动修复二级销售注册关联问题
// 基于系统逻辑自动修复，不需要手动选择

(async function() {
    console.log('🔧 自动修复二级销售注册关联\n');
    console.log('=====================================');
    console.log('修复原则：');
    console.log('1. 有registration_code的，根据注册码找到对应的一级销售');
    console.log('2. 自动建立primary_sales_id关联');
    console.log('3. 保持系统逻辑的一致性');
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
    
    // 步骤1: 查找所有有registration_code但没有primary_sales_id的二级销售
    console.log('1️⃣ 查找需要修复的二级销售...\n');
    
    const { data: brokenSecondary, error: queryError } = await supabase
        .from('secondary_sales')
        .select('*')
        .not('registration_code', 'is', null)
        .is('primary_sales_id', null);
    
    if (queryError) {
        console.error('❌ 查询失败:', queryError);
        return;
    }
    
    if (!brokenSecondary || brokenSecondary.length === 0) {
        console.log('✅ 没有需要修复的二级销售');
        console.log('所有有registration_code的二级销售都已正确关联');
        return;
    }
    
    console.log(`找到 ${brokenSecondary.length} 个需要修复的二级销售\n`);
    
    // 步骤2: 逐个修复
    console.log('2️⃣ 开始修复...\n');
    
    let successCount = 0;
    let failCount = 0;
    const fixResults = [];
    
    for (const secondary of brokenSecondary) {
        // 根据registration_code查找对应的一级销售
        const { data: primary, error: primaryError } = await supabase
            .from('primary_sales')
            .select('id, wechat_name, secondary_registration_code')
            .eq('secondary_registration_code', secondary.registration_code)
            .single();
        
        if (primaryError || !primary) {
            console.error(`❌ ${secondary.wechat_name}: 注册码无效或找不到对应的一级销售`);
            console.log(`   registration_code: ${secondary.registration_code}`);
            failCount++;
            fixResults.push({
                secondary: secondary.wechat_name,
                status: 'failed',
                reason: '注册码无效'
            });
            continue;
        }
        
        // 更新primary_sales_id
        const { error: updateError } = await supabase
            .from('secondary_sales')
            .update({ 
                primary_sales_id: primary.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', secondary.id);
        
        if (updateError) {
            console.error(`❌ ${secondary.wechat_name}: 更新失败`);
            console.error('   错误:', updateError);
            failCount++;
            fixResults.push({
                secondary: secondary.wechat_name,
                status: 'failed',
                reason: updateError.message
            });
        } else {
            console.log(`✅ ${secondary.wechat_name} → ${primary.wechat_name}`);
            successCount++;
            fixResults.push({
                secondary: secondary.wechat_name,
                primary: primary.wechat_name,
                status: 'success'
            });
        }
    }
    
    // 步骤3: 显示修复结果
    console.log('\n3️⃣ 修复结果汇总');
    console.log('=====================================');
    console.log(`✅ 成功修复: ${successCount} 个`);
    console.log(`❌ 修复失败: ${failCount} 个`);
    
    if (successCount > 0) {
        console.log('\n成功修复的关联:');
        fixResults.filter(r => r.status === 'success').forEach(r => {
            console.log(`  ${r.secondary} → ${r.primary}`);
        });
    }
    
    if (failCount > 0) {
        console.log('\n修复失败的二级销售:');
        fixResults.filter(r => r.status === 'failed').forEach(r => {
            console.log(`  ${r.secondary}: ${r.reason}`);
        });
    }
    
    // 步骤4: 检查是否还有其他问题
    console.log('\n4️⃣ 检查其他潜在问题...\n');
    
    // 查找没有registration_code也没有primary_sales_id的二级销售
    const { data: independentSecondary } = await supabase
        .from('secondary_sales')
        .select('id, wechat_name, created_at')
        .is('registration_code', null)
        .is('primary_sales_id', null);
    
    if (independentSecondary && independentSecondary.length > 0) {
        console.log(`⚠️ 发现 ${independentSecondary.length} 个独立二级销售（没有registration_code也没有primary_sales_id）:`);
        independentSecondary.slice(0, 10).forEach(s => {
            console.log(`  - ${s.wechat_name} (创建于: ${s.created_at?.substring(0, 10)})`);
        });
        console.log('\n这些可能是:');
        console.log('1. 独立注册的二级销售（不通过一级销售的链接）');
        console.log('2. 历史数据，注册流程还不完善时创建的');
        console.log('3. 测试数据');
        console.log('\n需要手动判断这些二级销售应该关联到哪个一级销售');
    }
    
    // 步骤5: 验证810测试的情况
    console.log('\n5️⃣ 验证810测试的关联情况...\n');
    
    const { data: primary810 } = await supabase
        .from('primary_sales')
        .select('id, wechat_name')
        .eq('wechat_name', '810测试')
        .single();
    
    if (primary810) {
        const { data: secondary810 } = await supabase
            .from('secondary_sales')
            .select('id, wechat_name')
            .eq('primary_sales_id', primary810.id);
        
        console.log(`810测试 (ID: ${primary810.id}) 现在有 ${secondary810?.length || 0} 个二级销售:`);
        secondary810?.forEach(s => {
            console.log(`  - ${s.wechat_name}`);
        });
    }
    
    // 最终提示
    console.log('\n✨ 修复完成！');
    console.log('\n下一步:');
    console.log('1. 刷新一级销售对账页面');
    console.log('2. 查询相关的一级销售');
    console.log('3. 应该能看到所有通过注册码注册的二级销售了');
    
    if (independentSecondary && independentSecondary.length > 0) {
        console.log('\n💡 提示:');
        console.log(`还有 ${independentSecondary.length} 个独立二级销售需要手动处理`);
        console.log('可以运行"智能修复二级销售关联.js"来手动选择关联');
    }
})();
