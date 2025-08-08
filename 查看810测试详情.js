// 查看810测试在两个系统中的不同显示情况
// 帮助理解为什么管理员能看到而对账页面看不到

(async function() {
    console.log('🔍 对比810测试在两个系统中的显示\n');
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
    
    // 查找810测试
    const { data: primaryList } = await supabase
        .from('primary_sales')
        .select('*')
        .ilike('wechat_name', '%810%');
    
    if (!primaryList || primaryList.length === 0) {
        console.error('❌ 未找到包含810的一级销售');
        return;
    }
    
    const primary = primaryList.find(p => p.wechat_name === '810测试') || primaryList[0];
    
    console.log('📌 一级销售信息:');
    console.log('  微信号:', primary.wechat_name);
    console.log('  ID:', primary.id);
    console.log('  销售代码:', primary.sales_code);
    console.log('');
    
    // ========== 模拟管理员系统查询逻辑 ==========
    console.log('🏢 管理员系统查询逻辑:');
    console.log('-------------------------------------');
    
    // 1. 获取所有二级销售
    const { data: allSecondary } = await supabase
        .from('secondary_sales')
        .select('*');
    
    // 2. 通过名称匹配（模糊搜索）
    const searchTerm = '810';
    const adminNameMatch = allSecondary?.filter(s => {
        const name = s.wechat_name?.toLowerCase() || '';
        return name.includes(searchTerm.toLowerCase());
    }) || [];
    
    console.log(`1. 名称包含 "${searchTerm}" 的二级销售:`, adminNameMatch.length, '个');
    if (adminNameMatch.length > 0) {
        adminNameMatch.forEach(s => {
            console.log(`   - ${s.wechat_name} (primary_sales_id: ${s.primary_sales_id || '空'})`);
        });
    }
    
    // 3. 通过primary_sales_id匹配
    const adminIdMatch = allSecondary?.filter(s => 
        s.primary_sales_id === primary.id
    ) || [];
    
    console.log(`\n2. primary_sales_id = ${primary.id} 的二级销售:`, adminIdMatch.length, '个');
    if (adminIdMatch.length > 0) {
        adminIdMatch.forEach(s => {
            console.log(`   - ${s.wechat_name}`);
        });
    }
    
    // 4. 合并结果（管理员看到的）
    const adminTotal = new Set([...adminNameMatch, ...adminIdMatch]);
    console.log(`\n✅ 管理员系统总共显示:`, adminTotal.size, '个二级销售');
    
    // ========== 模拟一级对账页面查询逻辑 ==========
    console.log('\n\n💰 一级对账页面查询逻辑:');
    console.log('-------------------------------------');
    
    // 对账页面只通过primary_sales_id精确匹配
    const { data: settlementMatch } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('primary_sales_id', primary.id);
    
    console.log(`通过 primary_sales_id = ${primary.id} 查询:`);
    console.log(`结果:`, settlementMatch?.length || 0, '个二级销售');
    
    if (settlementMatch && settlementMatch.length > 0) {
        settlementMatch.forEach(s => {
            console.log(`  - ${s.wechat_name}`);
        });
    }
    
    // ========== 分析差异 ==========
    console.log('\n\n📊 差异分析:');
    console.log('=====================================');
    
    // 找出管理员能看到但对账页面看不到的
    const onlyInAdmin = Array.from(adminTotal).filter(s => 
        !settlementMatch?.find(sm => sm.id === s.id)
    );
    
    if (onlyInAdmin.length > 0) {
        console.log('⚠️ 管理员能看到但对账页面看不到的二级销售:');
        onlyInAdmin.forEach(s => {
            const reason = s.primary_sales_id ? 
                `关联到其他一级(ID: ${s.primary_sales_id})` : 
                'primary_sales_id 为空';
            console.log(`  - ${s.wechat_name}`);
            console.log(`    原因: ${reason}`);
            
            // 如果是名称匹配的，说明应该属于810测试
            if (s.wechat_name?.includes('810')) {
                console.log(`    💡 建议: 应该关联到810测试(ID: ${primary.id})`);
            }
        });
        
        console.log('\n🔧 修复建议:');
        console.log('1. 运行"智能修复二级销售关联.js"脚本');
        console.log('2. 选择要关联的二级销售');
        console.log('3. 确认关联到810测试');
    } else {
        console.log('✅ 两个系统显示一致');
    }
    
    // ========== 总结 ==========
    console.log('\n\n📝 总结:');
    console.log('=====================================');
    console.log('管理员系统: 支持名称模糊匹配 + primary_sales_id匹配');
    console.log('对账页面: 仅支持primary_sales_id精确匹配');
    console.log('');
    console.log('这就是为什么管理员能看到而对账页面看不到的原因');
    console.log('解决方案: 确保所有二级销售的primary_sales_id正确设置');
})();
