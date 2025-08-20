const { createClient } = require('@supabase/supabase-js');

// 使用项目中正确的Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseData() {
    console.log('=== 数据库实际情况检查 ===\n');
    
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
            console.error('❌ 查询 sales_optimized 错误:', salesError);
        } else {
            console.log(`✅ 查询成功，前10条记录数量: ${salesData.length}`);
            if (salesData.length > 0) {
                console.log('✅ 示例记录:');
                salesData.slice(0, 3).forEach((record, index) => {
                    console.log(`  记录${index + 1}:`);
                    console.log(`    - wechat_name: "${record.wechat_name || '空'}"`);
                    console.log(`    - total_amount: ${record.total_amount}`);
                    console.log(`    - sales_type: "${record.sales_type || '空'}"`);
                    console.log(`    - status: "${record.status || '空'}"`);
                    console.log(`    - commission_rate: ${record.commission_rate}`);
                    console.log(`    - created_at: ${record.created_at}`);
                });
            } else {
                console.log('⚠️  表中没有数据');
            }
        }
        
        // 统计总记录数
        const { count: salesCount, error: salesCountError } = await supabase
            .from('sales_optimized')
            .select('*', { count: 'exact', head: true });
        
        if (salesCountError) {
            console.error('❌ 统计 sales_optimized 记录数错误:', salesCountError);
        } else {
            console.log(`✅ 总记录数: ${salesCount}`);
        }
        
        // 检查关键字段统计
        if (!salesError && salesData.length > 0) {
            // 统计 wechat_name 为空的记录数
            const { count: emptyWechatCount, error: emptyWechatError } = await supabase
                .from('sales_optimized')
                .select('*', { count: 'exact', head: true })
                .or('wechat_name.is.null,wechat_name.eq.');
            
            // 统计 total_amount 为0的记录数
            const { count: zeroAmountCount, error: zeroAmountError } = await supabase
                .from('sales_optimized')
                .select('*', { count: 'exact', head: true })
                .eq('total_amount', 0);
            
            if (!emptyWechatError) {
                console.log(`✅ wechat_name 为空的记录数: ${emptyWechatCount || 0}`);
            }
            if (!zeroAmountError) {
                console.log(`✅ total_amount 为0的记录数: ${zeroAmountCount || 0}`);
            }
        }
        
        console.log('\n2. 检查 orders_optimized 表：');
        console.log('----------------------------------------');
        
        // 统计订单总数
        const { count: ordersCount, error: ordersCountError } = await supabase
            .from('orders_optimized')
            .select('*', { count: 'exact', head: true });
        
        if (ordersCountError) {
            console.error('❌ 统计 orders_optimized 记录数错误:', ordersCountError);
        } else {
            console.log(`✅ 订单总数: ${ordersCount}`);
        }
        
        // 查询示例订单记录
        const { data: sampleOrders, error: sampleOrdersError } = await supabase
            .from('orders_optimized')
            .select('order_id, wechat_name, amount, duration_text, status, created_at')
            .limit(5);
        
        if (sampleOrdersError) {
            console.error('❌ 查询示例订单错误:', sampleOrdersError);
        } else {
            console.log('✅ 示例订单:');
            sampleOrders.forEach((order, index) => {
                console.log(`  订单${index + 1}:`);
                console.log(`    - order_id: ${order.order_id}`);
                console.log(`    - wechat_name: ${order.wechat_name}`);
                console.log(`    - amount: ${order.amount}`);
                console.log(`    - duration_text: ${order.duration_text}`);
                console.log(`    - status: ${order.status}`);
            });
        }
        
        // 统计各种duration的订单数量
        const { data: allOrders, error: allOrdersError } = await supabase
            .from('orders_optimized')
            .select('duration_text');
        
        if (allOrdersError) {
            console.error('❌ 查询duration统计错误:', allOrdersError);
        } else {
            const durationCounts = {};
            allOrders.forEach(order => {
                const duration = order.duration_text || '未知/空';
                durationCounts[duration] = (durationCounts[duration] || 0) + 1;
            });
            
            console.log('✅ Duration分布:');
            Object.entries(durationCounts).forEach(([duration, count]) => {
                console.log(`    - "${duration}": ${count}个订单`);
            });
        }
        
        // 检查 confirmed_config 状态的订单
        const { count: confirmedConfigCount, error: confirmedConfigError } = await supabase
            .from('orders_optimized')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'confirmed_config');
        
        if (confirmedConfigError) {
            console.error('❌ 查询 confirmed_config 状态错误:', confirmedConfigError);
        } else {
            console.log(`✅ confirmed_config 状态的订单数: ${confirmedConfigCount}`);
        }
        
        // 统计订单状态分布
        const { data: statusData, error: statusError } = await supabase
            .from('orders_optimized')
            .select('status');
        
        if (statusError) {
            console.error('❌ 查询订单状态错误:', statusError);
        } else {
            const statusCounts = {};
            statusData.forEach(order => {
                const status = order.status || '未知/空';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            
            console.log('✅ 订单状态分布:');
            Object.entries(statusCounts).forEach(([status, count]) => {
                console.log(`    - "${status}": ${count}个订单`);
            });
        }
        
        console.log('\n3. 数据完整性验证：');
        console.log('----------------------------------------');
        
        // 检查 sales_optimized 表的数据质量
        const { data: salesQuality, error: salesQualityError } = await supabase
            .from('sales_optimized')
            .select('wechat_name, total_amount, commission_rate, created_at, sales_type')
            .limit(10);
        
        if (salesQualityError) {
            console.error('❌ 检查销售数据质量错误:', salesQualityError);
        } else {
            console.log('✅ 销售数据质量检查（前10条）:');
            salesQuality.forEach((record, index) => {
                const issues = [];
                if (!record.wechat_name || record.wechat_name.trim() === '') {
                    issues.push('缺少微信名');
                }
                if (record.total_amount === 0 || record.total_amount === null) {
                    issues.push('销售额为0或空');
                }
                if (!record.commission_rate && record.commission_rate !== 0) {
                    issues.push('缺少佣金率');
                }
                if (!record.sales_type) {
                    issues.push('缺少销售类型');
                }
                
                const statusIcon = issues.length === 0 ? '✅' : '⚠️ ';
                const statusText = issues.length === 0 ? '数据完整' : issues.join(', ');
                console.log(`  记录${index + 1}: ${statusIcon} ${statusText}`);
                if (issues.length > 0) {
                    console.log(`    详情: wechat_name="${record.wechat_name}", total_amount=${record.total_amount}, commission_rate=${record.commission_rate}, sales_type="${record.sales_type}"`);
                }
            });
        }
        
        // 检查最近的订单
        const { data: recentOrders, error: recentOrdersError } = await supabase
            .from('orders_optimized')
            .select('order_id, wechat_name, amount, duration_text, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (recentOrdersError) {
            console.error('❌ 查询最近订单错误:', recentOrdersError);
        } else {
            console.log('✅ 最近5个订单:');
            recentOrders.forEach((order, index) => {
                console.log(`  订单${index + 1}: ${order.order_id} | ${order.wechat_name} | ${order.amount}元 | ${order.duration_text} | ${order.status}`);
            });
        }
        
        console.log('\n4. 表结构检查：');
        console.log('----------------------------------------');
        
        // 检查销售表字段
        if (salesData && salesData.length > 0) {
            const sampleRecord = salesData[0];
            console.log('✅ sales_optimized 表主要字段:');
            Object.keys(sampleRecord).forEach(field => {
                console.log(`    - ${field}: ${typeof sampleRecord[field]} (示例值: ${JSON.stringify(sampleRecord[field])})`);
            });
        }
        
        // 检查订单表字段
        if (sampleOrders && sampleOrders.length > 0) {
            const sampleOrder = sampleOrders[0];
            console.log('\n✅ orders_optimized 表主要字段:');
            Object.keys(sampleOrder).forEach(field => {
                console.log(`    - ${field}: ${typeof sampleOrder[field]} (示例值: ${JSON.stringify(sampleOrder[field])})`);
            });
        }
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error);
    }
    
    console.log('\n=== 数据库检查完成 ===');
}

// 导入必要的模块并运行
async function main() {
    try {
        await checkDatabaseData();
    } catch (error) {
        console.error('❌ 脚本执行失败:', error);
        process.exit(1);
    }
}

main();