// 🔍 诊断有效订单和佣金率问题
// 请在 https://zhixing-seven.vercel.app/admin/sales 页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 开始诊断有效订单和佣金率问题...');
    console.log('='.repeat(60));
    
    try {
        // 1. 直接查询Supabase订单表
        const supabaseClient = window.supabaseClient || window.supabase;
        if (!supabaseClient) {
            console.error('❌ 未找到Supabase客户端');
            return;
        }
        
        // 2. 获取所有订单数据
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*');
            
        if (error) {
            console.error('查询订单失败:', error);
            return;
        }
        
        console.log(`\n📊 共获取了 ${orders.length} 个订单`);
        
        // 3. 分析订单状态分布
        console.log('\n📋 订单状态分布:');
        const statusCount = {};
        orders.forEach(order => {
            const status = order.status || 'null';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });
        
        Object.entries(statusCount).forEach(([status, count]) => {
            const percentage = (count / orders.length * 100).toFixed(1);
            console.log(`  ${status}: ${count}个 (${percentage}%)`);
        });
        
        // 4. 检查有效订单的判断逻辑
        console.log('\n💡 有效订单判断逻辑分析:');
        console.log('当前代码中有效订单的条件是状态为以下之一:');
        console.log('  - confirmed_payment');
        console.log('  - pending_config');
        console.log('  - confirmed_configuration');  
        console.log('  - active');
        
        const validStatuses = ['confirmed_payment', 'pending_config', 'confirmed_configuration', 'active'];
        const validOrders = orders.filter(order => 
            validStatuses.includes(order.status)
        );
        
        console.log(`\n按当前逻辑，有效订单数: ${validOrders.length}/${orders.length}`);
        
        if (validOrders.length === 0) {
            console.log('⚠️ 问题确认：没有订单符合"有效订单"的状态条件！');
            console.log('\n建议的解决方案:');
            console.log('1. 检查订单实际状态值是否与代码中的状态值匹配');
            console.log('2. 可能需要调整有效订单的判断条件');
            
            // 提供更多信息
            console.log('\n实际的订单状态示例:');
            const sampleOrders = orders.slice(0, 5);
            sampleOrders.forEach((order, index) => {
                console.log(`订单${index + 1}: status="${order.status}", order_number="${order.order_number}"`);
            });
        }
        
        // 5. 检查销售数据和佣金率
        console.log('\n💰 检查销售佣金率设置:');
        const { data: primarySales } = await supabaseClient
            .from('primary_sales')
            .select('*')
            .limit(5);
            
        const { data: secondarySales } = await supabaseClient
            .from('secondary_sales')
            .select('*')
            .limit(5);
        
        if (primarySales && primarySales.length > 0) {
            console.log('\n一级销售佣金率:');
            primarySales.forEach(sale => {
                console.log(`  ${sale.sales_code}: commission_rate=${sale.commission_rate} (${sale.commission_rate ? sale.commission_rate + '%' : '未设置，默认40%'})`);
            });
        }
        
        if (secondarySales && secondarySales.length > 0) {
            console.log('\n二级销售佣金率:');
            secondarySales.forEach(sale => {
                const rate = sale.commission_rate || 0.3;
                const percentage = rate > 1 ? rate : rate * 100;
                console.log(`  ${sale.sales_code}: commission_rate=${sale.commission_rate} (${percentage}%)`);
            });
        }
        
        // 6. 诊断总结
        console.log('\n' + '='.repeat(60));
        console.log('📊 诊断总结:');
        
        const issues = [];
        
        if (validOrders.length === 0 && orders.length > 0) {
            issues.push('❌ 有效订单数为0：订单状态值与代码中的判断条件不匹配');
        }
        
        if (!primarySales?.some(s => s.commission_rate)) {
            issues.push('⚠️ 一级销售没有设置佣金率字段，使用默认40%');
        }
        
        issues.push('⚠️ 一级销售没有佣金率修改入口（代码问题）');
        
        if (issues.length > 0) {
            console.log('发现的问题:');
            issues.forEach(issue => console.log(`  ${issue}`));
        } else {
            console.log('✅ 未发现明显问题');
        }
        
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('诊断过程出错:', error);
    }
})();
