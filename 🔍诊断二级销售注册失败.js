// 🔍 诊断二级销售注册失败问题
// 在浏览器控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 诊断二级销售注册失败');
    console.log('='.repeat(60));
    
    const registrationCode = 'SEC17546345796242856';
    
    // 1. 检查一级销售表中的数据
    console.log('\n📊 检查primary_sales表中的secondary_registration_code字段:');
    
    try {
        // 获取supabase客户端
        const supabaseClient = window.supabaseClient || window.supabase;
        
        if (!supabaseClient) {
            console.error('❌ Supabase客户端未找到');
            return;
        }
        
        // 查询所有一级销售的注册码
        const { data: allPrimarySales, error: allError } = await supabaseClient
            .from('primary_sales')
            .select('id, wechat_name, sales_code, secondary_registration_code, created_at')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (allError) {
            console.error('❌ 查询primary_sales失败:', allError);
        } else {
            console.log('\n📋 最近的一级销售记录:');
            allPrimarySales.forEach(sale => {
                console.log(`  ID: ${sale.id}`);
                console.log(`  微信名: ${sale.wechat_name}`);
                console.log(`  销售代码: ${sale.sales_code}`);
                console.log(`  二级注册码: ${sale.secondary_registration_code || '❌ 空值'}`);
                console.log(`  创建时间: ${sale.created_at}`);
                console.log('  ---');
            });
        }
        
        // 2. 查找特定的注册码
        console.log('\n🔍 查找注册码:', registrationCode);
        
        const { data: specificSale, error: specificError } = await supabaseClient
            .from('primary_sales')
            .select('*')
            .eq('secondary_registration_code', registrationCode)
            .single();
        
        if (specificError) {
            if (specificError.code === 'PGRST116') {
                console.error('❌ 未找到该注册码对应的一级销售');
                
                // 尝试模糊搜索
                console.log('\n🔍 尝试模糊搜索包含SEC的注册码:');
                const { data: fuzzyResults, error: fuzzyError } = await supabaseClient
                    .from('primary_sales')
                    .select('sales_code, secondary_registration_code')
                    .ilike('secondary_registration_code', '%SEC%');
                
                if (!fuzzyError && fuzzyResults) {
                    console.log('找到的相关注册码:');
                    fuzzyResults.forEach(r => {
                        console.log(`  ${r.sales_code}: ${r.secondary_registration_code}`);
                    });
                }
            } else {
                console.error('❌ 查询失败:', specificError);
            }
        } else {
            console.log('✅ 找到对应的一级销售:', specificSale);
        }
        
        // 3. 检查是否已存在同样的二级销售
        console.log('\n🔍 检查是否已存在相同的二级销售:');
        
        const { data: existingSecondary, error: secondaryError } = await supabaseClient
            .from('secondary_sales')
            .select('*')
            .eq('registration_code', registrationCode);
        
        if (!secondaryError && existingSecondary) {
            if (existingSecondary.length > 0) {
                console.log('⚠️ 已存在使用该注册码的二级销售:');
                existingSecondary.forEach(s => {
                    console.log(`  ID: ${s.id}, 微信名: ${s.wechat_name}`);
                });
            } else {
                console.log('✅ 没有重复的二级销售');
            }
        }
        
    } catch (error) {
        console.error('诊断失败:', error);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('诊断完成');
    console.log('='.repeat(60));
})();
