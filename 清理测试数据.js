// 在浏览器控制台运行此脚本清理测试数据

(async function() {
    console.log('🧹 开始清理测试数据...\n');
    
    // 引入Supabase客户端
    const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
    
    const { createClient } = window.supabase || window.Supabase;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 要清理的测试客户列表
    const testCustomers = [
        '测试客户-今天1',
        '测试客户-今天2',
        '测试客户-昨天',
        '测试客户-一周前',
        '测试客户-一月前',
        '测试客户-一年前'
    ];
    
    console.log('📋 要清理的测试客户:');
    testCustomers.forEach(c => console.log(`  - ${c}`));
    
    // 清理订单
    let deletedCount = 0;
    for (const customer of testCustomers) {
        const { data, error } = await supabase
            .from('orders')
            .delete()
            .eq('customer_wechat', customer)
            .select();
        
        if (error) {
            console.error(`❌ 清理失败 (${customer}):`, error);
        } else if (data && data.length > 0) {
            console.log(`✅ 清理成功: ${customer} (${data.length}条)`);
            deletedCount += data.length;
        }
    }
    
    console.log(`\n✨ 共清理 ${deletedCount} 条测试订单`);
    
    // 验证清理结果
    const { data: remainingOrders } = await supabase
        .from('orders')
        .select('customer_wechat')
        .in('customer_wechat', testCustomers);
    
    if (remainingOrders && remainingOrders.length > 0) {
        console.warn('⚠️ 还有未清理的测试数据:', remainingOrders.length, '条');
    } else {
        console.log('✅ 所有测试数据已清理完毕');
    }
    
    console.log('\n💡 提示: 请刷新页面查看清理后的数据');
    
    return {
        deleted: deletedCount,
        remaining: remainingOrders?.length || 0
    };
})();
