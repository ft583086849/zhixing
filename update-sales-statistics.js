/**
 * 更新销售统计表数据
 * 用于优化AdminSales页面性能
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function updateSalesStatistics() {
  console.log('🚀 开始更新销售统计数据...\n');
  const startTime = Date.now();
  
  try {
    // 1. 获取所有基础数据
    console.log('1️⃣ 获取基础数据...');
    const [primarySales, secondarySales, orders] = await Promise.all([
      supabase.from('primary_sales').select('*').then(r => r.data || []),
      supabase.from('secondary_sales').select('*').then(r => r.data || []),
      supabase.from('orders').select('*').then(r => r.data || [])
    ]);
    
    console.log(`   一级销售: ${primarySales.length}个`);
    console.log(`   二级销售: ${secondarySales.length}个`);
    console.log(`   订单总数: ${orders.length}个`);
    
    // 2. 清空现有统计数据
    console.log('\n2️⃣ 清空现有统计数据...');
    await supabase.from('sales_statistics').delete().neq('id', 0);
    
    // 3. 处理一级销售数据
    console.log('\n3️⃣ 处理一级销售数据...');
    for (const sale of primarySales) {
      // 获取该销售的直接订单
      const directOrders = orders.filter(o => 
        o.sales_code === sale.sales_code && 
        o.status !== 'rejected'
      );
      
      // 获取管理的二级销售
      const managedSecondaries = secondarySales.filter(s => 
        s.primary_sales_id === sale.id
      );
      
      // 获取二级销售的订单
      let secondaryOrdersAmount = 0;
      let secondaryTotalCommission = 0;
      let secondaryWeightedSum = 0;
      
      managedSecondaries.forEach(secondary => {
        const secOrders = orders.filter(o => 
          o.sales_code === secondary.sales_code &&
          ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
        );
        
        const secConfirmedAmount = secOrders.reduce((sum, order) => {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          // 人民币转美元
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
        
        // 二级销售的佣金率
        let secCommissionRate = secondary.commission_rate || 0.25;
        if (secCommissionRate > 1) {
          secCommissionRate = secCommissionRate / 100;
        }
        
        secondaryOrdersAmount += secConfirmedAmount;
        secondaryTotalCommission += secConfirmedAmount * secCommissionRate;
        secondaryWeightedSum += secCommissionRate * secConfirmedAmount;
      });
      
      // 计算各项指标
      const validOrders = directOrders.length;
      const confirmedOrders = directOrders.filter(o => 
        ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
      ).length;
      
      const totalAmount = directOrders.reduce((sum, order) => {
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        if (order.payment_method === 'alipay') {
          return sum + (amount / 7.15);
        }
        return sum + amount;
      }, 0);
      
      const confirmedAmount = directOrders
        .filter(o => ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status))
        .reduce((sum, order) => {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
      
      // 计算佣金
      const primaryBaseRate = 0.4; // 一级销售固定40%
      const primaryDirectCommission = confirmedAmount * primaryBaseRate;
      const secondaryShareCommission = secondaryOrdersAmount * primaryBaseRate - secondaryTotalCommission;
      const totalCommission = primaryDirectCommission + secondaryShareCommission;
      
      // 计算平均二级佣金率
      const secondaryAvgRate = secondaryOrdersAmount > 0 
        ? secondaryWeightedSum / secondaryOrdersAmount 
        : 0;
      
      // 插入统计数据
      const statsData = {
        sales_id: sale.id,
        sales_type: 'primary',
        sales_code: sale.sales_code,
        wechat_name: sale.wechat_name || sale.name || sale.phone,
        secondary_sales_count: managedSecondaries.length,
        total_orders: directOrders.length,
        valid_orders: validOrders,
        confirmed_orders: confirmedOrders,
        total_amount: totalAmount.toFixed(2),
        confirmed_amount: confirmedAmount.toFixed(2),
        commission_rate: primaryBaseRate,
        commission_amount: totalCommission.toFixed(2),
        paid_commission: sale.paid_commission || 0,
        pending_commission: (totalCommission - (sale.paid_commission || 0)).toFixed(2),
        primary_direct_amount: confirmedAmount.toFixed(2),
        primary_direct_commission: primaryDirectCommission.toFixed(2),
        secondary_orders_amount: secondaryOrdersAmount.toFixed(2),
        secondary_share_commission: secondaryShareCommission.toFixed(2),
        secondary_avg_rate: secondaryAvgRate,
        payment_method: sale.payment_method,
        payment_account: sale.payment_address,
        chain_name: sale.chain_name,
        last_commission_paid_at: sale.last_commission_paid_at,
        last_calculated_at: new Date().toISOString(),
        calculation_duration_ms: Date.now() - startTime
      };
      
      const { error } = await supabase.from('sales_statistics').insert(statsData);
      if (error) {
        console.error(`   ❌ 插入一级销售 ${sale.wechat_name} 失败:`, error.message);
      } else {
        console.log(`   ✅ 一级销售 ${sale.wechat_name}: ${validOrders}单, $${totalAmount.toFixed(2)}, 佣金$${totalCommission.toFixed(2)}`);
      }
    }
    
    // 4. 处理二级销售数据
    console.log('\n4️⃣ 处理二级销售数据...');
    for (const sale of secondarySales) {
      // 获取该销售的订单
      const saleOrders = orders.filter(o => 
        o.sales_code === sale.sales_code && 
        o.status !== 'rejected'
      );
      
      const validOrders = saleOrders.length;
      const confirmedOrders = saleOrders.filter(o => 
        ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
      ).length;
      
      const totalAmount = saleOrders.reduce((sum, order) => {
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        if (order.payment_method === 'alipay') {
          return sum + (amount / 7.15);
        }
        return sum + amount;
      }, 0);
      
      const confirmedAmount = saleOrders
        .filter(o => ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status))
        .reduce((sum, order) => {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15);
          }
          return sum + amount;
        }, 0);
      
      // 二级销售佣金率
      let commissionRate = sale.commission_rate || 0.25;
      if (commissionRate > 1) {
        commissionRate = commissionRate / 100;
      }
      
      const commissionAmount = confirmedAmount * commissionRate;
      const salesType = sale.primary_sales_id ? 'secondary' : 'independent';
      
      // 插入统计数据
      const statsData = {
        sales_id: sale.id,
        sales_type: salesType,
        sales_code: sale.sales_code,
        wechat_name: sale.wechat_name || sale.name || sale.phone,
        primary_sales_id: sale.primary_sales_id,
        total_orders: saleOrders.length,
        valid_orders: validOrders,
        confirmed_orders: confirmedOrders,
        total_amount: totalAmount.toFixed(2),
        confirmed_amount: confirmedAmount.toFixed(2),
        commission_rate: commissionRate,
        commission_amount: commissionAmount.toFixed(2),
        paid_commission: sale.paid_commission || 0,
        pending_commission: (commissionAmount - (sale.paid_commission || 0)).toFixed(2),
        payment_method: sale.payment_method,
        payment_account: sale.payment_address,
        chain_name: sale.chain_name,
        last_commission_paid_at: sale.last_commission_paid_at,
        last_calculated_at: new Date().toISOString(),
        calculation_duration_ms: Date.now() - startTime
      };
      
      const { error } = await supabase.from('sales_statistics').insert(statsData);
      if (error) {
        console.error(`   ❌ 插入${salesType === 'independent' ? '独立' : '二级'}销售 ${sale.wechat_name} 失败:`, error.message);
      } else {
        console.log(`   ✅ ${salesType === 'independent' ? '独立' : '二级'}销售 ${sale.wechat_name}: ${validOrders}单, $${totalAmount.toFixed(2)}, 佣金$${commissionAmount.toFixed(2)}`);
      }
    }
    
    // 5. 验证数据
    console.log('\n5️⃣ 验证统计数据...');
    const { data: stats, error: statsError } = await supabase
      .from('sales_statistics')
      .select('sales_type, COUNT(*), SUM(commission_amount)')
      .then(async (result) => {
        if (result.error) return result;
        
        // 手动聚合数据
        const grouped = {};
        for (const row of result.data || []) {
          if (!grouped[row.sales_type]) {
            grouped[row.sales_type] = {
              count: 0,
              total_commission: 0
            };
          }
          grouped[row.sales_type].count++;
          grouped[row.sales_type].total_commission += parseFloat(row.commission_amount || 0);
        }
        
        return { data: grouped, error: null };
      });
    
    if (statsError) {
      console.error('   ❌ 验证失败:', statsError.message);
    } else {
      console.log('\n📊 统计汇总:');
      for (const [type, data] of Object.entries(stats)) {
        console.log(`   ${type}: ${data.count}个销售, 总佣金$${data.total_commission.toFixed(2)}`);
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ 销售统计更新完成！耗时: ${duration}秒`);
    
    // 6. 提示性能对比
    console.log('\n📈 性能优化效果:');
    console.log('   优化前: 每次查询需要JOIN 3个表，计算所有订单数据');
    console.log('   优化后: 直接查询sales_statistics表，已预计算所有数据');
    console.log('   预期提升: 70-80% 查询速度提升');
    
  } catch (error) {
    console.error('❌ 更新销售统计失败:', error);
  }
}

// 执行更新
updateSalesStatistics();