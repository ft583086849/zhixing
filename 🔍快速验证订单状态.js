// 🔍 快速验证88测试员一级的订单状态
// 在任何页面控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 快速验证订单状态和佣金计算');
    console.log('='.repeat(60));
    
    const supabaseClient = window.supabaseClient || window.supabase;
    if (!supabaseClient) {
        console.error('❌ 未找到Supabase客户端');
        return;
    }
    
    // 查询所有订单
    const { data: orders } = await supabaseClient
        .from('orders')
        .select('*');
    
    console.log(`\n📊 订单总数: ${orders?.length || 0}`);
    
    // 统计订单状态分布
    const statusCount = {};
    orders?.forEach(order => {
        const status = order.status || 'null';
        statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    console.log('\n📋 订单状态分布:');
    Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}个`);
    });
    
    // 验证佣金计算逻辑
    console.log('\n💰 佣金计算验证:');
    console.log('根据当前代码逻辑，只有以下状态的订单会计入佣金:');
    console.log('  - confirmed');
    console.log('  - confirmed_configuration');
    console.log('  - confirmed_config');
    console.log('  - active');
    
    const confirmedStatuses = ['confirmed', 'confirmed_configuration', 'confirmed_config', 'active'];
    const confirmedOrders = orders?.filter(order => 
        confirmedStatuses.includes(order.status)
    ) || [];
    
    let total_commission = 0;
    confirmedOrders.forEach(order => {
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
        const commission = amountUSD * 0.4; // 默认40%佣金
        total_commission += commission;
    });
    
    console.log(`\n✅ 确认订单数: ${confirmedOrders.length}`);
    console.log(`💵 应计算的总佣金: $${total_commission.toFixed(2)}`);
    
    // 特别检查88测试员一级的订单
    console.log('\n🔍 查找88测试员一级的订单:');
    const { data: sales88 } = await supabaseClient
        .from('primary_sales')
        .select('sales_code')
        .or('wechat_name.ilike.%88测试员%,name.ilike.%88测试员%');
    
    if (sales88 && sales88.length > 0) {
        for (const sale of sales88) {
            const salesOrders = orders?.filter(o => o.sales_code === sale.sales_code) || [];
            console.log(`\n  销售代码 ${sale.sales_code}:`);
            console.log(`    总订单: ${salesOrders.length}个`);
            
            salesOrders.forEach(order => {
                console.log(`    - 订单号: ${order.order_number}`);
                console.log(`      状态: ${order.status}`);
                console.log(`      金额: ${order.actual_payment_amount || order.amount}`);
                console.log(`      是否计入佣金: ${confirmedStatuses.includes(order.status) ? '✅ 是' : '❌ 否'}`);
            });
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 结论:');
    if (Object.keys(statusCount).includes('confirmed_config')) {
        if (confirmedOrders.length === 0) {
            console.log('❌ 有 confirmed_config 状态的订单，但修改前的代码不认这个状态');
            console.log('✅ 修改后的代码已经包含 confirmed_config，佣金应该能正确计算');
        } else {
            console.log('✅ confirmed_config 状态已被正确识别');
        }
    }
    console.log('='.repeat(60));
})();
