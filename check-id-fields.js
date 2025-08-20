const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIdFields() {
    console.log('🔍 检查ID字段类型和对应关系...');
    
    try {
        // 1. 检查sales_optimized的主键和相关字段
        console.log('\n1️⃣ sales_optimized表字段信息:');
        const { data: salesData } = await supabase
            .from('sales_optimized')
            .select('id, sales_code')
            .eq('sales_code', 'PRI17547241780648255')
            .single();
        
        console.log('销售记录:');
        console.log(`  id: ${salesData.id} (${typeof salesData.id})`);
        console.log(`  sales_code: ${salesData.sales_code}`);
        
        // 2. 检查orders_optimized的primary_sales_id字段值
        console.log('\n2️⃣ orders_optimized表的primary_sales_id值:');
        const { data: ordersData } = await supabase
            .from('orders_optimized')
            .select('id, primary_sales_id, sales_code')
            .eq('sales_code', 'PRI17547241780648255')
            .limit(3);
        
        if (ordersData && ordersData.length > 0) {
            console.log('订单记录示例:');
            ordersData.forEach((order, i) => {
                console.log(`订单 ${i+1}:`);
                console.log(`  id: ${order.id} (${typeof order.id})`);
                console.log(`  primary_sales_id: ${order.primary_sales_id} (${typeof order.primary_sales_id})`);
                console.log(`  sales_code: ${order.sales_code}`);
            });
        }
        
        // 3. 检查不同的primary_sales_id值
        console.log('\n3️⃣ 检查所有primary_sales_id值:');
        const { data: allPrimarySalesIds } = await supabase
            .from('orders_optimized')
            .select('primary_sales_id')
            .not('primary_sales_id', 'is', null)
            .limit(10);
        
        if (allPrimarySalesIds) {
            const uniqueIds = [...new Set(allPrimarySalesIds.map(o => o.primary_sales_id))];
            console.log('不同的primary_sales_id值:', uniqueIds);
        }
        
        // 4. 尝试通过数值ID查询
        console.log('\n4️⃣ 尝试通过数值primary_sales_id=4查询:');
        const { data: ordersById, error } = await supabase
            .from('orders_optimized')
            .select('id, order_number, sales_code, primary_sales_id, amount, status')
            .eq('primary_sales_id', 4)
            .limit(5);
        
        if (error) {
            console.log('❌ 查询错误:', error);
        } else {
            console.log(`✅ 找到 ${ordersById.length} 条记录:`);
            ordersById.forEach((order, i) => {
                console.log(`订单 ${i+1}: ${order.order_number}, sales_code: ${order.sales_code}, primary_sales_id: ${order.primary_sales_id}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 检查过程出错:', error);
    }
}

checkIdFields();