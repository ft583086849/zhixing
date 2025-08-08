// 在浏览器控制台运行，检查销售之间的关联关系
// 使用前请先登录管理员后台

(async function() {
    console.log('🔍 检查销售关联关系...\n');
    
    // 引入Supabase客户端
    const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
    
    const { createClient } = window.supabase || window.Supabase;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 1. 查找一级销售 "88晚上"
    console.log('1️⃣ 查找一级销售 "88晚上"...');
    const { data: primarySales, error: primaryError } = await supabase
        .from('primary_sales')
        .select('*')
        .or('wechat_name.eq.88晚上,sales_code.ilike.%88晚上%');
    
    if (primaryError) {
        console.error('查询失败:', primaryError);
        return;
    }
    
    console.log('找到一级销售:', primarySales);
    
    if (!primarySales || primarySales.length === 0) {
        console.error('❌ 未找到 "88晚上" 的一级销售记录');
        console.log('建议：请检查一级销售是否正确注册');
        return;
    }
    
    const primarySale = primarySales[0];
    console.log('一级销售详情:', {
        id: primarySale.id,
        sales_code: primarySale.sales_code,
        wechat_name: primarySale.wechat_name,
        created_at: primarySale.created_at
    });
    
    // 2. 查找所有二级销售 "88晚上的二级"
    console.log('\n2️⃣ 查找二级销售 "88晚上的二级"...');
    const { data: allSecondarySales, error: secondaryError } = await supabase
        .from('secondary_sales')
        .select('*')
        .or('wechat_name.eq.88晚上的二级,sales_code.ilike.%88晚上%');
    
    if (secondaryError) {
        console.error('查询失败:', secondaryError);
        return;
    }
    
    console.log('找到相关二级销售:', allSecondarySales);
    
    if (!allSecondarySales || allSecondarySales.length === 0) {
        console.error('❌ 未找到 "88晚上的二级" 的记录');
        console.log('建议：请确认二级销售是否成功注册');
        return;
    }
    
    // 3. 检查关联关系
    console.log('\n3️⃣ 检查关联关系...');
    allSecondarySales.forEach(secondary => {
        console.log(`\n二级销售: ${secondary.wechat_name}`);
        console.log(`  - ID: ${secondary.id}`);
        console.log(`  - Sales Code: ${secondary.sales_code}`);
        console.log(`  - Primary Sales ID: ${secondary.primary_sales_id || '❌ 未设置'}`);
        console.log(`  - 创建时间: ${secondary.created_at}`);
        
        if (secondary.primary_sales_id === primarySale.id) {
            console.log('  ✅ 已正确关联到 "88晚上"');
        } else if (secondary.primary_sales_id) {
            console.log(`  ⚠️ 关联到了其他一级销售 (ID: ${secondary.primary_sales_id})`);
        } else {
            console.log('  ❌ 未关联到任何一级销售（独立销售）');
        }
    });
    
    // 4. 查找该一级销售下的所有二级销售
    console.log('\n4️⃣ 查找 "88晚上" 下的所有二级销售...');
    const { data: linkedSecondary, error: linkedError } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('primary_sales_id', primarySale.id);
    
    if (linkedError) {
        console.error('查询失败:', linkedError);
        return;
    }
    
    console.log(`找到 ${linkedSecondary?.length || 0} 个关联的二级销售:`);
    linkedSecondary?.forEach(s => {
        console.log(`  - ${s.wechat_name} (${s.sales_code})`);
    });
    
    // 5. 建议修复方案
    console.log('\n5️⃣ 问题诊断和修复建议:');
    
    const needsFix = allSecondarySales.find(s => 
        s.wechat_name === '88晚上的二级' && 
        s.primary_sales_id !== primarySale.id
    );
    
    if (needsFix) {
        console.log('❌ 发现问题：二级销售未正确关联');
        console.log('\n修复SQL命令：');
        console.log(`UPDATE secondary_sales SET primary_sales_id = '${primarySale.id}' WHERE id = '${needsFix.id}';`);
        
        console.log('\n或在控制台运行以下代码修复：');
        console.log(`
await supabase
    .from('secondary_sales')
    .update({ primary_sales_id: '${primarySale.id}' })
    .eq('id', '${needsFix.id}');
        `);
    } else if (allSecondarySales.find(s => s.wechat_name === '88晚上的二级' && s.primary_sales_id === primarySale.id)) {
        console.log('✅ 关联关系正确，但可能是缓存问题');
        console.log('建议：清除浏览器缓存后重新访问');
    } else {
        console.log('⚠️ 二级销售可能未注册或数据异常');
    }
    
    return {
        primary: primarySale,
        secondary: allSecondarySales,
        linked: linkedSecondary
    };
})();
