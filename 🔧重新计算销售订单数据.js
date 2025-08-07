/**
 * 重新计算销售管理页面的订单数据
 * 在浏览器控制台运行此脚本，强制重新计算所有销售的订单统计
 */

async function recalculateSalesData() {
  console.clear();
  console.log('='.repeat(60));
  console.log('🔧 开始重新计算销售订单数据');
  console.log('='.repeat(60));
  
  const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
  
  try {
    // 1. 获取所有销售数据
    console.log('\n📋 步骤1：获取所有销售数据');
    
    const [primaryResponse, secondaryResponse] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/primary_sales?select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }),
      fetch(`${supabaseUrl}/rest/v1/secondary_sales?select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })
    ]);
    
    const primarySales = await primaryResponse.json();
    const secondarySales = await secondaryResponse.json();
    
    console.log(`✅ 获取到 ${primarySales.length} 个一级销售`);
    console.log(`✅ 获取到 ${secondarySales.length} 个二级销售`);
    
    // 2. 获取所有订单数据
    console.log('\n📋 步骤2：获取所有订单数据');
    
    const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    const orders = await ordersResponse.json();
    console.log(`✅ 获取到 ${orders.length} 个订单`);
    
    // 3. 计算每个销售的订单数据
    console.log('\n📊 步骤3：计算每个销售的订单统计');
    console.log('-'.repeat(60));
    
    const salesResults = [];
    
    // 处理一级销售
    console.log('\n🔍 一级销售统计：');
    primarySales.forEach(sale => {
      // 根据sales_code匹配订单
      const saleOrders = orders.filter(order => 
        order.sales_code === sale.sales_code || 
        order.primary_sales_id === sale.id
      );
      
      // 计算有效订单（已确认支付、待配置、已确认配置、激活状态）
      const validOrders = saleOrders.filter(order => 
        ['confirmed_payment', 'pending_config', 'confirmed_configuration', 'active'].includes(order.status)
      );
      
      // 计算总金额（USD）
      const totalAmount = saleOrders.reduce((sum, order) => {
        let amount = parseFloat(order.amount || 0);
        // 如果是支付宝，转换为美元（汇率7.15）
        if (order.payment_method === 'alipay') {
          amount = amount / 7.15;
        }
        return sum + amount;
      }, 0);
      
      // 计算已配置确认订单金额（只计算confirmed_configuration和active状态的订单）
      const confirmedAmount = saleOrders
        .filter(order => ['confirmed_configuration', 'active'].includes(order.status))
        .reduce((sum, order) => {
          let amount = parseFloat(order.amount || 0);
          if (order.payment_method === 'alipay') {
            amount = amount / 7.15;
          }
          return sum + amount;
        }, 0);
      
      // 佣金率（一级销售默认40%，根据需求文档可能有动态计算）
      const commissionRate = sale.commission_rate || 40;
      
      // 应返佣金额 = 已配置确认订单金额 × 佣金率
      const commissionAmount = confirmedAmount * (commissionRate / 100);
      
      const result = {
        销售类型: '一级销售',
        销售代码: sale.sales_code,
        销售名称: sale.name || sale.wechat_name || '未知',
        微信号: sale.wechat_name || '空',
        总订单数: saleOrders.length,
        有效订单数: validOrders.length,
        总金额: `$${totalAmount.toFixed(2)}`,
        已配置确认订单金额: `$${confirmedAmount.toFixed(2)}`,
        佣金率: `${commissionRate}%`,
        应返佣金额: `$${commissionAmount.toFixed(2)}`
      };
      
      console.log(`\n📌 ${result.销售名称} (${result.销售代码})`);
      console.log(`   总订单数: ${result.总订单数}`);
      console.log(`   有效订单数: ${result.有效订单数}`);
      console.log(`   总金额: ${result.总金额}`);
      console.log(`   已配置确认订单金额: ${result.已配置确认订单金额}`);
      console.log(`   佣金率: ${result.佣金率}`);
      console.log(`   应返佣金额: ${result.应返佣金额}`);
      
      salesResults.push(result);
    });
    
    // 处理二级销售
    console.log('\n🔍 二级销售统计：');
    secondarySales.forEach(sale => {
      // 根据sales_code匹配订单
      const saleOrders = orders.filter(order => 
        order.sales_code === sale.sales_code || 
        order.secondary_sales_id === sale.id
      );
      
      // 计算有效订单
      const validOrders = saleOrders.filter(order => 
        ['confirmed_payment', 'pending_config', 'confirmed_configuration', 'active'].includes(order.status)
      );
      
      // 计算总金额（USD）
      const totalAmount = saleOrders.reduce((sum, order) => {
        let amount = parseFloat(order.amount || 0);
        if (order.payment_method === 'alipay') {
          amount = amount / 7.15;
        }
        return sum + amount;
      }, 0);
      
      // 计算已配置确认订单金额
      const confirmedAmount = saleOrders
        .filter(order => ['confirmed_configuration', 'active'].includes(order.status))
        .reduce((sum, order) => {
          let amount = parseFloat(order.amount || 0);
          if (order.payment_method === 'alipay') {
            amount = amount / 7.15;
          }
          return sum + amount;
        }, 0);
      
      // 佣金率（独立二级销售30%，关联二级由一级设置）
      let commissionRate = 30;
      let salesType = '独立二级销售';
      
      if (sale.primary_sales_id) {
        salesType = '关联二级销售';
        // 如果有上级销售设置的佣金率，使用设置值
        if (sale.commission_rate) {
          commissionRate = sale.commission_rate;
        }
      }
      
      // 应返佣金额 = 已配置确认订单金额 × 佣金率
      const commissionAmount = confirmedAmount * (commissionRate / 100);
      
      const result = {
        销售类型: salesType,
        销售代码: sale.sales_code,
        销售名称: sale.name || sale.wechat_name || '未知',
        微信号: sale.wechat_name || '空',
        总订单数: saleOrders.length,
        有效订单数: validOrders.length,
        总金额: `$${totalAmount.toFixed(2)}`,
        已配置确认订单金额: `$${confirmedAmount.toFixed(2)}`,
        佣金率: `${commissionRate}%`,
        应返佣金额: `$${commissionAmount.toFixed(2)}`
      };
      
      console.log(`\n📌 ${result.销售名称} (${result.销售代码})`);
      console.log(`   总订单数: ${result.总订单数}`);
      console.log(`   有效订单数: ${result.有效订单数}`);
      console.log(`   总金额: ${result.总金额}`);
      console.log(`   已配置确认订单金额: ${result.已配置确认订单金额}`);
      console.log(`   佣金率: ${result.佣金率}`);
      console.log(`   应返佣金额: ${result.应返佣金额}`);
      
      salesResults.push(result);
    });
    
    // 4. 总结统计
    console.log('\n' + '='.repeat(60));
    console.log('📊 总体统计汇总');
    console.log('='.repeat(60));
    
    const totalStats = salesResults.reduce((acc, sale) => {
      acc.totalOrders += parseInt(sale.总订单数) || 0;
      acc.validOrders += parseInt(sale.有效订单数) || 0;
      acc.totalAmount += parseFloat(sale.总金额.replace('$', '')) || 0;
      acc.confirmedAmount += parseFloat(sale.已配置确认订单金额.replace('$', '')) || 0;
      acc.commissionAmount += parseFloat(sale.应返佣金额.replace('$', '')) || 0;
      return acc;
    }, { totalOrders: 0, validOrders: 0, totalAmount: 0, confirmedAmount: 0, commissionAmount: 0 });
    
    console.log(`总订单数: ${totalStats.totalOrders}`);
    console.log(`总有效订单数: ${totalStats.validOrders}`);
    console.log(`总金额: $${totalStats.totalAmount.toFixed(2)}`);
    console.log(`总已配置确认金额: $${totalStats.confirmedAmount.toFixed(2)}`);
    console.log(`总应返佣金额: $${totalStats.commissionAmount.toFixed(2)}`);
    
    // 5. 显示详细表格
    console.log('\n📋 详细数据表格：');
    console.table(salesResults);
    
    // 6. 现在强制刷新页面数据
    console.log('\n🔄 正在刷新页面数据...');
    
    // 如果有Redux store，触发数据刷新
    if (window.store) {
      const { dispatch } = window.store;
      const { getSales } = await import('/src/store/slices/adminSlice.js');
      await dispatch(getSales());
      console.log('✅ 页面数据已刷新，请查看销售管理页面');
    } else {
      console.log('⚠️ 请手动刷新页面查看最新数据');
    }
    
    return salesResults;
    
  } catch (error) {
    console.error('❌ 计算失败:', error);
    throw error;
  }
}

// 执行计算
console.log('🚀 开始执行销售数据重新计算...');
recalculateSalesData().then(results => {
  console.log('\n✅ 计算完成！');
  console.log('💡 提示: 如果页面数据还未更新，请刷新页面');
});

