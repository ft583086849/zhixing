const { createClient } = require('@supabase/supabase-js');

// 使用项目的Supabase配置（从supabase.js复制）
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPrimarySalesAPI() {
    console.log('🔍 调试一级销售对账API...');
    
    const testSalesCode = 'PRI17547241780648255';
    
    try {
        // 1. 首先检查sales_optimized表中是否有这个销售代码
        console.log('\n1️⃣ 检查销售代码在sales_optimized表中的情况:');
        const { data: salesData, error: salesError } = await supabase
            .from('sales_optimized')
            .select('*')
            .eq('sales_code', testSalesCode);
        
        if (salesError) {
            console.log('❌ 销售查询错误:', salesError);
        } else {
            console.log(`✅ 找到销售记录 ${salesData.length} 条:`, salesData);
        }
        
        // 2. 检查orders_optimized表中对应的订单
        console.log('\n2️⃣ 检查orders_optimized表中的订单:');
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders_optimized')
            .select('*')
            .or(`sales_code.eq.${testSalesCode},primary_sales_code.eq.${testSalesCode}`)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (ordersError) {
            console.log('❌ 订单查询错误:', ordersError);
        } else {
            console.log(`✅ 找到订单记录 ${ordersData.length} 条:`);
            ordersData.forEach((order, index) => {
                console.log(`订单 ${index + 1}:`, {
                    order_id: order.order_id,
                    sales_code: order.sales_code,
                    primary_sales_code: order.primary_sales_code,
                    status: order.status,
                    amount: order.amount,
                    commission: order.commission,
                    primary_commission: order.primary_commission,
                    created_at: order.created_at
                });
            });
        }
        
        // 3. 模拟前端API调用 - 获取一级销售统计
        console.log('\n3️⃣ 模拟获取一级销售统计:');
        
        // 基础统计
        const { data: statsData, error: statsError } = await supabase
            .from('orders_optimized')
            .select(`
                amount,
                primary_commission,
                status,
                created_at
            `)
            .eq('primary_sales_code', testSalesCode);
            
        if (statsError) {
            console.log('❌ 统计查询错误:', statsError);
        } else {
            console.log(`✅ 统计数据 ${statsData.length} 条记录`);
            
            // 计算统计信息
            const totalOrders = statsData.length;
            const totalAmount = statsData.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
            const totalCommission = statsData.reduce((sum, order) => sum + parseFloat(order.primary_commission || 0), 0);
            
            // 今日数据
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = statsData.filter(order => order.created_at?.startsWith(today));
            const todayAmount = todayOrders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
            const todayCommission = todayOrders.reduce((sum, order) => sum + parseFloat(order.primary_commission || 0), 0);
            
            // 已支付订单
            const paidOrders = statsData.filter(order => order.status === 'paid');
            const paidAmount = paidOrders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
            const paidCommission = paidOrders.reduce((sum, order) => sum + parseFloat(order.primary_commission || 0), 0);
            
            console.log('📊 统计结果:');
            console.log(`总订单数: ${totalOrders}`);
            console.log(`总金额: $${totalAmount.toFixed(2)}`);
            console.log(`总佣金: $${totalCommission.toFixed(2)}`);
            console.log(`今日订单: ${todayOrders.length}`);
            console.log(`今日金额: $${todayAmount.toFixed(2)}`);
            console.log(`今日佣金: $${todayCommission.toFixed(2)}`);
            console.log(`已支付订单: ${paidOrders.length}`);
            console.log(`已支付金额: $${paidAmount.toFixed(2)}`);
            console.log(`已支付佣金: $${paidCommission.toFixed(2)}`);
        }
        
        // 4. 检查微信号对应关系
        console.log('\n4️⃣ 检查微信号对应关系:');
        if (salesData && salesData.length > 0) {
            const wechat = salesData[0].wechat_id;
            console.log(`销售代码 ${testSalesCode} 对应微信号: ${wechat}`);
            
            if (wechat === 'WML792355703') {
                console.log('✅ 微信号匹配正确!');
            } else {
                console.log('❌ 微信号不匹配，期望: WML792355703，实际:', wechat);
            }
        }
        
        // 5. 检查API权限
        console.log('\n5️⃣ 检查数据库权限:');
        const { data: testData, error: testError } = await supabase
            .from('sales_optimized')
            .select('count(*)')
            .limit(1);
            
        if (testError) {
            console.log('❌ 权限测试失败:', testError);
        } else {
            console.log('✅ 数据库连接和权限正常');
        }
        
        console.log('\n🎯 调试完成!');
        
    } catch (error) {
        console.error('❌ 调试过程中发生错误:', error);
    }
}

debugPrimarySalesAPI();