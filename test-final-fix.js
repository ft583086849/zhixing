const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalFix() {
    console.log('🎯 测试最终修复后的API逻辑...');
    
    const testSalesCode = 'PRI17547241780648255';
    
    try {
        console.log(`\n测试销售代码: ${testSalesCode}`);
        console.log('期望微信号: WML792355703');
        
        // 1. 查询销售员信息
        console.log('\n1️⃣ 查询销售员信息:');
        const { data: primarySale, error: salesError } = await supabase
            .from('sales_optimized')
            .select('*')
            .eq('sales_type', 'primary')
            .eq('sales_code', testSalesCode)
            .single();
        
        if (salesError) {
            console.log('❌ 销售查询失败:', salesError);
            return;
        }
        
        console.log('✅ 销售员信息:');
        console.log(`  销售代码: ${primarySale.sales_code}`);
        console.log(`  微信号: ${primarySale.wechat_name}`);
        console.log(`  表中统计 - 订单: ${primarySale.total_orders}, 金额: $${primarySale.total_amount}, 佣金: $${primarySale.total_commission}`);
        
        // 2. 获取primary_sales_id
        console.log('\n2️⃣ 获取primary_sales_id:');
        const { data: sampleOrder } = await supabase
            .from('orders_optimized')
            .select('primary_sales_id')
            .eq('sales_code', primarySale.sales_code)
            .not('primary_sales_id', 'is', null)
            .limit(1);
        
        if (!sampleOrder || sampleOrder.length === 0) {
            console.log('❌ 未找到primary_sales_id');
            return;
        }
        
        const primarySalesId = sampleOrder[0].primary_sales_id;
        console.log(`✅ primary_sales_id: ${primarySalesId}`);
        
        // 3. 通过primary_sales_id查询所有相关订单
        console.log('\n3️⃣ 查询所有相关订单:');
        const { data: orders, error: ordersError } = await supabase
            .from('orders_optimized')
            .select('*')
            .eq('primary_sales_id', primarySalesId)
            .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'])
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (ordersError) {
            console.log('❌ 订单查询失败:', ordersError);
            return;
        }
        
        console.log(`✅ 找到 ${orders.length} 条相关订单:`);
        
        // 显示前5条订单
        orders.slice(0, 5).forEach((order, i) => {
            console.log(`订单 ${i+1}:`, {
                order_number: order.order_number,
                sales_code: order.sales_code,
                amount: order.amount,
                primary_commission: order.primary_commission_amount,
                status: order.status,
                created_at: order.created_at?.substring(0, 10)
            });
        });
        
        // 4. 计算实时统计
        console.log('\n4️⃣ 计算实时统计:');
        const totalOrders = orders.length;
        const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
        const totalCommission = orders.reduce((sum, order) => sum + parseFloat(order.primary_commission_amount || 0), 0);
        
        // 今日订单
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(order => order.created_at?.startsWith(today));
        const todayAmount = todayOrders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
        const todayCommission = todayOrders.reduce((sum, order) => sum + parseFloat(order.primary_commission_amount || 0), 0);
        
        console.log('📊 实时查询统计:');
        console.log(`  订单数: ${totalOrders}`);
        console.log(`  总金额: $${totalAmount.toFixed(2)}`);
        console.log(`  总佣金: $${totalCommission.toFixed(2)}`);
        console.log(`  今日订单: ${todayOrders.length}`);
        console.log(`  今日金额: $${todayAmount.toFixed(2)}`);
        console.log(`  今日佣金: $${todayCommission.toFixed(2)}`);
        
        // 5. 验证结果
        console.log('\n5️⃣ 验证修复结果:');
        
        const checks = [
            { name: '微信号正确显示', pass: primarySale.wechat_name === 'WML792355703' },
            { name: '找到相关订单', pass: orders.length > 0 },
            { name: '统计数据不为0', pass: totalAmount > 0 || totalCommission > 0 },
            { name: 'primary_sales_id映射正确', pass: primarySalesId === 4 }
        ];
        
        checks.forEach(check => {
            console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
        });
        
        const allPassed = checks.every(check => check.pass);
        
        console.log(`\n🎯 修复结果: ${allPassed ? '✅ 全部通过！' : '❌ 仍有问题'}`);
        
        if (allPassed) {
            console.log('\n🎉 修复成功！现在一级销售对账页面应该能正常显示数据了！');
            console.log('\n预期效果:');
            console.log('- 微信号显示：WML792355703');
            console.log(`- 总订单数：${totalOrders}`);
            console.log(`- 总金额：$${totalAmount.toFixed(2)}`);
            console.log(`- 总佣金：$${totalCommission.toFixed(2)}`);
            console.log('- 不再显示全0数据');
        }
        
    } catch (error) {
        console.error('❌ 测试过程出错:', error);
    }
}

testFinalFix();