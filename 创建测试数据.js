// 在浏览器控制台运行此脚本创建测试数据
// 用于验证时间筛选功能是否正常工作

(async function() {
    console.log('🚀 开始创建测试数据...\n');
    
    // 引入Supabase客户端
    const supabaseUrl = 'https://xajoffhfvdbpgxnkkbmh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9mZmhmdmRicGd4bmtrYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzk1MjgsImV4cCI6MjA0OTkxNTUyOH0.iQwO_fGWJ2WHcWqA4TAjQVbt8YLvQC1cSA7GnMKZ5zA';
    
    const { createClient } = window.supabase || window.Supabase;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 获取当前日期
    const now = new Date();
    const today = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    // 测试数据配置
    const testOrders = [
        // 今天的订单
        {
            customer_wechat: '测试客户-今天1',
            sales_code: 'PRI88晚上',  // 确保使用存在的销售代码
            amount: 99,
            actual_payment_amount: 99,
            duration: '1month',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: today.toISOString(),
            payment_time: today.toISOString(),
            updated_at: today.toISOString()
        },
        {
            customer_wechat: '测试客户-今天2',
            sales_code: 'PRI88晚上',
            amount: 299,
            actual_payment_amount: 299,
            duration: '3months',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: today.toISOString(),
            payment_time: today.toISOString(),
            updated_at: today.toISOString()
        },
        
        // 昨天的订单
        {
            customer_wechat: '测试客户-昨天',
            sales_code: 'PRI88晚上',
            amount: 199,
            actual_payment_amount: 199,
            duration: '1month',
            payment_method: 'alipay',
            status: 'confirmed',
            created_at: yesterday.toISOString(),
            payment_time: yesterday.toISOString(),
            updated_at: yesterday.toISOString()
        },
        
        // 一周前的订单
        {
            customer_wechat: '测试客户-一周前',
            sales_code: 'PRI88晚上',
            amount: 599,
            actual_payment_amount: 599,
            duration: '6months',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: weekAgo.toISOString(),
            payment_time: weekAgo.toISOString(),
            updated_at: weekAgo.toISOString()
        },
        
        // 一个月前的订单
        {
            customer_wechat: '测试客户-一月前',
            sales_code: 'PRI88晚上',
            amount: 999,
            actual_payment_amount: 999,
            duration: '1year',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: monthAgo.toISOString(),
            payment_time: monthAgo.toISOString(),
            updated_at: monthAgo.toISOString()
        },
        
        // 一年前的订单
        {
            customer_wechat: '测试客户-一年前',
            sales_code: 'PRI88晚上',
            amount: 1999,
            actual_payment_amount: 1999,
            duration: '1year',
            payment_method: 'crypto',
            status: 'confirmed',
            created_at: yearAgo.toISOString(),
            payment_time: yearAgo.toISOString(),
            updated_at: yearAgo.toISOString()
        }
    ];
    
    console.log('📝 准备创建以下测试订单:');
    console.table(testOrders.map(o => ({
        客户: o.customer_wechat,
        金额: o.amount,
        时间: new Date(o.created_at).toLocaleDateString()
    })));
    
    // 创建订单
    const createdOrders = [];
    for (const order of testOrders) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .insert(order)
                .select()
                .single();
            
            if (error) {
                console.error(`❌ 创建订单失败 (${order.customer_wechat}):`, error);
            } else {
                console.log(`✅ 创建订单成功: ${order.customer_wechat}`);
                createdOrders.push(data);
            }
        } catch (err) {
            console.error(`❌ 创建订单异常:`, err);
        }
    }
    
    console.log(`\n✨ 成功创建 ${createdOrders.length} 个测试订单`);
    
    // 验证数据
    console.log('\n🔍 验证时间筛选...');
    
    // 查询今天的订单
    const { data: todayOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today.toISOString().split('T')[0])
        .lt('created_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    console.log(`今天的订单: ${todayOrders?.length || 0} 个`);
    
    // 查询本周的订单
    const { data: weekOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', weekAgo.toISOString());
    
    console.log(`本周的订单: ${weekOrders?.length || 0} 个`);
    
    // 查询本月的订单
    const { data: monthOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', monthAgo.toISOString());
    
    console.log(`本月的订单: ${monthOrders?.length || 0} 个`);
    
    // 查询本年的订单
    const { data: yearOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', yearAgo.toISOString());
    
    console.log(`本年的订单: ${yearOrders?.length || 0} 个`);
    
    console.log('\n💡 提示:');
    console.log('1. 请刷新数据概览页面查看时间筛选效果');
    console.log('2. 切换"今天/本周/本月/本年"查看数据变化');
    console.log('3. 如需清理测试数据，运行清理脚本');
    
    return {
        created: createdOrders,
        stats: {
            today: todayOrders?.length || 0,
            week: weekOrders?.length || 0,
            month: monthOrders?.length || 0,
            year: yearOrders?.length || 0
        }
    };
})();
