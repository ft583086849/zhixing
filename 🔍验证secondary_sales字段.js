// 🔍 验证 secondary_sales_name 字段是否存在
// 请在 https://zhixing-seven.vercel.app/ 任意页面的控制台运行此脚本

(async function() {
    console.log('='.repeat(60));
    console.log('🔍 验证 secondary_sales_name 字段...');
    console.log('='.repeat(60));
    
    try {
        const supabase = window.supabaseClient || window.supabase;
        if (!supabase) {
            console.error('❌ 未找到Supabase客户端');
            return;
        }
        
        // 1. 查询orders表的一条记录，看看有哪些字段
        console.log('\n📋 检查orders表的字段...');
        const { data: sampleOrder, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .limit(1);
        
        if (sampleOrder && sampleOrder.length > 0) {
            console.log('orders表的字段:');
            const fields = Object.keys(sampleOrder[0]);
            fields.forEach(field => {
                const value = sampleOrder[0][field];
                const type = value === null ? 'null' : typeof value;
                console.log(`  - ${field}: ${type}`);
            });
            
            // 检查是否有 secondary_sales_name 或 secondary_sales_id
            if (fields.includes('secondary_sales_name')) {
                console.log('\n✅ 存在 secondary_sales_name 字段');
                console.log('  示例值:', sampleOrder[0].secondary_sales_name);
            } else {
                console.log('\n❌ 不存在 secondary_sales_name 字段');
            }
            
            if (fields.includes('secondary_sales_id')) {
                console.log('✅ 存在 secondary_sales_id 字段');
                console.log('  示例值:', sampleOrder[0].secondary_sales_id);
            } else {
                console.log('❌ 不存在 secondary_sales_id 字段');
            }
            
            // 检查其他相关字段
            if (fields.includes('sales_code')) {
                console.log('✅ 存在 sales_code 字段');
            }
            if (fields.includes('sales_type')) {
                console.log('✅ 存在 sales_type 字段');
            }
        } else if (orderError) {
            console.error('查询失败:', orderError);
        } else {
            console.log('orders表为空');
        }
        
        // 2. 查询有二级销售的订单
        console.log('\n📋 查找有二级销售的订单...');
        
        // 尝试用 secondary_sales_name 查询
        console.log('\n尝试1: 查询 secondary_sales_name 不为空的订单...');
        const { data: ordersWithName, error: nameError } = await supabase
            .from('orders')
            .select('*')
            .not('secondary_sales_name', 'is', null)
            .limit(3);
        
        if (nameError) {
            console.error('❌ 查询secondary_sales_name失败:', nameError.message);
        } else if (ordersWithName && ordersWithName.length > 0) {
            console.log(`✅ 找到 ${ordersWithName.length} 个有secondary_sales_name的订单:`);
            ordersWithName.forEach((order, i) => {
                console.log(`  订单${i+1}: secondary_sales_name = "${order.secondary_sales_name}"`);
            });
        } else {
            console.log('⚠️ 没有找到有secondary_sales_name的订单');
        }
        
        // 尝试用 secondary_sales_id 查询
        console.log('\n尝试2: 查询 secondary_sales_id 不为空的订单...');
        const { data: ordersWithId, error: idError } = await supabase
            .from('orders')
            .select('*')
            .not('secondary_sales_id', 'is', null)
            .limit(3);
        
        if (idError) {
            console.error('❌ 查询secondary_sales_id失败:', idError.message);
        } else if (ordersWithId && ordersWithId.length > 0) {
            console.log(`✅ 找到 ${ordersWithId.length} 个有secondary_sales_id的订单:`);
            ordersWithId.forEach((order, i) => {
                console.log(`  订单${i+1}: secondary_sales_id = ${order.secondary_sales_id}`);
            });
        } else {
            console.log('⚠️ 没有找到有secondary_sales_id的订单');
        }
        
        // 3. 查询sales_type为secondary的订单
        console.log('\n尝试3: 查询 sales_type = "secondary" 的订单...');
        const { data: secondaryOrders, error: typeError } = await supabase
            .from('orders')
            .select('*')
            .eq('sales_type', 'secondary')
            .limit(3);
        
        if (secondaryOrders && secondaryOrders.length > 0) {
            console.log(`✅ 找到 ${secondaryOrders.length} 个二级销售订单:`);
            secondaryOrders.forEach((order, i) => {
                console.log(`  订单${i+1}:`);
                console.log(`    - sales_code: ${order.sales_code}`);
                console.log(`    - sales_type: ${order.sales_type}`);
                console.log(`    - secondary_sales_id: ${order.secondary_sales_id || '空'}`);
                console.log(`    - secondary_sales_name: ${order.secondary_sales_name || '空'}`);
            });
        } else {
            console.log('⚠️ 没有找到sales_type为secondary的订单');
        }
        
        // 4. 总结
        console.log('\n' + '='.repeat(60));
        console.log('📊 总结:');
        console.log('1. orders表实际字段已确认');
        console.log('2. 判断二级销售订单的正确方法:');
        console.log('   - 使用 sales_type = "secondary"');
        console.log('   - 或使用 secondary_sales_id 不为空');
        console.log('3. secondary_sales_name 可能是:');
        console.log('   - 前端代码的错误');
        console.log('   - 需要迁移的旧字段名');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('验证过程出错:', error);
    }
})();
