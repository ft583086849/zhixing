// 🔍 诊断88测试员一级确认订单金额为0的问题
// 请在 https://zhixing-seven.vercel.app/admin/sales 页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 开始诊断88测试员一级确认订单金额问题...');
    console.log('='.repeat(60));
    
    try {
        // 1. 获取Supabase客户端
        const supabaseClient = window.supabaseClient || window.supabase;
        if (!supabaseClient) {
            console.error('❌ 未找到Supabase客户端');
            return;
        }
        
        // 2. 查找88测试员一级的销售数据
        console.log('\n📊 查找88测试员一级的销售数据...');
        
        // 检查一级销售表
        const { data: primarySales, error: primaryError } = await supabaseClient
            .from('primary_sales')
            .select('*')
            .or('wechat_name.ilike.%88测试员%,name.ilike.%88测试员%');
            
        // 检查二级销售表
        const { data: secondarySales, error: secondaryError } = await supabaseClient
            .from('secondary_sales')
            .select('*')
            .or('wechat_name.ilike.%88测试员%,name.ilike.%88测试员%');
        
        console.log('一级销售中找到:', primarySales?.length || 0, '条记录');
        console.log('二级销售中找到:', secondarySales?.length || 0, '条记录');
        
        // 合并所有销售数据
        const allSales = [
            ...(primarySales || []).map(s => ({...s, sales_type: 'primary'})),
            ...(secondarySales || []).map(s => ({...s, sales_type: 'secondary'}))
        ];
        
        if (allSales.length === 0) {
            console.error('❌ 未找到88测试员一级的销售记录');
            return;
        }
        
        // 3. 对每个销售记录分析订单数据
        for (const sale of allSales) {
            console.log('\n' + '='.repeat(60));
            console.log(`📋 销售信息:`);
            console.log(`  类型: ${sale.sales_type === 'primary' ? '一级销售' : '二级销售'}`);
            console.log(`  销售代码: ${sale.sales_code}`);
            console.log(`  微信号: ${sale.wechat_name || sale.name || '未设置'}`);
            console.log(`  佣金率: ${sale.commission_rate || (sale.sales_type === 'primary' ? 40 : 30)}%`);
            
            // 4. 获取该销售的所有订单
            const { data: orders, error: orderError } = await supabaseClient
                .from('orders')
                .select('*')
                .eq('sales_code', sale.sales_code);
            
            if (orderError) {
                console.error('  获取订单失败:', orderError);
                continue;
            }
            
            console.log(`\n📦 订单统计:`);
            console.log(`  总订单数: ${orders?.length || 0}`);
            
            if (orders && orders.length > 0) {
                // 5. 分析订单状态分布
                const statusCount = {};
                orders.forEach(order => {
                    const status = order.status || 'null';
                    statusCount[status] = (statusCount[status] || 0) + 1;
                });
                
                console.log('\n  订单状态分布:');
                Object.entries(statusCount).forEach(([status, count]) => {
                    console.log(`    ${status}: ${count}个`);
                });
                
                // 6. 计算总金额（所有订单）
                const totalAmount = orders.reduce((sum, order) => {
                    const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
                    if (order.payment_method === 'alipay') {
                        return sum + (amount / 7.15); // 人民币转美元
                    }
                    return sum + amount;
                }, 0);
                
                console.log(`\n💰 金额计算:`);
                console.log(`  总金额: $${totalAmount.toFixed(2)}`);
                
                // 7. 分析确认订单（重点）
                console.log('\n🔍 确认订单分析:');
                console.log('  根据代码逻辑，确认订单的条件是状态为以下之一:');
                console.log('    - confirmed');
                console.log('    - confirmed_configuration');
                console.log('    - active');
                
                const confirmedStatuses = ['confirmed', 'confirmed_configuration', 'active'];
                const confirmedOrders = orders.filter(order => 
                    confirmedStatuses.includes(order.status)
                );
                
                console.log(`\n  符合条件的确认订单数: ${confirmedOrders.length}`);
                
                if (confirmedOrders.length > 0) {
                    console.log('\n  确认订单详情:');
                    confirmedOrders.forEach((order, index) => {
                        console.log(`    订单${index + 1}:`);
                        console.log(`      订单号: ${order.order_number}`);
                        console.log(`      状态: ${order.status}`);
                        console.log(`      金额: ${order.actual_payment_amount || order.amount || 0}`);
                        console.log(`      支付方式: ${order.payment_method}`);
                        console.log(`      创建时间: ${order.created_at}`);
                    });
                    
                    // 计算确认订单金额
                    const confirmedAmount = confirmedOrders.reduce((sum, order) => {
                        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
                        if (order.payment_method === 'alipay') {
                            return sum + (amount / 7.15);
                        }
                        return sum + amount;
                    }, 0);
                    
                    console.log(`\n  ✅ 已配置确认订单金额: $${confirmedAmount.toFixed(2)}`);
                    
                    // 计算应返佣金
                    let commissionRate = sale.commission_rate || (sale.sales_type === 'primary' ? 40 : 30);
                    if (commissionRate > 0 && commissionRate < 1) {
                        commissionRate = commissionRate * 100;
                    }
                    const commissionAmount = confirmedAmount * (commissionRate / 100);
                    console.log(`  💰 应返佣金额: $${commissionAmount.toFixed(2)} (佣金率: ${commissionRate}%)`);
                } else {
                    console.log('\n  ⚠️ 没有找到符合确认条件的订单！');
                    console.log('  这就是为什么确认订单金额显示为0的原因。');
                    
                    // 8. 分析可能的问题
                    console.log('\n❓ 可能的原因:');
                    console.log('  1. 订单状态不是 confirmed、confirmed_configuration 或 active');
                    console.log('  2. 订单状态更新可能没有成功');
                    console.log('  3. 您刚才配置确认的操作可能只是更新了 config_confirmed 字段');
                    console.log('     但没有更新 status 字段为正确的值');
                    
                    // 检查是否有config_confirmed为true但状态不对的订单
                    const configConfirmedOrders = orders.filter(order => order.config_confirmed === true);
                    if (configConfirmedOrders.length > 0) {
                        console.log('\n  ⚠️ 发现有 config_confirmed=true 但状态不符合的订单:');
                        configConfirmedOrders.forEach(order => {
                            if (!confirmedStatuses.includes(order.status)) {
                                console.log(`    订单号: ${order.order_number}, 状态: ${order.status}, config_confirmed: true`);
                            }
                        });
                        
                        console.log('\n💡 解决方案:');
                        console.log('  需要将这些订单的状态更新为 confirmed_configuration 或 active');
                        console.log('  而不仅仅是设置 config_confirmed = true');
                    }
                }
                
                // 9. 显示所有订单的详细状态
                console.log('\n📋 所有订单详细状态:');
                orders.forEach((order, index) => {
                    console.log(`  订单${index + 1}:`);
                    console.log(`    订单号: ${order.order_number}`);
                    console.log(`    状态: ${order.status}`);
                    console.log(`    config_confirmed: ${order.config_confirmed}`);
                    console.log(`    金额: ${order.actual_payment_amount || order.amount || 0}`);
                    console.log(`    支付方式: ${order.payment_method}`);
                });
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 诊断总结:');
        console.log('确认订单金额为0的原因是订单状态不符合确认条件。');
        console.log('解决方案：将订单状态更新为 confirmed_configuration 或 active，');
        console.log('而不是仅仅设置 config_confirmed = true。');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('诊断过程出错:', error);
    }
})();
