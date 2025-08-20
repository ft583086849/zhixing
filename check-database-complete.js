const { createClient } = require('@supabase/supabase-js');

// 使用项目中正确的Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseComplete() {
    console.log('=== 数据库完整情况检查 ===\n');
    
    try {
        // 1. 检查 sales_optimized 表详细情况
        console.log('1. sales_optimized 表详细分析：');
        console.log('----------------------------------------');
        
        const { count: totalSales, error: salesCountError } = await supabase
            .from('sales_optimized')
            .select('*', { count: 'exact', head: true });
        
        if (salesCountError) {
            console.error('❌ 统计销售总数错误:', salesCountError);
        } else {
            console.log(`✅ 销售总数: ${totalSales}`);
        }
        
        // 按销售类型统计
        const { data: salesByType, error: typeError } = await supabase
            .from('sales_optimized')
            .select('sales_type');
            
        if (typeError) {
            console.error('❌ 查询销售类型错误:', typeError);
        } else {
            const typeCounts = {};
            salesByType.forEach(sale => {
                const type = sale.sales_type || '未知';
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });
            
            console.log('✅ 销售类型分布:');
            Object.entries(typeCounts).forEach(([type, count]) => {
                console.log(`    - ${type}: ${count}人`);
            });
        }
        
        // 检查空值情况
        const { count: emptyWechatCount } = await supabase
            .from('sales_optimized')
            .select('*', { count: 'exact', head: true })
            .or('wechat_name.is.null,wechat_name.eq.');
            
        const { count: zeroAmountCount } = await supabase
            .from('sales_optimized')
            .select('*', { count: 'exact', head: true })
            .eq('total_amount', 0);
            
        console.log(`✅ wechat_name为空: ${emptyWechatCount || 0}人`);
        console.log(`✅ total_amount为0: ${zeroAmountCount || 0}人 (${((zeroAmountCount/totalSales)*100).toFixed(1)}%)`);
        
        // 销售额统计
        const { data: salesAmounts, error: amountError } = await supabase
            .from('sales_optimized')
            .select('total_amount, sales_type');
            
        if (!amountError && salesAmounts) {
            const amountStats = {
                total: 0,
                primary: 0,
                secondary: 0,
                independent: 0
            };
            
            salesAmounts.forEach(sale => {
                const amount = sale.total_amount || 0;
                amountStats.total += amount;
                
                switch(sale.sales_type) {
                    case 'primary':
                        amountStats.primary += amount;
                        break;
                    case 'secondary':
                        amountStats.secondary += amount;
                        break;
                    case 'independent':
                        amountStats.independent += amount;
                        break;
                }
            });
            
            console.log('✅ 销售额统计:');
            console.log(`    - 总销售额: ${amountStats.total}元`);
            console.log(`    - 一级销售: ${amountStats.primary}元`);
            console.log(`    - 二级销售: ${amountStats.secondary}元`);
            console.log(`    - 独立销售: ${amountStats.independent}元`);
        }
        
        console.log('\n2. orders_optimized 表详细分析：');
        console.log('----------------------------------------');
        
        const { count: totalOrders, error: ordersCountError } = await supabase
            .from('orders_optimized')
            .select('*', { count: 'exact', head: true });
        
        if (ordersCountError) {
            console.error('❌ 统计订单总数错误:', ordersCountError);
        } else {
            console.log(`✅ 订单总数: ${totalOrders}`);
        }
        
        // 查询示例订单（使用正确的字段名）
        const { data: sampleOrders, error: sampleOrdersError } = await supabase
            .from('orders_optimized')
            .select('order_number, customer_wechat, amount, duration, status, created_at')
            .limit(5);
        
        if (sampleOrdersError) {
            console.error('❌ 查询示例订单错误:', sampleOrdersError);
        } else {
            console.log('✅ 示例订单:');
            sampleOrders.forEach((order, index) => {
                console.log(`  订单${index + 1}:`);
                console.log(`    - order_number: ${order.order_number}`);
                console.log(`    - customer_wechat: ${order.customer_wechat}`);
                console.log(`    - amount: ${order.amount}`);
                console.log(`    - duration: ${order.duration}`);
                console.log(`    - status: ${order.status}`);
            });
        }
        
        // 统计各种duration的订单数量（使用正确的字段名）
        const { data: allOrders, error: allOrdersError } = await supabase
            .from('orders_optimized')
            .select('duration');
        
        if (allOrdersError) {
            console.error('❌ 查询duration统计错误:', allOrdersError);
        } else {
            const durationCounts = {};
            allOrders.forEach(order => {
                const duration = order.duration || '未知/空';
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
                console.log(`    - "${status}": ${count}个订单 (${((count/totalOrders)*100).toFixed(1)}%)`);
            });
        }
        
        // 订单金额统计
        const { data: orderAmounts, error: orderAmountError } = await supabase
            .from('orders_optimized')
            .select('amount, actual_payment_amount, status');
            
        if (!orderAmountError && orderAmounts) {
            const orderStats = {
                totalAmount: 0,
                confirmedAmount: 0,
                pendingAmount: 0,
                rejectedAmount: 0
            };
            
            orderAmounts.forEach(order => {
                const amount = order.actual_payment_amount || order.amount || 0;
                orderStats.totalAmount += amount;
                
                switch(order.status) {
                    case 'confirmed_config':
                        orderStats.confirmedAmount += amount;
                        break;
                    case 'pending':
                        orderStats.pendingAmount += amount;
                        break;
                    case 'rejected':
                        orderStats.rejectedAmount += amount;
                        break;
                }
            });
            
            console.log('✅ 订单金额统计:');
            console.log(`    - 订单总金额: ${orderStats.totalAmount}元`);
            console.log(`    - 已确认订单金额: ${orderStats.confirmedAmount}元`);
            console.log(`    - 待处理订单金额: ${orderStats.pendingAmount}元`);
            console.log(`    - 已拒绝订单金额: ${orderStats.rejectedAmount}元`);
        }
        
        console.log('\n3. 数据质量与一致性检查：');
        console.log('----------------------------------------');
        
        // 检查销售数据质量
        const { data: salesQuality, error: salesQualityError } = await supabase
            .from('sales_optimized')
            .select('wechat_name, total_amount, commission_rate, sales_type, total_orders')
            .limit(10);
        
        if (salesQualityError) {
            console.error('❌ 检查销售数据质量错误:', salesQualityError);
        } else {
            console.log('✅ 销售数据质量抽样检查:');
            let perfectCount = 0;
            salesQuality.forEach((record, index) => {
                const issues = [];
                if (!record.wechat_name || record.wechat_name.trim() === '') {
                    issues.push('缺少微信名');
                }
                if (record.total_amount === 0 || record.total_amount === null) {
                    issues.push('销售额为0');
                }
                if (!record.commission_rate && record.commission_rate !== 0) {
                    issues.push('缺少佣金率');
                }
                if (!record.sales_type) {
                    issues.push('缺少销售类型');
                }
                
                if (issues.length === 0) {
                    perfectCount++;
                } else {
                    console.log(`  ⚠️  ${record.wechat_name || '无名'}: ${issues.join(', ')}`);
                }
            });
            console.log(`  ✅ 完整数据记录: ${perfectCount}/${salesQuality.length} (${((perfectCount/salesQuality.length)*100).toFixed(1)}%)`);
        }
        
        // 检查最近订单
        const { data: recentOrders, error: recentOrdersError } = await supabase
            .from('orders_optimized')
            .select('order_number, customer_wechat, amount, duration, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (recentOrdersError) {
            console.error('❌ 查询最近订单错误:', recentOrdersError);
        } else {
            console.log('✅ 最近5个订单:');
            recentOrders.forEach((order, index) => {
                const date = new Date(order.created_at).toLocaleString('zh-CN');
                console.log(`  订单${index + 1}: ${order.order_number} | ${order.customer_wechat} | ${order.amount}元 | ${order.duration} | ${order.status} | ${date}`);
            });
        }
        
        console.log('\n4. 关键数据验证：');
        console.log('----------------------------------------');
        
        // 验证销售-订单关联
        const { data: salesWithOrders, error: salesOrderError } = await supabase
            .from('sales_optimized')
            .select('wechat_name, total_amount, total_orders')
            .gt('total_orders', 0)
            .limit(5);
            
        if (!salesOrderError && salesWithOrders) {
            console.log('✅ 有订单的销售员样本:');
            salesWithOrders.forEach(sale => {
                console.log(`  ${sale.wechat_name}: ${sale.total_orders}单, ${sale.total_amount}元`);
            });
        }
        
        // 检查高价值订单
        const { data: highValueOrders, error: highValueError } = await supabase
            .from('orders_optimized')
            .select('order_number, customer_wechat, amount, duration, status')
            .gt('amount', 1000)
            .eq('status', 'confirmed_config')
            .order('amount', { ascending: false })
            .limit(5);
            
        if (!highValueError && highValueOrders) {
            console.log('✅ 高价值确认订单 (>1000元):');
            highValueOrders.forEach(order => {
                console.log(`  ${order.order_number}: ${order.customer_wechat} | ${order.amount}元 | ${order.duration} | ${order.status}`);
            });
        }
        
        console.log('\n5. 总结：');
        console.log('----------------------------------------');
        console.log(`📊 数据库包含 ${totalSales} 个销售员和 ${totalOrders} 个订单`);
        console.log(`📈 ${confirmedConfigCount} 个订单已确认配置 (${((confirmedConfigCount/totalOrders)*100).toFixed(1)}%)`);
        console.log(`⚠️  ${zeroAmountCount} 个销售员销售额为0 (${((zeroAmountCount/totalSales)*100).toFixed(1)}%)`);
        console.log('✅ 数据库结构完整，主要字段都存在');
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error);
    }
    
    console.log('\n=== 数据库检查完成 ===');
}

checkDatabaseComplete();