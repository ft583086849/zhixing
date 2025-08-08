// 🔧 修复确认订单状态问题
// 将config_confirmed=true的订单状态更新为confirmed_configuration
// 请在 https://zhixing-seven.vercel.app/admin/sales 页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔧 开始修复确认订单状态...');
    console.log('='.repeat(60));
    
    try {
        // 1. 获取Supabase客户端
        const supabaseClient = window.supabaseClient || window.supabase;
        if (!supabaseClient) {
            console.error('❌ 未找到Supabase客户端');
            return;
        }
        
        // 2. 查找所有config_confirmed=true但状态不正确的订单
        console.log('\n📊 查找需要修复的订单...');
        
        const { data: orders, error: fetchError } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('config_confirmed', true)
            .not('status', 'in', '(confirmed,confirmed_configuration,active)');
        
        if (fetchError) {
            console.error('❌ 查询订单失败:', fetchError);
            return;
        }
        
        if (!orders || orders.length === 0) {
            console.log('✅ 没有需要修复的订单');
            return;
        }
        
        console.log(`\n🔍 找到 ${orders.length} 个需要修复的订单`);
        
        // 3. 显示需要修复的订单
        console.log('\n📋 需要修复的订单列表:');
        orders.forEach((order, index) => {
            console.log(`  ${index + 1}. 订单号: ${order.order_number}`);
            console.log(`     当前状态: ${order.status}`);
            console.log(`     销售代码: ${order.sales_code}`);
            console.log(`     金额: ${order.actual_payment_amount || order.amount}`);
        });
        
        // 4. 询问用户是否确认修复
        const confirmMessage = `\n⚠️ 确认要将这 ${orders.length} 个订单的状态更新为 confirmed_configuration 吗？\n` +
                              `这将使这些订单被计入"已配置确认订单金额"。\n` +
                              `输入 fix() 执行修复，或刷新页面取消。`;
        console.log(confirmMessage);
        
        // 5. 定义修复函数
        window.fix = async function() {
            console.log('\n🔧 开始修复订单状态...');
            
            let successCount = 0;
            let failCount = 0;
            
            for (const order of orders) {
                try {
                    const { error: updateError } = await supabaseClient
                        .from('orders')
                        .update({ 
                            status: 'confirmed_configuration',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', order.id);
                    
                    if (updateError) {
                        console.error(`  ❌ 订单 ${order.order_number} 更新失败:`, updateError);
                        failCount++;
                    } else {
                        console.log(`  ✅ 订单 ${order.order_number} 状态已更新为 confirmed_configuration`);
                        successCount++;
                    }
                } catch (error) {
                    console.error(`  ❌ 订单 ${order.order_number} 更新异常:`, error);
                    failCount++;
                }
            }
            
            console.log('\n' + '='.repeat(60));
            console.log('📊 修复完成:');
            console.log(`  ✅ 成功: ${successCount} 个订单`);
            console.log(`  ❌ 失败: ${failCount} 个订单`);
            
            if (successCount > 0) {
                console.log('\n💡 提示:');
                console.log('  订单状态已更新，请刷新页面查看更新后的销售数据。');
                console.log('  确认订单金额和应返佣金额应该会正确显示了。');
            }
            
            console.log('='.repeat(60));
        };
        
        // 6. 提供快速查看特定销售的函数
        window.checkSales = async function(salesCode) {
            console.log(`\n📊 查看销售 ${salesCode} 的订单状态...`);
            
            const { data: salesOrders, error } = await supabaseClient
                .from('orders')
                .select('*')
                .eq('sales_code', salesCode);
            
            if (error) {
                console.error('查询失败:', error);
                return;
            }
            
            if (!salesOrders || salesOrders.length === 0) {
                console.log('未找到该销售的订单');
                return;
            }
            
            console.log(`找到 ${salesOrders.length} 个订单:`);
            
            const statusCount = {};
            let totalAmount = 0;
            let confirmedAmount = 0;
            
            salesOrders.forEach(order => {
                const status = order.status || 'null';
                statusCount[status] = (statusCount[status] || 0) + 1;
                
                const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
                const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
                totalAmount += amountUSD;
                
                if (['confirmed', 'confirmed_configuration', 'active'].includes(status)) {
                    confirmedAmount += amountUSD;
                }
            });
            
            console.log('\n订单状态分布:');
            Object.entries(statusCount).forEach(([status, count]) => {
                console.log(`  ${status}: ${count}个`);
            });
            
            console.log(`\n金额统计:`);
            console.log(`  总金额: $${totalAmount.toFixed(2)}`);
            console.log(`  确认订单金额: $${confirmedAmount.toFixed(2)}`);
            console.log(`  应返佣金 (40%): $${(confirmedAmount * 0.4).toFixed(2)}`);
        };
        
        console.log('\n💡 额外工具:');
        console.log('  输入 checkSales("销售代码") 查看特定销售的订单状态');
        console.log('  例如: checkSales("SR11ba84")');
        
    } catch (error) {
        console.error('脚本执行出错:', error);
    }
})();
