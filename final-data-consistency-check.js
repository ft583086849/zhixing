/**
 * 最终数据一致性检查
 * 确认orders和orders_optimized表完全一致
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDataConsistency() {
  console.log('========================================');
  console.log('最终数据一致性检查');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================\n');
  
  let isConsistent = true;
  
  try {
    // 1. 检查总数
    console.log('【1. 记录总数对比】');
    console.log('----------------------------------------');
    
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: optimizedCount } = await supabase
      .from('orders_optimized')
      .select('*', { count: 'exact', head: true });
    
    console.log(`orders表: ${ordersCount} 条`);
    console.log(`orders_optimized表: ${optimizedCount} 条`);
    
    if (ordersCount === optimizedCount) {
      console.log('✅ 记录数完全一致');
    } else {
      console.log(`❌ 记录数不一致，相差 ${Math.abs(ordersCount - optimizedCount)} 条`);
      isConsistent = false;
    }
    
    // 2. 检查最新记录
    console.log('\n【2. 最新记录对比】');
    console.log('----------------------------------------');
    
    const { data: latestOrders } = await supabase
      .from('orders')
      .select('id, tradingview_username, created_at')
      .order('id', { ascending: false })
      .limit(5);
    
    const { data: latestOptimized } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, created_at')
      .order('id', { ascending: false })
      .limit(5);
    
    console.log('orders表最新5条ID:', latestOrders?.map(o => o.id).join(', '));
    console.log('orders_optimized表最新5条ID:', latestOptimized?.map(o => o.id).join(', '));
    
    const ordersIds = latestOrders?.map(o => o.id).join(',');
    const optimizedIds = latestOptimized?.map(o => o.id).join(',');
    
    if (ordersIds === optimizedIds) {
      console.log('✅ 最新记录ID一致');
    } else {
      console.log('❌ 最新记录ID不一致');
      isConsistent = false;
    }
    
    // 3. 检查ID序列
    console.log('\n【3. ID序列检查】');
    console.log('----------------------------------------');
    
    const maxOrderId = latestOrders?.[0]?.id || 0;
    const maxOptimizedId = latestOptimized?.[0]?.id || 0;
    
    console.log(`orders表最大ID: ${maxOrderId}`);
    console.log(`orders_optimized表最大ID: ${maxOptimizedId}`);
    
    if (maxOrderId === maxOptimizedId) {
      console.log('✅ 最大ID完全一致');
    } else {
      console.log('❌ 最大ID不一致');
      isConsistent = false;
    }
    
    // 4. 检查今天的数据
    console.log('\n【4. 今日数据检查】');
    console.log('----------------------------------------');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    
    const { count: todayOptimizedCount } = await supabase
      .from('orders_optimized')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    
    console.log(`orders表今日新增: ${todayOrdersCount || 0} 条`);
    console.log(`orders_optimized表今日新增: ${todayOptimizedCount || 0} 条`);
    
    if (todayOrdersCount === todayOptimizedCount) {
      console.log('✅ 今日数据一致');
    } else {
      console.log('❌ 今日数据不一致');
      isConsistent = false;
    }
    
    // 5. 随机抽样检查
    console.log('\n【5. 随机抽样检查】');
    console.log('----------------------------------------');
    
    // 随机选择一些ID进行对比
    const sampleIds = [10, 50, 100, 200, 300];
    let sampleMatch = true;
    
    for (const id of sampleIds) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, tradingview_username')
        .eq('id', id)
        .single();
      
      const { data: optimizedData } = await supabase
        .from('orders_optimized')
        .select('id, tradingview_username')
        .eq('id', id)
        .single();
      
      if (orderData && optimizedData) {
        if (orderData.tradingview_username === optimizedData.tradingview_username) {
          console.log(`✅ ID ${id}: 数据一致`);
        } else {
          console.log(`❌ ID ${id}: 数据不一致`);
          sampleMatch = false;
        }
      } else if (!orderData && !optimizedData) {
        console.log(`⚪ ID ${id}: 两表都不存在`);
      } else {
        console.log(`❌ ID ${id}: 只在一个表中存在`);
        sampleMatch = false;
      }
    }
    
    if (!sampleMatch) {
      isConsistent = false;
    }
    
    // 最终结论
    console.log('\n========================================');
    console.log('最终结论');
    console.log('========================================\n');
    
    if (isConsistent) {
      console.log('✅✅✅ 数据完全一致，可以安全部署！');
      console.log('\n两表数据已完全同步，部署后：');
      console.log('- 新订单将直接写入orders_optimized表');
      console.log('- 不再依赖触发器同步');
      console.log('- 彻底解决主键冲突问题');
      
      return true;
    } else {
      console.log('❌ 数据存在不一致，建议先同步');
      console.log('\n建议执行：');
      console.log('1. 运行 sync-orders-data.js 同步数据');
      console.log('2. 重新运行此检查');
      console.log('3. 确认一致后再部署');
      
      return false;
    }
    
  } catch (error) {
    console.error('检查出错:', error.message);
    return false;
  }
}

// 运行检查
checkDataConsistency().then(canDeploy => {
  if (canDeploy) {
    console.log('\n========================================');
    console.log('准备部署');
    console.log('========================================');
    console.log('执行命令: vercel --prod');
  }
});