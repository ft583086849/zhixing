// 模拟前端API调用测试
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 复制修复后的 getPrimarySalesSettlement 函数
class SupabaseService {
  static supabase = supabase;
  
  static async getPrimarySalesSettlement(params) {
    try {
      console.log('📍 开始查询一级销售结算数据，参数:', params);
      
      // 1. 从 sales_optimized 表获取销售员数据
      let salesQuery = supabase
        .from('sales_optimized')
        .select('*')
        .eq('sales_type', 'primary');
      
      if (params.wechat_name) {
        salesQuery = salesQuery.eq('wechat_name', params.wechat_name);
      }
      if (params.sales_code) {
        salesQuery = salesQuery.eq('sales_code', params.sales_code);
      }
      
      const { data: primarySale, error: salesError } = await salesQuery.single();
      
      if (salesError) {
        console.error('❌ 查询一级销售失败:', salesError);
        throw new Error('未找到匹配的一级销售');
      }
      
      console.log('✅ 找到销售员:', {
        sales_code: primarySale.sales_code,
        wechat_name: primarySale.wechat_name
      });
      
      const primaryStats = { ...primarySale };
      
      // 3. 获取订单列表（通过sales_code获取primary_sales_id，然后查询所有相关订单）
      const { data: sampleOrder } = await supabase
        .from('orders_optimized')
        .select('primary_sales_id')
        .eq('sales_code', primaryStats.sales_code)
        .not('primary_sales_id', 'is', null)
        .limit(1);
      
      let orders = [];
      let ordersError = null;
      
      if (sampleOrder && sampleOrder.length > 0) {
        const primarySalesId = sampleOrder[0].primary_sales_id;
        console.log('✅ 找到primary_sales_id:', primarySalesId);
        
        const { data: ordersData, error: queryError } = await supabase
          .from('orders_optimized')
          .select('*')
          .eq('primary_sales_id', primarySalesId)
          .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'])
          .order('created_at', { ascending: false })
          .limit(20); // 限制返回数量以便测试
        
        orders = ordersData || [];
        ordersError = queryError;
        console.log(`✅ 查询到 ${orders.length} 条订单`);
      } else {
        console.log('⚠️ 未找到primary_sales_id，回退到直接查询');
        const { data: ordersData, error: queryError } = await supabase
          .from('orders_optimized')
          .select('*')
          .eq('sales_code', primaryStats.sales_code)
          .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'])
          .order('created_at', { ascending: false })
          .limit(20);
        
        orders = ordersData || [];
        ordersError = queryError;
        console.log(`✅ 直接查询到 ${orders.length} 条订单`);
      }
      
      if (ordersError) {
        console.error('❌ 查询订单失败:', ordersError);
      }
      
      // 计算统计数据
      const totalOrders = orders.length;
      const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
      const totalCommission = orders.reduce((sum, order) => sum + parseFloat(order.primary_commission_amount || 0), 0);
      
      const totalStats = {
        totalOrders: totalOrders,
        totalAmount: totalAmount,
        totalCommission: totalCommission,
        monthOrders: 0, // 简化测试
        monthAmount: 0,
        monthCommission: 0,
        todayOrders: 0,
        todayAmount: 0,
        todayCommission: 0,
        pendingReminderCount: 0,
        currentCommissionRate: 0.4
      };
      
      const result = {
        sales: {
          id: primaryStats.id,
          wechat_name: primaryStats.wechat_name,
          sales_code: primaryStats.sales_code,
          commission_rate: primaryStats.commission_rate,
          payment_account: primaryStats.payment_account,
          payment_method: primaryStats.payment_method,
          direct_orders: primaryStats.total_orders,
          direct_amount: primaryStats.total_amount,
          direct_commission: primaryStats.total_commission
        },
        orders: orders || [],
        secondarySales: [],
        reminderOrders: [],
        stats: totalStats
      };
      
      console.log('✅ API返回结果:', {
        hasSales: !!result.sales,
        ordersCount: result.orders.length,
        statsTotal: result.stats.totalOrders,
        wechatName: result.sales.wechat_name
      });
      
      return result;
    } catch (error) {
      console.error('❌ 获取一级销售结算数据失败:', error);
      throw error;
    }
  }
}

async function testFrontendAPI() {
  console.log('🧪 测试前端API调用...');
  
  try {
    const params = {
      sales_code: 'PRI17547241780648255'
    };
    
    const response = await SupabaseService.getPrimarySalesSettlement(params);
    
    console.log('\n🎯 测试结果:');
    console.log(`response 存在: ${!!response}`);
    console.log(`response.sales 存在: ${!!response.sales}`);
    console.log(`微信号: ${response.sales?.wechat_name}`);
    console.log(`订单数量: ${response.orders?.length || 0}`);
    console.log(`统计总订单: ${response.stats?.totalOrders || 0}`);
    
    // 模拟前端判断逻辑
    if (!response || !response.sales) {
      console.log('❌ 前端会显示：未找到匹配的一级销售数据');
    } else {
      console.log('✅ 前端应该正常显示数据');
    }
    
    return response;
  } catch (error) {
    console.error('❌ API调用失败:', error);
    return null;
  }
}

testFrontendAPI();