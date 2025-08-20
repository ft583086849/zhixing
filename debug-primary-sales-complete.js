const { createClient } = require('@supabase/supabase-js');

const config = {
  url: 'https://itvmeamoqthfqtkpubdv.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
};

const supabase = createClient(config.url, config.key);

async function fullDiagnosticAnalysis() {
  console.log('🔍 一级销售对账页面全链路问题诊断\n');
  
  // === 第一部分：数据库层检查 ===
  console.log('📊 第一部分：数据库层检查');
  console.log('================================\n');
  
  // 1. 检查 sales_optimized 表结构和数据
  console.log('1. sales_optimized表结构分析');
  const { data: salesData, error: salesError } = await supabase
    .from('sales_optimized')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (salesError) {
    console.log('❌ sales_optimized查询错误:', salesError);
    return;
  }
  
  console.log('✅ sales_optimized表数据:', salesData.length, '条');
  
  // 按parent_sales_code分类
  const primarySales = salesData.filter(s => !s.parent_sales_code);
  const secondarySales = salesData.filter(s => s.parent_sales_code);
  
  console.log('- 一级销售(无parent_sales_code):', primarySales.length, '条');
  console.log('- 二级销售(有parent_sales_code):', secondarySales.length, '条');
  
  if (primarySales.length > 0) {
    const sample = primarySales[0];
    console.log('一级销售样本字段:');
    console.log('- sales_code:', sample.sales_code);
    console.log('- name:', sample.name);
    console.log('- wechat_name:', sample.wechat_name);
    console.log('- total_commission:', sample.total_commission);
    console.log('- primary_commission_amount:', sample.primary_commission_amount);
    console.log('- secondary_commission_amount:', sample.secondary_commission_amount);
    console.log('- month_commission:', sample.month_commission);
    console.log('- team_avg_commission_rate:', sample.team_avg_commission_rate);
  }
  
  if (secondarySales.length > 0) {
    const sample = secondarySales[0];
    console.log('二级销售样本:');
    console.log('- sales_code:', sample.sales_code);
    console.log('- parent_sales_code:', sample.parent_sales_code);
    console.log('- commission_rate:', sample.commission_rate);
  }
  
  // 2. 检查 orders_optimized 表
  console.log('\n2. orders_optimized表数据检查');
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('status', '已确认')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (ordersError) {
    console.log('❌ orders_optimized查询错误:', ordersError);
  } else {
    console.log('✅ 已确认订单数量:', ordersData?.length || 0);
    if (ordersData && ordersData.length > 0) {
      const sample = ordersData[0];
      console.log('订单样本:');
      console.log('- order_id:', sample.order_id);
      console.log('- sales_code:', sample.sales_code);
      console.log('- amount:', sample.amount);
      console.log('- commission:', sample.commission);
      console.log('- status:', sample.status);
      console.log('- created_at:', sample.created_at);
    }
  }
  
  // === 第二部分：API逻辑检查 ===
  console.log('\n📡 第二部分：API逻辑问题检查');
  console.log('================================\n');
  
  // 3. 检查是否存在错误的表引用
  console.log('3. 检查API中的表引用问题');
  
  // 测试 secondary_sales 表（这个表应该不存在或不应该使用）
  try {
    const { data: secondaryTest, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('*')
      .limit(1);
    
    if (secondaryError) {
      console.log('✅ secondary_sales表访问失败（正常）:', secondaryError.message);
    } else {
      console.log('⚠️  发现secondary_sales表存在，数据量:', secondaryTest?.length);
      console.log('❗ 这可能是问题的根源！API应该使用sales_optimized而不是secondary_sales');
    }
  } catch (err) {
    console.log('✅ secondary_sales表不存在（正常）');
  }
  
  // 4. 模拟正确的API查询逻辑
  console.log('\n4. 模拟正确的一级销售结算查询');
  
  if (primarySales.length > 0) {
    const testPrimary = primarySales[0];
    console.log('测试一级销售:', testPrimary.sales_code);
    
    // 正确的查询：从sales_optimized表查询该一级销售的二级销售
    const { data: subSales, error: subError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('parent_sales_code', testPrimary.sales_code);
    
    if (subError) {
      console.log('❌ 查询二级销售错误:', subError);
    } else {
      console.log('✅ 该一级销售的二级销售数量:', subSales?.length || 0);
      
      if (subSales && subSales.length > 0) {
        console.log('二级销售详情:');
        subSales.forEach(s => {
          console.log(`- ${s.sales_code} (${s.wechat_name}) - 佣金率: ${s.commission_rate || 0}`);
        });
        
        // 计算二级销售的订单统计
        let totalSecondaryOrders = 0;
        let totalSecondaryAmount = 0;
        let totalSecondaryCommission = 0;
        
        for (const secondary of subSales) {
          const { data: orders } = await supabase
            .from('orders_optimized')
            .select('amount, commission, status, created_at')
            .eq('sales_code', secondary.sales_code)
            .eq('status', '已确认');
          
          const orderCount = orders?.length || 0;
          const orderAmount = orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
          const orderCommission = orders?.reduce((sum, o) => sum + (o.commission || 0), 0) || 0;
          
          totalSecondaryOrders += orderCount;
          totalSecondaryAmount += orderAmount;
          totalSecondaryCommission += orderCommission;
          
          console.log(`  订单数: ${orderCount}, 金额: ${orderAmount}, 佣金: ${orderCommission}`);
        }
        
        console.log('二级销售总计:');
        console.log(`- 总订单数: ${totalSecondaryOrders}`);
        console.log(`- 总金额: ${totalSecondaryAmount}`);
        console.log(`- 总佣金: ${totalSecondaryCommission}`);
        
        // 计算平均二级佣金率
        const avgRate = subSales.length > 0 ? 
          subSales.reduce((sum, s) => sum + (s.commission_rate || 0), 0) / subSales.length : 0;
        console.log(`- 平均佣金率: ${(avgRate * 100).toFixed(2)}%`);
        
        // 计算一级销售的二级分成
        const baseRate = 0.4; // 40%基础佣金率
        const secondaryShare = totalSecondaryAmount * baseRate - totalSecondaryCommission;
        console.log(`- 一级销售二级分成: ${secondaryShare}`);
      }
    }
    
    // 检查一级销售自己的订单
    const { data: primaryOrders } = await supabase
      .from('orders_optimized')
      .select('amount, commission, status, created_at')
      .eq('sales_code', testPrimary.sales_code)
      .eq('status', '已确认');
    
    const primaryOrderCount = primaryOrders?.length || 0;
    const primaryOrderAmount = primaryOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
    const primaryOrderCommission = primaryOrders?.reduce((sum, o) => sum + (o.commission || 0), 0) || 0;
    
    console.log('一级销售直销数据:');
    console.log(`- 订单数: ${primaryOrderCount}`);
    console.log(`- 金额: ${primaryOrderAmount}`);
    console.log(`- 佣金: ${primaryOrderCommission}`);
  }
  
  // === 第三部分：前端数据映射检查 ===
  console.log('\n🖥️  第三部分：前端数据映射检查');
  console.log('================================\n');
  
  // 模拟前端页面期望的数据结构
  console.log('5. 前端页面期望的数据结构');
  const expectedDataStructure = {
    当日佣金: 'sales.today_commission',
    平均二级佣金率: 'sales.secondary_avg_rate',
    二级佣金收益额: 'sales.secondary_share_commission',
    二级销售订单总额: 'sales.secondary_orders_amount'
  };
  
  console.log('前端页面期望的字段映射:', expectedDataStructure);
  
  if (primarySales.length > 0) {
    const sample = primarySales[0];
    console.log('当前数据库字段值:');
    console.log('- today_commission:', sample.today_commission || '未设置');
    console.log('- secondary_avg_rate:', sample.secondary_avg_rate || sample.team_avg_commission_rate || '未设置');
    console.log('- secondary_share_commission:', sample.secondary_commission_amount || '未设置');
    console.log('- secondary_orders_amount:', sample.total_team_amount || '未设置');
  }
  
  // === 总结和修复建议 ===
  console.log('\n🛠️  第四部分：问题总结和修复建议');
  console.log('================================\n');
  
  console.log('问题根源分析:');
  console.log('1. ❌ API错误使用secondary_sales表而不是sales_optimized表');
  console.log('2. ❌ 一级销售记录中缺少关键的二级销售统计字段');  
  console.log('3. ❌ 没有正确计算和更新二级销售的聚合数据');
  console.log('4. ❌ 前端期望的字段在数据库中没有对应的值');
  
  console.log('\n修复建议:');
  console.log('1. ✅ 修改supabase.js中getPrimarySalesSettlement函数，使用sales_optimized表');
  console.log('2. ✅ 添加触发器或定时任务更新一级销售的二级销售统计数据');
  console.log('3. ✅ 确保二级销售数据正确关联到一级销售(parent_sales_code)');
  console.log('4. ✅ 验证前端页面数据映射逻辑');
}

// 执行完整诊断
fullDiagnosticAnalysis().catch(console.error);