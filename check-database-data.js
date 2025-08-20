const { createClient } = require('@supabase/supabase-js');

// 使用项目中的Supabase配置
const supabaseUrl = 'https://dwgynixoajmnulrrfvyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3Z3luaXhvYWptbnVscnJmdnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2NjUyMjQsImV4cCI6MjA0ODI0MTIyNH0.N1mJz8TgQqzw9Kzz1l0pYGjXKqxOFv6fV4F4p5aU3Yo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseData() {
    console.log('=== 数据库数据检查开始 ===\n');
    
    try {
        // 1. 检查 sales_optimized 表
        console.log('1. 检查 sales_optimized 表：');
        console.log('----------------------------------------');
        
        // 查询前10条记录
        const { data: salesData, error: salesError } = await supabase
            .from('sales_optimized')
            .select('*')
            .limit(10);
        
        if (salesError) {
            console.error('查询 sales_optimized 错误:', salesError);
        } else {
            console.log(`✓ 前10条记录数量: ${salesData.length}`);
            if (salesData.length > 0) {
                console.log('✓ 示例记录:');
                salesData.slice(0, 3).forEach((record, index) => {
                    console.log(`  记录${index + 1}:`);
                    console.log(`    - wechat_name: ${record.wechat_name || '空'}`);
                    console.log(`    - total_amount: ${record.total_amount}`);
                    console.log(`    - sales_type: ${record.sales_type || '空'}`);
                    console.log(`    - status: ${record.status || '空'}`);
                });
            }
        }
        
        // 统计总记录数
        const { count: salesCount, error: salesCountError } = await supabase
            .from('sales_optimized')
            .select('*', { count: 'exact', head: true });
        
        if (salesCountError) {
            console.error('统计 sales_optimized 记录数错误:', salesCountError);
        } else {
            console.log(`✓ 总记录数: ${salesCount}`);
        }
        
        // 检查关键字段是否有空值
        const { data: emptyWechatNames, error: emptyWechatError } = await supabase
            .from('sales_optimized')
            .select('wechat_name')
            .is('wechat_name', null);
        
        const { data: zeroAmounts, error: zeroAmountError } = await supabase
            .from('sales_optimized')
            .select('total_amount')
            .eq('total_amount', 0);
        
        if (!emptyWechatError && !zeroAmountError) {
            console.log(`✓ wechat_name 为空的记录数: ${emptyWechatNames?.length || 0}`);
            console.log(`✓ total_amount 为0的记录数: ${zeroAmounts?.length || 0}`);
        }
        
        console.log('\n2. 检查 orders_optimized 表：');
        console.log('----------------------------------------');
        
        // 统计订单总数
        const { count: ordersCount, error: ordersCountError } = await supabase
            .from('orders_optimized')
            .select('*', { count: 'exact', head: true });
        
        if (ordersCountError) {
            console.error('统计 orders_optimized 记录数错误:', ordersCountError);
        } else {
            console.log(`✓ 订单总数: ${ordersCount}`);
        }
        
        // 统计各种duration的订单数量
        const { data: durationStats, error: durationError } = await supabase
            .from('orders_optimized')
            .select('duration_text')
            .not('duration_text', 'is', null);
        
        if (durationError) {
            console.error('查询duration统计错误:', durationError);
        } else {
            const durationCounts = {};
            durationStats.forEach(order => {
                const duration = order.duration_text || '未知';
                durationCounts[duration] = (durationCounts[duration] || 0) + 1;
            });
            
            console.log('✓ Duration分布:');
            Object.entries(durationCounts).forEach(([duration, count]) => {
                console.log(`    - ${duration}: ${count}个订单`);
            });
        }
        
        // 检查 confirmed_config 状态的订单
        const { count: confirmedConfigCount, error: confirmedConfigError } = await supabase
            .from('orders_optimized')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'confirmed_config');
        
        if (confirmedConfigError) {
            console.error('查询 confirmed_config 状态错误:', confirmedConfigError);
        } else {
            console.log(`✓ confirmed_config 状态的订单数: ${confirmedConfigCount}`);
        }
        
        // 统计订单状态分布
        const { data: statusStats, error: statusError } = await supabase
            .from('orders_optimized')
            .select('status');
        
        if (statusError) {
            console.error('查询订单状态错误:', statusError);
        } else {
            const statusCounts = {};
            statusStats.forEach(order => {
                const status = order.status || '未知';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            
            console.log('✓ 订单状态分布:');
            Object.entries(statusCounts).forEach(([status, count]) => {
                console.log(`    - ${status}: ${count}个订单`);
            });
        }
        
        console.log('\n3. 数据完整性验证：');
        console.log('----------------------------------------');
        
        // 检查 sales_optimized 表的数据质量
        const { data: salesQuality, error: salesQualityError } = await supabase
            .from('sales_optimized')
            .select('wechat_name, total_amount, commission_rate, created_at')
            .limit(5);
        
        if (salesQualityError) {
            console.error('检查销售数据质量错误:', salesQualityError);
        } else {
            console.log('✓ 销售数据质量检查（前5条）:');
            salesQuality.forEach((record, index) => {
                const issues = [];
                if (!record.wechat_name) issues.push('缺少微信名');
                if (record.total_amount === 0) issues.push('销售额为0');
                if (!record.commission_rate) issues.push('缺少佣金率');
                
                console.log(`  记录${index + 1}: ${issues.length === 0 ? '✓ 数据完整' : '⚠ ' + issues.join(', ')}`);
            });
        }
        
        // 检查最近的订单
        const { data: recentOrders, error: recentOrdersError } = await supabase
            .from('orders_optimized')
            .select('order_id, wechat_name, amount, duration_text, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (recentOrdersError) {
            console.error('查询最近订单错误:', recentOrdersError);
        } else {
            console.log('✓ 最近5个订单:');
            recentOrders.forEach((order, index) => {
                console.log(`  订单${index + 1}: ${order.order_id} | ${order.wechat_name} | ${order.amount}元 | ${order.duration_text} | ${order.status}`);
            });
        }
        
    } catch (error) {
        console.error('检查过程中出错:', error);
    }
    
    console.log('\n=== 数据库数据检查完成 ===');
}

checkDatabaseData();