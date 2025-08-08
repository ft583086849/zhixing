// 🔍 快速诊断 sales_type 为 NULL 的问题
// 请在 https://zhixing-seven.vercel.app/ 任意页面的控制台运行

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 诊断订单 sales_type 字段问题...');
    console.log('='.repeat(60));
    
    try {
        const supabase = window.supabaseClient || window.supabase;
        if (!supabase) {
            console.error('❌ 未找到Supabase客户端');
            return;
        }
        
        // 1. 统计 sales_type 分布
        console.log('\n📊 订单 sales_type 分布:');
        const { data: orders } = await supabase
            .from('orders')
            .select('*');
        
        const typeStats = {};
        orders.forEach(order => {
            const type = order.sales_type || 'NULL';
            typeStats[type] = (typeStats[type] || 0) + 1;
        });
        
        Object.entries(typeStats).forEach(([type, count]) => {
            const percentage = (count / orders.length * 100).toFixed(1);
            console.log(`  ${type}: ${count}个 (${percentage}%)`);
        });
        
        // 2. 分析 NULL 的订单
        const nullOrders = orders.filter(o => !o.sales_type);
        console.log(`\n❌ 有 ${nullOrders.length} 个订单的 sales_type 为 NULL`);
        
        if (nullOrders.length > 0) {
            console.log('\n分析这些订单的 sales_code:');
            
            // 获取所有销售数据
            const { data: primarySales } = await supabase
                .from('primary_sales')
                .select('sales_code');
            
            const { data: secondarySales } = await supabase
                .from('secondary_sales')
                .select('sales_code');
            
            const primaryCodes = new Set(primarySales.map(s => s.sales_code));
            const secondaryCodes = new Set(secondarySales.map(s => s.sales_code));
            
            let shouldBePrimary = 0;
            let shouldBeSecondary = 0;
            let unknown = 0;
            
            nullOrders.forEach(order => {
                if (primaryCodes.has(order.sales_code)) {
                    shouldBePrimary++;
                } else if (secondaryCodes.has(order.sales_code)) {
                    shouldBeSecondary++;
                } else {
                    unknown++;
                    console.log(`  ⚠️ 未知sales_code: ${order.sales_code}`);
                }
            });
            
            console.log(`\n诊断结果:`);
            console.log(`  应该是 primary: ${shouldBePrimary} 个`);
            console.log(`  应该是 secondary: ${shouldBeSecondary} 个`);
            console.log(`  无法判断: ${unknown} 个`);
            
            // 3. 显示示例
            console.log('\n示例订单（前5个）:');
            nullOrders.slice(0, 5).forEach((order, i) => {
                console.log(`  ${i+1}. 订单号: ${order.order_number}`);
                console.log(`     sales_code: ${order.sales_code}`);
                console.log(`     secondary_sales_id: ${order.secondary_sales_id || '空'}`);
                console.log(`     金额: $${order.amount}`);
                
                // 判断类型
                if (primaryCodes.has(order.sales_code)) {
                    console.log(`     💡 应该是: primary (一级销售)`);
                } else if (secondaryCodes.has(order.sales_code)) {
                    console.log(`     💡 应该是: secondary (二级销售)`);
                } else {
                    console.log(`     ❓ 无法判断`);
                }
            });
        }
        
        // 4. 总结
        console.log('\n' + '='.repeat(60));
        console.log('📋 问题总结:');
        console.log('1. 大部分订单的 sales_type 字段为 NULL');
        console.log('2. 这些是历史数据，创建时没有设置该字段');
        console.log('3. 需要根据 sales_code 判断并修复');
        console.log('\n💡 解决方案:');
        console.log('运行 🔧修复订单sales_type字段.sql 脚本');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('诊断过程出错:', error);
    }
})();
