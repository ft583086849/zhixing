const { createClient } = require('@supabase/supabase-js');

// 使用项目的Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersStructure() {
    console.log('🔍 检查orders_optimized表结构...');
    
    try {
        // 获取一条订单记录来查看字段结构
        const { data: orders, error } = await supabase
            .from('orders_optimized')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌ 查询错误:', error);
            return;
        }
        
        if (orders && orders.length > 0) {
            console.log('✅ 表结构字段:');
            const fields = Object.keys(orders[0]);
            fields.forEach(field => {
                console.log(`  - ${field}: ${typeof orders[0][field]}`);
            });
            
            console.log('\n📊 示例数据:');
            console.log(JSON.stringify(orders[0], null, 2));
        }
        
        // 查找与PRI17547241780648255相关的订单
        console.log('\n🔍 查找与销售代码相关的订单...');
        
        // 尝试不同的字段名
        const possibleFields = ['sales_code', 'primary_sales_id', 'sales_id'];
        
        for (const field of possibleFields) {
            try {
                const { data: testOrders, error: testError } = await supabase
                    .from('orders_optimized')
                    .select('*')
                    .eq(field, 'PRI17547241780648255')
                    .limit(5);
                
                if (!testError && testOrders && testOrders.length > 0) {
                    console.log(`✅ 在字段 ${field} 中找到 ${testOrders.length} 条订单:`);
                    testOrders.forEach((order, i) => {
                        console.log(`订单 ${i+1}:`, {
                            order_id: order.order_id,
                            [field]: order[field],
                            amount: order.amount,
                            status: order.status,
                            commission: order.commission,
                            created_at: order.created_at
                        });
                    });
                }
            } catch (e) {
                console.log(`字段 ${field} 不存在`);
            }
        }
        
        // 查找销售ID相关的订单
        console.log('\n🔍 通过销售ID查找订单...');
        const salesId = '8aecc533-08fe-494e-92c5-f26ceb4ea008'; // 从前面的查询结果获取
        
        const { data: ordersBySalesId, error: salesIdError } = await supabase
            .from('orders_optimized')
            .select('*')
            .eq('primary_sales_id', salesId)
            .limit(10);
        
        if (salesIdError) {
            console.log('❌ 通过primary_sales_id查询失败:', salesIdError);
        } else {
            console.log(`✅ 通过primary_sales_id找到 ${ordersBySalesId.length} 条订单`);
            if (ordersBySalesId.length > 0) {
                console.log('订单示例:', {
                    order_id: ordersBySalesId[0].order_id,
                    primary_sales_id: ordersBySalesId[0].primary_sales_id,
                    amount: ordersBySalesId[0].amount,
                    commission: ordersBySalesId[0].commission,
                    status: ordersBySalesId[0].status
                });
            }
        }
        
    } catch (error) {
        console.error('❌ 检查过程中发生错误:', error);
    }
}

checkOrdersStructure();