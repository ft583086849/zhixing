// 在浏览器控制台运行此脚本，清理所有测试数据

(async function() {
    console.log('🧹 开始清理测试数据...\n');
    
    // 引入Supabase客户端
    const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
    
    const { createClient } = window.supabase || window.Supabase;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    let totalDeleted = 0;
    
    // 步骤1: 清理测试订单
    console.log('📋 步骤1: 清理测试订单...');
    
    const testCustomerPatterns = [
        '今日客户%',
        '昨日客户%',
        '本周客户%',
        '本月客户%',
        '本年客户%',
        '待确认客户%',
        '测试客户%'
    ];
    
    for (const pattern of testCustomerPatterns) {
        const { data, error } = await supabase
            .from('orders')
            .delete()
            .ilike('customer_wechat', pattern)
            .select();
        
        if (!error && data) {
            console.log(`✅ 删除 ${pattern} 订单: ${data.length} 条`);
            totalDeleted += data.length;
        }
    }
    
    // 步骤2: 清理测试二级销售
    console.log('\n📋 步骤2: 清理测试二级销售...');
    
    const testSecondarySalesPatterns = [
        '测试二级%',
        '测试独立%',
        'SEC_ZHAO6_%',
        'SEC_QIAN7_%',
        'SEC_SUN8_%',
        'SEC_ZHOU9_%'
    ];
    
    for (const pattern of testSecondarySalesPatterns) {
        const { data, error } = await supabase
            .from('secondary_sales')
            .delete()
            .or(`wechat_name.ilike.${pattern},sales_code.ilike.${pattern}`)
            .select();
        
        if (!error && data) {
            console.log(`✅ 删除二级销售: ${data.length} 个`);
            totalDeleted += data.length;
        }
    }
    
    // 步骤3: 清理测试一级销售
    console.log('\n📋 步骤3: 清理测试一级销售...');
    
    const testPrimarySalesPatterns = [
        '测试销售%',
        'PRI_ZHANG3_%',
        'PRI_LI4_%',
        'PRI_WANG5_%'
    ];
    
    for (const pattern of testPrimarySalesPatterns) {
        const { data, error } = await supabase
            .from('primary_sales')
            .delete()
            .or(`wechat_name.ilike.${pattern},sales_code.ilike.${pattern}`)
            .select();
        
        if (!error && data) {
            console.log(`✅ 删除一级销售: ${data.length} 个`);
            totalDeleted += data.length;
        }
    }
    
    // 步骤4: 验证清理结果
    console.log('\n📊 步骤4: 验证清理结果...');
    
    // 检查是否还有测试订单
    const { data: remainingOrders } = await supabase
        .from('orders')
        .select('customer_wechat')
        .or('customer_wechat.ilike.%测试%,customer_wechat.ilike.%客户%')
        .limit(5);
    
    // 检查是否还有测试销售
    const { data: remainingPrimarySales } = await supabase
        .from('primary_sales')
        .select('wechat_name')
        .ilike('wechat_name', '%测试%')
        .limit(5);
    
    const { data: remainingSecondarySales } = await supabase
        .from('secondary_sales')
        .select('wechat_name')
        .ilike('wechat_name', '%测试%')
        .limit(5);
    
    console.log('\n✨ 清理完成！');
    console.log('================');
    console.log(`总共删除: ${totalDeleted} 条记录`);
    
    if (remainingOrders?.length > 0) {
        console.warn('⚠️ 还有未清理的测试订单:', remainingOrders.length, '条');
    }
    if (remainingPrimarySales?.length > 0) {
        console.warn('⚠️ 还有未清理的一级销售:', remainingPrimarySales.length, '个');
    }
    if (remainingSecondarySales?.length > 0) {
        console.warn('⚠️ 还有未清理的二级销售:', remainingSecondarySales.length, '个');
    }
    
    if (!remainingOrders?.length && !remainingPrimarySales?.length && !remainingSecondarySales?.length) {
        console.log('✅ 所有测试数据已清理完毕');
    }
    
    console.log('\n💡 提示:');
    console.log('1. 刷新页面查看清理后的效果');
    console.log('2. 如需重新生成测试数据，运行"生成完整测试数据.js"');
    
    return {
        deleted: totalDeleted,
        remaining: {
            orders: remainingOrders?.length || 0,
            primarySales: remainingPrimarySales?.length || 0,
            secondarySales: remainingSecondarySales?.length || 0
        }
    };
})();
