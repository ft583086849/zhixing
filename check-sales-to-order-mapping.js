const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSalesToOrderMapping() {
    console.log('🔍 检查如何从sales_code映射到primary_sales_id...');
    
    try {
        // 1. 查找所有一级销售
        console.log('\n1️⃣ 查找所有一级销售和其对应的primary_sales_id:');
        
        const { data: primarySales } = await supabase
            .from('sales_optimized')
            .select('sales_code, wechat_name')
            .eq('sales_type', 'primary')
            .limit(10);
        
        console.log('一级销售列表:');
        primarySales.forEach(sale => {
            console.log(`  ${sale.sales_code} (${sale.wechat_name})`);
        });
        
        // 2. 为每个销售代码查找对应的primary_sales_id
        console.log('\n2️⃣ 查找每个销售代码对应的primary_sales_id:');
        
        for (const sale of primarySales) {
            const { data: orders } = await supabase
                .from('orders_optimized')
                .select('primary_sales_id, sales_code')
                .eq('sales_code', sale.sales_code)
                .limit(1);
            
            if (orders && orders.length > 0) {
                console.log(`  ${sale.sales_code} → primary_sales_id: ${orders[0].primary_sales_id}`);
            } else {
                console.log(`  ${sale.sales_code} → 未找到订单`);
            }
        }
        
        // 3. 构建完整的映射表
        console.log('\n3️⃣ 构建销售代码到primary_sales_id的映射:');
        const salesIdMapping = {};
        
        for (const sale of primarySales) {
            const { data: orders } = await supabase
                .from('orders_optimized')
                .select('primary_sales_id')
                .eq('sales_code', sale.sales_code)
                .not('primary_sales_id', 'is', null)
                .limit(1);
            
            if (orders && orders.length > 0) {
                salesIdMapping[sale.sales_code] = orders[0].primary_sales_id;
            }
        }
        
        console.log('映射关系:', salesIdMapping);
        
        // 4. 测试我们关心的销售代码
        const testSalesCode = 'PRI17547241780648255';
        if (salesIdMapping[testSalesCode]) {
            console.log(`\n✅ 找到映射: ${testSalesCode} → primary_sales_id: ${salesIdMapping[testSalesCode]}`);
            
            // 验证这个映射
            const { data: verifyOrders } = await supabase
                .from('orders_optimized')
                .select('order_number, sales_code, primary_sales_id, amount, status')
                .eq('primary_sales_id', salesIdMapping[testSalesCode])
                .limit(5);
            
            console.log('\n验证查询结果:');
            verifyOrders.forEach(order => {
                console.log(`  ${order.order_number}: ${order.sales_code}, $${order.amount}, ${order.status}`);
            });
        }
        
        // 5. 提供修复方案
        console.log('\n🔧 修复方案:');
        console.log('1. 方法一: 先查询订单获取primary_sales_id，再使用该ID查询所有订单');
        console.log('2. 方法二: 直接通过sales_code查询订单，不使用primary_sales_id');
        console.log('3. 方法三: 在sales_optimized表中添加numeric_id字段存储数字ID');
        
    } catch (error) {
        console.error('❌ 检查过程出错:', error);
    }
}

checkSalesToOrderMapping();