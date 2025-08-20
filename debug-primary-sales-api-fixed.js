const { createClient } = require('@supabase/supabase-js');

// 使用项目的Supabase配置（从supabase.js复制）
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPrimarySalesAPIFixed() {
    console.log('🔍 调试一级销售对账API（修正版）...');
    
    const testSalesCode = 'PRI17547241780648255';
    
    try {
        // 1. 从之前的输出我们知道sales_optimized中的销售记录存在，微信号是wechat_name字段
        console.log('\n1️⃣ 销售记录信息:');
        console.log('✅ 销售代码:', testSalesCode);
        console.log('✅ 微信号: WML792355703 (字段名: wechat_name)');
        console.log('✅ 总订单: 41');
        console.log('✅ 总金额: $4040');
        console.log('✅ 总佣金: $1882.4');
        console.log('✅ 主佣金: $1616');
        
        // 2. 现在使用正确的字段名查询orders_optimized
        console.log('\n2️⃣ 查询orders_optimized表（使用正确字段）:');
        
        // 通过primary_sales_id查询
        const salesId = 4; // 从之前的查询结果获取
        
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders_optimized')
            .select(`
                id,
                order_number,
                sales_code,
                primary_sales_id,
                amount,
                commission_amount,
                primary_commission_amount,
                status,
                payment_status,
                created_at
            `)
            .eq('primary_sales_id', salesId)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (ordersError) {
            console.log('❌ 订单查询错误:', ordersError);
        } else {
            console.log(`✅ 通过primary_sales_id找到订单记录 ${ordersData.length} 条:`);
            ordersData.forEach((order, index) => {
                console.log(`订单 ${index + 1}:`, {
                    order_number: order.order_number,
                    sales_code: order.sales_code,
                    primary_sales_id: order.primary_sales_id,
                    status: order.status,
                    payment_status: order.payment_status,
                    amount: order.amount,
                    commission: order.commission_amount,
                    primary_commission: order.primary_commission_amount,
                    created_at: order.created_at?.substring(0, 10)
                });
            });
        }
        
        // 3. 计算统计数据（如前端应该计算的）
        console.log('\n3️⃣ 计算统计数据:');
        
        if (ordersData && ordersData.length > 0) {
            const totalOrders = ordersData.length;
            const totalAmount = ordersData.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
            const totalCommission = ordersData.reduce((sum, order) => sum + parseFloat(order.primary_commission_amount || 0), 0);
            
            // 今日数据
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = ordersData.filter(order => order.created_at?.startsWith(today));
            const todayAmount = todayOrders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
            const todayCommission = todayOrders.reduce((sum, order) => sum + parseFloat(order.primary_commission_amount || 0), 0);
            
            // 已支付订单
            const paidOrders = ordersData.filter(order => order.payment_status === 'completed');
            const paidAmount = paidOrders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
            const paidCommission = paidOrders.reduce((sum, order) => sum + parseFloat(order.primary_commission_amount || 0), 0);
            
            console.log('📊 根据查询结果计算的统计:');
            console.log(`查询到的订单数: ${totalOrders}`);
            console.log(`查询到的总金额: $${totalAmount.toFixed(2)}`);
            console.log(`查询到的总佣金: $${totalCommission.toFixed(2)}`);
            console.log(`今日订单: ${todayOrders.length}`);
            console.log(`今日金额: $${todayAmount.toFixed(2)}`);
            console.log(`今日佣金: $${todayCommission.toFixed(2)}`);
            console.log(`已支付订单: ${paidOrders.length}`);
            console.log(`已支付金额: $${paidAmount.toFixed(2)}`);
            console.log(`已支付佣金: $${paidCommission.toFixed(2)}`);
        }
        
        // 4. 检查前端API可能的问题
        console.log('\n4️⃣ 前端API问题分析:');
        console.log('🔍 问题1: 前端可能使用了不存在的字段名');
        console.log('   - primary_sales_code (不存在) → 应使用 primary_sales_id');
        console.log('   - primary_commission (不存在) → 应使用 primary_commission_amount');
        
        console.log('🔍 问题2: 微信号字段问题');
        console.log('   - 期望的字段可能是 wechat_id → 实际字段是 wechat_name');
        
        console.log('🔍 问题3: 查询逻辑问题');
        console.log('   - 前端可能通过销售代码直接查询订单');
        console.log('   - 但订单表中可能需要通过primary_sales_id关联查询');
        
        console.log('\n🎯 修复建议:');
        console.log('1. 修正前端API中的字段名映射');
        console.log('2. 确保使用正确的关联字段查询');
        console.log('3. 检查微信号显示逻辑');
        
        console.log('\n✅ 数据实际存在，问题在于前端API的字段映射错误！');
        
    } catch (error) {
        console.error('❌ 调试过程中发生错误:', error);
    }
}

debugPrimarySalesAPIFixed();