const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReminderData() {
    console.log('=== 1. 检查orders_optimized表结构 ===');
    
    // 先查询一个订单看有什么字段
    const { data: sample, error: sampleError } = await supabase
        .from('orders_optimized')
        .select('*')
        .limit(1);
    
    if (sampleError) {
        console.error('查询样本错误:', sampleError);
        return;
    }
    
    if (sample && sample.length > 0) {
        console.log('orders_optimized表的字段：');
        const fields = Object.keys(sample[0]);
        console.log(fields.join(', '));
        
        // 检查是否有催单相关字段
        const reminderFields = fields.filter(f => f.includes('remind') || f.includes('reminder'));
        console.log('催单相关字段：', reminderFields);
    }
    
    console.log('\n=== 2. 查询需要催单的订单 ===');
    
    // 查询状态为confirmed_config或active的订单
    const { data: orders, error: orderError } = await supabase
        .from('orders_optimized')
        .select('id, status, customer_wechat, expiry_time, amount, is_reminded, reminded_at')
        .in('status', ['confirmed_config', 'active'])
        .not('expiry_time', 'is', null)
        .order('expiry_time', { ascending: true })
        .limit(10);
    
    if (orderError) {
        console.error('查询订单错误:', orderError);
    } else {
        console.log('找到', orders?.length || 0, '个符合条件的订单：');
        orders?.forEach(order => {
            console.log(`订单 ${order.id}: 状态=${order.status}, 微信=${order.customer_wechat || 'null'}, 到期=${order.expiry_time}`);
        });
    }
    
    console.log('\n=== 3. 统计客户微信数据 ===');
    
    const { data: allOrders, error: allError } = await supabase
        .from('orders_optimized')
        .select('customer_wechat')
        .in('status', ['confirmed_config', 'active']);
    
    if (allError) {
        console.error('统计数据错误:', allError);
    } else {
        const total = allOrders?.length || 0;
        const hasWechat = allOrders?.filter(o => o.customer_wechat && o.customer_wechat.trim() !== '').length || 0;
        const emptyWechat = allOrders?.filter(o => o.customer_wechat === '').length || 0;
        const nullWechat = allOrders?.filter(o => !o.customer_wechat).length || 0;
        
        console.log(`总订单数: ${total}`);
        console.log(`有微信号: ${hasWechat}`);
        console.log(`微信号为空: ${emptyWechat}`);
        console.log(`微信号为null: ${nullWechat}`);
    }
    
    console.log('\n=== 4. 查看几个有微信的订单 ===');
    
    const { data: wechatOrders, error: wechatError } = await supabase
        .from('orders_optimized')
        .select('id, customer_wechat, tradingview_username, status, sales_code')
        .in('status', ['confirmed_config', 'active'])
        .not('customer_wechat', 'is', null)
        .neq('customer_wechat', '')
        .limit(5);
    
    if (wechatError) {
        console.error('查询微信订单错误:', wechatError);
    } else {
        console.log('有微信号的订单样本：');
        wechatOrders?.forEach(order => {
            console.log(`订单 ${order.id}: 微信=${order.customer_wechat}, TV用户=${order.tradingview_username || 'null'}`);
        });
    }
    
    console.log('\n=== 5. 检查特定时间范围内的订单 ===');
    
    // 查询最近30天到未来7天内到期的订单
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const { data: timeRangeOrders, error: timeError } = await supabase
        .from('orders_optimized')
        .select('id, status, customer_wechat, expiry_time, amount')
        .in('status', ['confirmed_config', 'active'])
        .gte('expiry_time', thirtyDaysAgo.toISOString().split('T')[0])
        .lte('expiry_time', sevenDaysLater.toISOString().split('T')[0])
        .not('expiry_time', 'is', null);
    
    if (timeError) {
        console.error('查询时间范围订单错误:', timeError);
    } else {
        console.log(`${thirtyDaysAgo.toISOString().split('T')[0]} 到 ${sevenDaysLater.toISOString().split('T')[0]} 期间到期的订单: ${timeRangeOrders?.length || 0} 个`);
        
        // 按到期时间分组统计
        const expiryStats = {};
        timeRangeOrders?.forEach(order => {
            const expiryDate = order.expiry_time?.split('T')[0] || 'unknown'; // 只取日期部分
            if (!expiryStats[expiryDate]) {
                expiryStats[expiryDate] = { total: 0, hasWechat: 0 };
            }
            expiryStats[expiryDate].total++;
            if (order.customer_wechat && order.customer_wechat.trim()) {
                expiryStats[expiryDate].hasWechat++;
            }
        });
        
        console.log('按到期日期统计：');
        Object.entries(expiryStats).sort().forEach(([date, stats]) => {
            console.log(`${date}: 总计${stats.total}个，有微信${stats.hasWechat}个`);
        });
    }
}

checkReminderData().catch(console.error);