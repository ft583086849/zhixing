// 🔍分析数据概览API问题.js
// 分析数据概览为0的原因和重新设计API逻辑

console.log('=== 🔍 数据概览API问题分析 ===\n');

async function analyzeStatsAPI() {
  try {
    if (typeof window === 'undefined' || !window.supabaseClient) {
      console.log('❌ Supabase客户端不可用');
      return;
    }

    console.log('✅ Supabase客户端可用\n');

    // === 1. 检查订单数据基础 ===
    console.log('📊 === 订单数据基础检查 ===');
    
    const { data: orders, error: ordersError } = await window.supabaseClient
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.log('❌ 订单查询失败:', ordersError.message);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('❌ 订单表确实无数据');
      return;
    }
    
    console.log(`✅ 订单数据: ${orders.length} 条`);

    // === 2. 分析订单状态分布 ===
    console.log('\n📈 === 订单状态分布分析 ===');
    
    const statusCount = {};
    orders.forEach(order => {
      const status = order.status || 'null';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    console.log('订单状态统计:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} 个`);
    });

    // === 3. 分析付款时间字段 ===
    console.log('\n💰 === 付款时间字段分析 ===');
    
    const paymentTimeFields = ['created_at', 'updated_at', 'payment_time', 'confirm_time'];
    
    paymentTimeFields.forEach(field => {
      const hasField = orders.some(order => order.hasOwnProperty(field));
      if (hasField) {
        const hasData = orders.filter(order => order[field] && order[field] !== '').length;
        console.log(`${field}: ${hasData}/${orders.length} 有数据`);
        
        if (hasData > 0) {
          const sampleValue = orders.find(order => order[field])[field];
          console.log(`  样本值: ${sampleValue}`);
        }
      } else {
        console.log(`${field}: 字段不存在`);
      }
    });

    // === 4. 分析金额字段 ===
    console.log('\n💵 === 金额字段分析 ===');
    
    const amountFields = ['amount', 'actual_payment_amount', 'commission_amount'];
    
    amountFields.forEach(field => {
      const hasData = orders.filter(order => 
        order[field] && order[field] !== '' && order[field] !== '0'
      ).length;
      
      console.log(`${field}: ${hasData}/${orders.length} 有有效金额`);
      
      if (hasData > 0) {
        const amounts = orders
          .filter(order => order[field] && parseFloat(order[field]) > 0)
          .map(order => parseFloat(order[field]));
        
        const total = amounts.reduce((sum, amt) => sum + amt, 0);
        console.log(`  总金额: ${total.toFixed(2)}`);
        console.log(`  平均金额: ${(total / amounts.length).toFixed(2)}`);
      }
    });

    // === 5. 按您的要求重新设计计算逻辑 ===
    console.log('\n🎯 === 按新逻辑重新计算数据概览 ===');
    
    console.log('新逻辑: 以付款时间为准，从订单列表计算');
    
    // 计算总订单数
    const totalOrders = orders.length;
    console.log(`总订单数: ${totalOrders}`);
    
    // 今日订单 (以created_at为准，可以改为付款时间)
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => {
      if (order.created_at) {
        return new Date(order.created_at).toDateString() === today;
      }
      return false;
    }).length;
    console.log(`今日订单: ${todayOrders}`);
    
    // 待付款确认
    const pendingPayment = orders.filter(order => 
      ['pending_payment', 'pending', 'pending_review'].includes(order.status)
    ).length;
    console.log(`待付款确认: ${pendingPayment}`);
    
    // 已付款确认  
    const confirmedPayment = orders.filter(order => 
      ['confirmed_payment', 'confirmed'].includes(order.status)
    ).length;
    console.log(`已付款确认: ${confirmedPayment}`);
    
    // 待配置确认
    const pendingConfig = orders.filter(order => 
      order.status === 'pending_config'
    ).length;
    console.log(`待配置确认: ${pendingConfig}`);
    
    // 已配置确认
    const confirmedConfig = orders.filter(order => 
      order.status === 'confirmed_configuration'
    ).length;
    console.log(`已配置确认: ${confirmedConfig}`);
    
    // 计算总金额 (实付金额优先)
    let totalAmount = 0;
    let totalCommission = 0;
    
    orders.forEach(order => {
      // 优先使用actual_payment_amount，其次amount
      const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
      const commission = parseFloat(order.commission_amount || 0);
      
      // 人民币转美元 (汇率7.15)
      if (order.payment_method === 'alipay') {
        totalAmount += (amount / 7.15);
        totalCommission += (commission / 7.15);
      } else {
        totalAmount += amount;
        totalCommission += commission;
      }
    });
    
    console.log(`总金额: $${totalAmount.toFixed(2)}`);
    console.log(`总佣金: $${totalCommission.toFixed(2)}`);

    // 销售统计
    console.log('\n👥 销售统计:');
    
    const { data: primarySales } = await window.supabaseClient
      .from('primary_sales')
      .select('id');
      
    const { data: secondarySales } = await window.supabaseClient
      .from('secondary_sales')
      .select('id');
    
    const primaryCount = primarySales?.length || 0;
    const secondaryCount = secondarySales?.length || 0;
    
    console.log(`一级销售: ${primaryCount}`);
    console.log(`二级销售: ${secondaryCount}`);
    console.log(`总销售: ${primaryCount + secondaryCount}`);

    // === 6. 对比当前Redux状态 ===
    console.log('\n🔄 === 对比Redux状态 ===');
    
    if (window.store) {
      const state = window.store.getState();
      const currentStats = state.admin?.stats;
      
      console.log('Redux中的统计数据:');
      if (currentStats) {
        Object.entries(currentStats).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      } else {
        console.log('  Redux stats为空');
      }
    }

    // === 7. 分析卡在哪里 ===
    console.log('\n🔍 === 问题诊断 ===');
    
    if (totalOrders > 0 && window.store) {
      const state = window.store.getState();
      const currentStats = state.admin?.stats;
      
      if (!currentStats || currentStats.total_orders === 0) {
        console.log('❌ 问题确认: 有订单数据但Redux统计为0');
        console.log('可能原因:');
        console.log('1. getStats API调用失败');
        console.log('2. 数据计算逻辑有问题'); 
        console.log('3. Redux数据更新失败');
        console.log('4. 组件没有正确获取Redux数据');
      } else {
        console.log('✅ Redux数据正常');
      }
    }

    // === 8. 新API设计建议 ===
    console.log('\n🎯 === 新数据概览API设计建议 ===');
    
    console.log(`
    建议的新API结构:
    
    async getOverviewStats() {
      // 1. 直接查询订单数据
      const orders = await SupabaseService.getOrders();
      
      // 2. 按您的要求以付款时间为准计算
      return {
        // 基础统计
        total_orders: orders.length,
        today_orders: 今日订单数(以付款时间),
        
        // 状态统计  
        pending_payment_orders: 待付款确认数量,
        confirmed_payment_orders: 已付款确认数量,
        pending_config_orders: 待配置确认数量,
        confirmed_config_orders: 已配置确认数量,
        
        // 金额统计
        total_amount: 总金额(实付金额优先),
        total_commission: 总佣金,
        
        // 销售统计
        primary_sales_count: 一级销售数量,
        secondary_sales_count: 二级销售数量,
        total_sales: 总销售数量
      };
    }
    `);

  } catch (error) {
    console.error('❌ 分析过程发生错误:', error);
  }
}

// 执行分析
analyzeStatsAPI();

console.log('\n💻 使用说明:');
console.log('1. 在管理后台按F12打开控制台');
console.log('2. 粘贴此脚本并回车执行');
console.log('3. 查看数据概览问题的详细分析');
