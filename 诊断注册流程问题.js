// 诊断为什么二级销售的primary_sales_id会为空
// 检查注册流程是否正确

(async function() {
    console.log('🔍 诊断二级销售注册流程问题\n');
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
    
    // 1. 检查所有二级销售的关联状态
    console.log('1️⃣ 检查所有二级销售的关联状态...\n');
    
    const { data: allSecondary } = await supabase
        .from('secondary_sales')
        .select('*')
        .order('created_at', { ascending: false });
    
    const withPrimaryId = allSecondary?.filter(s => s.primary_sales_id) || [];
    const withoutPrimaryId = allSecondary?.filter(s => !s.primary_sales_id) || [];
    
    console.log(`总二级销售数: ${allSecondary?.length || 0}`);
    console.log(`✅ 有primary_sales_id: ${withPrimaryId.length} 个`);
    console.log(`❌ 没有primary_sales_id: ${withoutPrimaryId.length} 个`);
    
    // 2. 分析没有primary_sales_id的原因
    if (withoutPrimaryId.length > 0) {
        console.log('\n2️⃣ 分析未关联的二级销售...\n');
        
        // 检查是否有registration_code
        const withRegCode = withoutPrimaryId.filter(s => s.registration_code);
        const withoutRegCode = withoutPrimaryId.filter(s => !s.registration_code);
        
        console.log(`有registration_code但没有primary_sales_id: ${withRegCode.length} 个`);
        console.log(`没有registration_code也没有primary_sales_id: ${withoutRegCode.length} 个`);
        
        // 显示前5个有registration_code但没有primary_sales_id的
        if (withRegCode.length > 0) {
            console.log('\n⚠️ 有注册码但未关联的二级销售（前5个）:');
            withRegCode.slice(0, 5).forEach(s => {
                console.log(`  - ${s.wechat_name}`);
                console.log(`    registration_code: ${s.registration_code}`);
                console.log(`    created_at: ${s.created_at}`);
            });
            
            // 尝试验证这些registration_code
            console.log('\n3️⃣ 验证这些注册码...\n');
            
            for (const secondary of withRegCode.slice(0, 3)) {
                const { data: primary } = await supabase
                    .from('primary_sales')
                    .select('id, wechat_name, secondary_registration_code')
                    .eq('secondary_registration_code', secondary.registration_code)
                    .single();
                
                if (primary) {
                    console.log(`✅ ${secondary.wechat_name} 的注册码有效`);
                    console.log(`   应该关联到: ${primary.wechat_name} (ID: ${primary.id})`);
                    console.log(`   ❌ 但是primary_sales_id为空，说明注册时出错了`);
                } else {
                    console.log(`❌ ${secondary.wechat_name} 的注册码无效`);
                    console.log(`   registration_code: ${secondary.registration_code}`);
                }
            }
        }
        
        // 显示没有registration_code的
        if (withoutRegCode.length > 0) {
            console.log('\n⚠️ 既没有注册码也没有关联的二级销售（前5个）:');
            withoutRegCode.slice(0, 5).forEach(s => {
                console.log(`  - ${s.wechat_name}`);
                console.log(`    created_at: ${s.created_at}`);
                console.log(`    💡 可能是独立注册的二级销售`);
            });
        }
    }
    
    // 3. 检查一级销售的注册码
    console.log('\n4️⃣ 检查一级销售的注册码...\n');
    
    const { data: allPrimary } = await supabase
        .from('primary_sales')
        .select('id, wechat_name, secondary_registration_code')
        .order('created_at', { ascending: false })
        .limit(10);
    
    console.log('最近的10个一级销售:');
    allPrimary?.forEach(p => {
        console.log(`  ${p.wechat_name}`);
        console.log(`    ID: ${p.id}`);
        console.log(`    注册码: ${p.secondary_registration_code || '❌ 无'}`);
    });
    
    // 4. 检查注册码重复
    console.log('\n5️⃣ 检查注册码是否有重复...\n');
    
    const regCodes = allPrimary?.map(p => p.secondary_registration_code).filter(Boolean) || [];
    const duplicates = regCodes.filter((code, index) => regCodes.indexOf(code) !== index);
    
    if (duplicates.length > 0) {
        console.log('❌ 发现重复的注册码:', duplicates);
    } else {
        console.log('✅ 没有重复的注册码');
    }
    
    // 5. 诊断结论
    console.log('\n📊 诊断结论:');
    console.log('=====================================');
    
    if (withoutPrimaryId.length > 0) {
        console.log('\n❌ 发现问题:');
        console.log(`1. 有 ${withoutPrimaryId.length} 个二级销售没有primary_sales_id`);
        
        if (withRegCode.length > 0) {
            console.log(`2. 其中 ${withRegCode.length} 个有registration_code但未关联`);
            console.log('   说明: 注册流程有bug，registration_code没有正确转换为primary_sales_id');
        }
        
        if (withoutRegCode.length > 0) {
            console.log(`3. 其中 ${withoutRegCode.length} 个既没有registration_code也没有primary_sales_id`);
            console.log('   说明: 可能是独立注册的二级销售（不通过一级销售的链接）');
        }
        
        console.log('\n🔧 修复建议:');
        console.log('1. 对于有registration_code的，可以根据注册码找到对应的一级销售并关联');
        console.log('2. 对于没有registration_code的，需要手动判断应该关联到哪个一级销售');
        console.log('3. 修复注册流程的bug，确保future的二级销售正确关联');
    } else {
        console.log('✅ 所有二级销售都已正确关联');
    }
    
    // 6. 提供修复脚本
    if (withRegCode.length > 0) {
        console.log('\n💡 修复脚本（修复有注册码但未关联的）:');
        console.log('=====================================');
        console.log(`
// 修复有registration_code但没有primary_sales_id的二级销售
async function fixRegistrationCodeLinks() {
    const { data: brokenSecondary } = await supabase
        .from('secondary_sales')
        .select('*')
        .not('registration_code', 'is', null)
        .is('primary_sales_id', null);
    
    for (const secondary of brokenSecondary) {
        const { data: primary } = await supabase
            .from('primary_sales')
            .select('id')
            .eq('secondary_registration_code', secondary.registration_code)
            .single();
        
        if (primary) {
            await supabase
                .from('secondary_sales')
                .update({ primary_sales_id: primary.id })
                .eq('id', secondary.id);
            console.log(\`✅ 修复了 \${secondary.wechat_name}\`);
        }
    }
}

// 运行修复
// fixRegistrationCodeLinks();
        `);
    }
})();
