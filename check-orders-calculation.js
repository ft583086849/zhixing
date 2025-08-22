#!/usr/bin/env node

// 检查一级销售的订单统计逻辑
console.log('🔍 检查一级销售订单统计逻辑...');

// 使用现有的服务层
const path = require('path');
const clientPath = path.join(__dirname, 'client');

async function checkOrdersCalculation() {
  try {
    // 导入Supabase服务
    const { SupabaseService } = await import('./client/src/services/supabase.js');
    const supabase = SupabaseService.supabase;
    
    console.log('📊 1. 获取一级销售的订单统计数据...');
    
    // 获取几个一级销售的统计数据
    const { data: primarySales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, total_orders, total_direct_orders, total_team_orders, total_amount, total_direct_amount, total_team_amount')
      .eq('sales_type', 'primary')
      .gt('total_orders', 0)  // 只看有订单的
      .order('total_orders', { ascending: false })
      .limit(5);
      
    if (salesError) {
      console.error('❌ 查询一级销售失败:', salesError);
      return;
    }
    
    if (primarySales && primarySales.length > 0) {
      console.log('✅ 一级销售订单统计数据:');
      console.log('销售代码 | 微信号 | 总订单 | 直销订单 | 团队订单 | 计算结果');
      console.log('---------|---------|---------|-----------|-----------|----------');
      
      primarySales.forEach(sale => {
        const directOrders = sale.total_direct_orders || 0;
        const teamOrders = sale.total_team_orders || 0;
        const totalOrders = sale.total_orders || 0;
        const calculatedTotal = directOrders + teamOrders;
        const isCorrect = totalOrders === calculatedTotal;
        
        console.log(`${sale.sales_code} | ${sale.wechat_name || '-'} | ${totalOrders} | ${directOrders} | ${teamOrders} | ${calculatedTotal} ${isCorrect ? '✅' : '❌'}`);
      });
    }
    
    console.log('\n📊 2. 检查具体一级销售的订单分布...');
    
    if (primarySales && primarySales.length > 0) {
      const testSales = primarySales[0]; // 取第一个销售
      console.log(`\n🔍 详细分析销售: ${testSales.sales_code} (${testSales.wechat_name})`);
      
      // 查询该销售的直销订单
      const { data: directOrders, error: directError } = await supabase
        .from('orders_optimized')
        .select('id, sales_code, amount, status')
        .eq('sales_code', testSales.sales_code)
        .neq('status', 'rejected');
        
      if (!directError && directOrders) {
        console.log(`📋 直销订单数量: ${directOrders.length}`);
      }
      
      // 查询该销售下级的订单（团队订单）
      const { data: teamSales, error: teamSalesError } = await supabase
        .from('sales_optimized')
        .select('sales_code')
        .eq('parent_sales_code', testSales.sales_code);
        
      if (!teamSalesError && teamSales) {
        console.log(`📋 团队成员数量: ${teamSales.length}`);
        
        if (teamSales.length > 0) {
          const teamSalesCodes = teamSales.map(s => s.sales_code);
          
          const { data: teamOrders, error: teamOrdersError } = await supabase
            .from('orders_optimized')
            .select('id, sales_code, amount, status')
            .in('sales_code', teamSalesCodes)
            .neq('status', 'rejected');
            
          if (!teamOrdersError && teamOrders) {
            console.log(`📋 团队订单数量: ${teamOrders.length}`);
          }
        }
      }
    }
    
    console.log('\n📊 3. 检查数据库触发器逻辑...');
    
    // 查看是否有相关的触发器
    const { data: triggers, error: triggerError } = await supabase.rpc('get_triggers_info');
    
    if (!triggerError && triggers) {
      console.log('📋 数据库触发器信息:', triggers);
    } else {
      console.log('📋 无法获取触发器信息（可能需要更高权限）');
    }
    
    console.log('\n✅ 订单统计检查完成');
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error);
  }
}

checkOrdersCalculation();