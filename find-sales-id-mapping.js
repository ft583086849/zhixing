const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findSalesIdMapping() {
    console.log('🔍 寻找sales_optimized和orders_optimized的正确对应关系...');
    
    try {
        // 1. 检查是否有数字ID字段
        console.log('\n1️⃣ 检查sales_optimized表是否有数字ID字段:');
        const { data: salesFields } = await supabase
            .from('sales_optimized')
            .select('*')
            .eq('sales_code', 'PRI17547241780648255')
            .single();
        
        const numericFields = {};
        for (const [key, value] of Object.entries(salesFields)) {
            if (typeof value === 'number' && key !== 'commission_rate') {
                numericFields[key] = value;
            }
        }
        
        console.log('数字类型字段:', numericFields);
        
        // 检查可能的对应关系
        for (const [fieldName, fieldValue] of Object.entries(numericFields)) {
            console.log(`\n2️⃣ 测试字段 ${fieldName} = ${fieldValue}:`);
            
            const { data: testOrders, error } = await supabase
                .from('orders_optimized')
                .select('id, order_number, sales_code, primary_sales_id')
                .eq('primary_sales_id', fieldValue)
                .limit(3);
            
            if (!error && testOrders && testOrders.length > 0) {
                console.log(`✅ 通过 ${fieldName}=${fieldValue} 找到 ${testOrders.length} 条订单:`);
                testOrders.forEach(order => {
                    console.log(`  ${order.order_number} (sales_code: ${order.sales_code})`);
                });
            } else {
                console.log(`❌ 通过 ${fieldName}=${fieldValue} 未找到订单`);
            }
        }
        
        // 3. 检查是否存在old_id或类似字段
        console.log('\n3️⃣ 检查可能的映射字段:');
        const possibleMappingFields = ['old_id', 'original_id', 'legacy_id', 'numeric_id'];
        
        for (const field of possibleMappingFields) {
            if (salesFields[field] !== undefined) {
                console.log(`找到映射字段 ${field}: ${salesFields[field]}`);
                
                const { data: mappedOrders } = await supabase
                    .from('orders_optimized')
                    .select('id, order_number, sales_code, primary_sales_id')
                    .eq('primary_sales_id', salesFields[field])
                    .limit(3);
                
                if (mappedOrders && mappedOrders.length > 0) {
                    console.log(`✅ 通过 ${field} 找到正确映射!`);
                }
            }
        }
        
        // 4. 直接检查primary_sales_id=4的所有订单
        console.log('\n4️⃣ 详细检查primary_sales_id=4的所有订单:');
        const { data: allOrders } = await supabase
            .from('orders_optimized')
            .select('order_number, sales_code, primary_sales_id, amount, status, created_at')
            .eq('primary_sales_id', 4)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (allOrders) {
            console.log(`找到 ${allOrders.length} 条订单:`);
            allOrders.forEach(order => {
                console.log(`  ${order.order_number}: ${order.sales_code}, 金额: $${order.amount}, 状态: ${order.status}`);
            });
            
            // 检查这些订单的销售代码是否都对应同一个销售员
            const uniqueSalesCodes = [...new Set(allOrders.map(o => o.sales_code))];
            console.log(`\n这些订单涉及的销售代码: ${uniqueSalesCodes.join(', ')}`);
            
            if (uniqueSalesCodes.includes('PRI17547241780648255')) {
                console.log('✅ 确认: primary_sales_id=4 对应销售代码 PRI17547241780648255');
            }
        }
        
    } catch (error) {
        console.error('❌ 查找过程出错:', error);
    }
}

findSalesIdMapping();