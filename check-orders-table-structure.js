const { createClient } = require('@supabase/supabase-js');

// 使用项目中正确的Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersTableStructure() {
    console.log('=== 检查 orders_optimized 表结构 ===\n');
    
    try {
        // 查询一条记录来查看所有字段
        const { data: sampleOrder, error: sampleError } = await supabase
            .from('orders_optimized')
            .select('*')
            .limit(1)
            .single();
        
        if (sampleError) {
            console.error('❌ 查询示例订单失败:', sampleError);
            return;
        }
        
        console.log('✅ orders_optimized 表所有字段:');
        Object.keys(sampleOrder).forEach((field, index) => {
            console.log(`${(index + 1).toString().padStart(2, ' ')}. ${field}: ${typeof sampleOrder[field]} (示例值: ${JSON.stringify(sampleOrder[field])})`);
        });
        
        console.log('\n=== 查看更多订单示例 ===');
        
        // 查询多条记录来了解数据情况
        const { data: moreOrders, error: moreError } = await supabase
            .from('orders_optimized')
            .select('*')
            .limit(5);
        
        if (moreError) {
            console.error('❌ 查询更多订单失败:', moreError);
            return;
        }
        
        moreOrders.forEach((order, index) => {
            console.log(`\n订单${index + 1}:`);
            console.log(`  - id: ${order.id}`);
            console.log(`  - wechat_name: ${order.wechat_name}`);
            console.log(`  - amount: ${order.amount}`);
            console.log(`  - duration: ${order.duration}`);
            console.log(`  - status: ${order.status}`);
            console.log(`  - created_at: ${order.created_at}`);
            
            // 检查可能的订单编号字段
            if (order.order_number) console.log(`  - order_number: ${order.order_number}`);
            if (order.order_code) console.log(`  - order_code: ${order.order_code}`);
        });
        
        console.log('\n=== 检查 duration 字段值 ===');
        
        const { data: durationData, error: durationError } = await supabase
            .from('orders_optimized')
            .select('duration')
            .not('duration', 'is', null)
            .limit(20);
        
        if (durationError) {
            console.error('❌ 查询duration数据失败:', durationError);
        } else {
            const durationCounts = {};
            durationData.forEach(order => {
                const duration = order.duration || '未知/空';
                durationCounts[duration] = (durationCounts[duration] || 0) + 1;
            });
            
            console.log('✅ Duration值分布:');
            Object.entries(durationCounts).forEach(([duration, count]) => {
                console.log(`    - "${duration}": ${count}个订单`);
            });
        }
        
        console.log('\n=== 检查状态分布 ===');
        
        const { data: statusData, error: statusError } = await supabase
            .from('orders_optimized')
            .select('status');
        
        if (statusError) {
            console.error('❌ 查询状态数据失败:', statusError);
        } else {
            const statusCounts = {};
            statusData.forEach(order => {
                const status = order.status || '未知/空';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            
            console.log('✅ 状态分布:');
            Object.entries(statusCounts).forEach(([status, count]) => {
                console.log(`    - "${status}": ${count}个订单`);
            });
        }
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error);
    }
    
    console.log('\n=== 表结构检查完成 ===');
}

checkOrdersTableStructure();