// 测试通过微信号查询
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWechatQuery() {
    console.log('🧪 测试通过微信号查询...');
    
    try {
        // 1. 通过微信号查询销售员
        console.log('\n1️⃣ 通过微信号查询销售员:');
        const wechatName = 'WML792355703';
        
        const { data: primarySale, error: salesError } = await supabase
            .from('sales_optimized')
            .select('*')
            .eq('sales_type', 'primary')
            .eq('wechat_name', wechatName)
            .single();
        
        if (salesError) {
            console.error('❌ 查询失败:', salesError);
            return;
        }
        
        console.log('✅ 找到销售员:', {
            sales_code: primarySale.sales_code,
            wechat_name: primarySale.wechat_name
        });
        
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
        
        // 3. 查询订单
        console.log('\n3️⃣ 查询相关订单:');
        const { data: orders, error: ordersError } = await supabase
            .from('orders_optimized')
            .select('*')
            .eq('primary_sales_id', primarySalesId)
            .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'])
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (ordersError) {
            console.log('❌ 订单查询失败:', ordersError);
            return;
        }
        
        console.log(`✅ 找到 ${orders.length} 条订单`);
        orders.forEach((order, i) => {
            console.log(`订单 ${i+1}: ${order.order_number}, 金额: $${order.amount}, 佣金: $${order.primary_commission_amount}`);
        });
        
        // 4. 模拟完整API响应
        const totalOrders = orders.length;
        const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
        const totalCommission = orders.reduce((sum, order) => sum + parseFloat(order.primary_commission_amount || 0), 0);
        
        const mockAPIResponse = {
            sales: {
                id: primarySale.id,
                wechat_name: primarySale.wechat_name,
                sales_code: primarySale.sales_code,
                commission_rate: primarySale.commission_rate,
                payment_account: primarySale.payment_account,
                payment_method: primarySale.payment_method
            },
            orders: orders,
            secondarySales: [],
            reminderOrders: [],
            stats: {
                totalOrders: totalOrders,
                totalAmount: totalAmount,
                totalCommission: totalCommission,
                monthOrders: 0,
                monthAmount: 0,
                monthCommission: 0,
                todayOrders: 0,
                todayAmount: 0,
                todayCommission: 0
            }
        };
        
        console.log('\n🎯 模拟API响应验证:');
        console.log(`response 存在: ${!!mockAPIResponse}`);
        console.log(`response.sales 存在: ${!!mockAPIResponse.sales}`);
        console.log(`微信号: ${mockAPIResponse.sales.wechat_name}`);
        console.log(`订单数量: ${mockAPIResponse.orders.length}`);
        console.log(`统计总订单: ${mockAPIResponse.stats.totalOrders}`);
        console.log(`总金额: $${mockAPIResponse.stats.totalAmount}`);
        console.log(`总佣金: $${mockAPIResponse.stats.totalCommission}`);
        
        if (!mockAPIResponse || !mockAPIResponse.sales) {
            console.log('❌ 前端会显示：未找到匹配的一级销售数据');
        } else {
            console.log('✅ 前端应该正常显示数据，不再显示"请先查询一级销售信息"');
        }
        
        return mockAPIResponse;
        
    } catch (error) {
        console.error('❌ 测试过程出错:', error);
    }
}

testWechatQuery();