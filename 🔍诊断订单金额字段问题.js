// 🔍 诊断订单金额字段问题
// 请在 https://zhixing-seven.vercel.app/admin/sales 页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 开始诊断订单金额字段问题...');
    console.log('='.repeat(60));
    
    try {
        // 1. 直接查询Supabase订单表
        const supabaseClient = window.supabaseClient || window.supabase;
        if (!supabaseClient) {
            console.error('❌ 未找到Supabase客户端');
            return;
        }
        
        // 2. 获取订单数据
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*')
            .limit(10);
            
        if (error) {
            console.error('查询订单失败:', error);
            return;
        }
        
        console.log(`\n📊 获取了 ${orders.length} 个订单样例`);
        
        // 3. 分析订单字段
        if (orders.length > 0) {
            console.log('\n📋 第一个订单的所有字段:');
            const firstOrder = orders[0];
            Object.keys(firstOrder).forEach(key => {
                const value = firstOrder[key];
                if (key.includes('amount') || key.includes('price') || key.includes('payment')) {
                    console.log(`  ${key}: ${value} (💰 金额相关字段)`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            });
            
            console.log('\n💰 金额字段分析:');
            orders.forEach((order, index) => {
                console.log(`订单 ${index + 1}:`, {
                    order_number: order.order_number,
                    amount: order.amount,
                    actual_payment_amount: order.actual_payment_amount,
                    price: order.price,
                    total_amount: order.total_amount,
                    payment_method: order.payment_method,
                    status: order.status
                });
            });
            
            // 4. 检查哪个字段有实际值
            const fieldsWithValues = {
                amount: orders.filter(o => o.amount && o.amount > 0).length,
                actual_payment_amount: orders.filter(o => o.actual_payment_amount && o.actual_payment_amount > 0).length,
                price: orders.filter(o => o.price && o.price > 0).length,
                total_amount: orders.filter(o => o.total_amount && o.total_amount > 0).length
            };
            
            console.log('\n📊 各金额字段有值的订单数:');
            Object.entries(fieldsWithValues).forEach(([field, count]) => {
                const percentage = (count / orders.length * 100).toFixed(1);
                console.log(`  ${field}: ${count}/${orders.length} (${percentage}%)`);
            });
            
            // 5. 建议使用哪个字段
            console.log('\n💡 建议:');
            const recommendedField = Object.entries(fieldsWithValues)
                .sort((a, b) => b[1] - a[1])[0];
            
            if (recommendedField[1] > 0) {
                console.log(`✅ 建议使用 "${recommendedField[0]}" 字段作为订单金额`);
                console.log(`   该字段在 ${recommendedField[1]}/${orders.length} 个订单中有值`);
            } else {
                console.log('⚠️ 没有找到有效的金额字段！');
            }
            
            // 6. 测试API计算逻辑
            console.log('\n🧮 测试金额计算逻辑:');
            const testOrders = orders.slice(0, 3);
            
            // 使用amount字段计算
            const totalWithAmount = testOrders.reduce((sum, order) => {
                const amount = parseFloat(order.amount || 0);
                if (order.payment_method === 'alipay') {
                    return sum + (amount / 7.15);
                }
                return sum + amount;
            }, 0);
            
            // 使用actual_payment_amount字段计算
            const totalWithActual = testOrders.reduce((sum, order) => {
                const amount = parseFloat(order.actual_payment_amount || 0);
                if (order.payment_method === 'alipay') {
                    return sum + (amount / 7.15);
                }
                return sum + amount;
            }, 0);
            
            console.log('使用 amount 字段计算总额: $' + totalWithAmount.toFixed(2));
            console.log('使用 actual_payment_amount 字段计算总额: $' + totalWithActual.toFixed(2));
            
            if (totalWithAmount === 0 && totalWithActual > 0) {
                console.log('\n❌ 问题确认: API正在使用 "amount" 字段，但该字段为空！');
                console.log('✅ 解决方案: 需要修改API使用 "actual_payment_amount" 字段');
            }
        }
        
    } catch (error) {
        console.error('诊断过程出错:', error);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('诊断完成！');
    console.log('='.repeat(60));
})();
