const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testReminderLogic() {
    console.log('=== 测试修复后的催单逻辑 ===');
    
    // 获取需要催单的订单
    const { data: orders, error } = await supabase
        .from('orders_optimized')
        .select('id, status, customer_wechat, expiry_time, amount, is_reminded, reminded_at')
        .in('status', ['confirmed_config', 'active'])
        .not('expiry_time', 'is', null)
        .order('expiry_time', { ascending: true })
        .limit(20);
    
    if (error) {
        console.error('查询错误:', error);
        return;
    }
    
    console.log(`找到 ${orders.length} 个已生效订单`);
    
    // 应用催单逻辑
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let reminderOrders = [];
    
    orders.forEach(order => {
        if (!order.expiry_time) return;
        
        const expiryDate = new Date(order.expiry_time);
        expiryDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        // 修复后的催单逻辑
        const isActiveOrder = order.status === 'confirmed_config' || order.status === 'active';
        const isInReminderTimeRange = (daysDiff <= 7 && daysDiff >= -30); // 未来7天到过去30天
        const needReminder = isActiveOrder && isInReminderTimeRange && !order.is_reminded;
        
        if (needReminder) {
            reminderOrders.push({
                id: order.id,
                customer_wechat: order.customer_wechat,
                status: order.status,
                expiry_time: order.expiry_time.split('T')[0],
                daysDiff: daysDiff,
                is_reminded: order.is_reminded
            });
        }
    });
    
    console.log(`\n🎯 需要催单的订单: ${reminderOrders.length} 个`);
    
    reminderOrders.forEach(order => {
        const statusText = order.daysDiff >= 0 ? `${order.daysDiff}天后到期` : `已过期${Math.abs(order.daysDiff)}天`;
        console.log(`订单${order.id}: 微信=${order.customer_wechat}, 状态=${order.status}, ${statusText}`);
    });
    
    // 按到期状态分类
    const upcoming = reminderOrders.filter(o => o.daysDiff >= 0);
    const expired = reminderOrders.filter(o => o.daysDiff < 0);
    
    console.log(`\n📊 分类统计:`);
    console.log(`- 即将到期: ${upcoming.length} 个`);
    console.log(`- 已过期: ${expired.length} 个`);
    
    if (upcoming.length > 0) {
        console.log('\n⏰ 即将到期订单:');
        upcoming.forEach(order => {
            console.log(`  ${order.customer_wechat}: ${order.daysDiff}天后到期`);
        });
    }
    
    if (expired.length > 0) {
        console.log('\n⚠️ 已过期订单:');
        expired.forEach(order => {
            console.log(`  ${order.customer_wechat}: 已过期${Math.abs(order.daysDiff)}天`);
        });
    }
}

testReminderLogic().catch(console.error);