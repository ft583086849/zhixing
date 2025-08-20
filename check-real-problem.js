/**
 * 重新检查真正的问题
 * 为什么更新orders_optimized后，页面还显示pending
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRealProblem() {
  console.log('========================================');
  console.log('重新分析问题');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================\n');

  try {
    // 1. 只看orders_optimized表
    console.log('【1. orders_optimized表当前状态】');
    console.log('----------------------------------------');
    
    const { data: allOrders } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, status, config_time, updated_at, duration')
      .in('id', [329, 330, 328]) // lovelai110等用户的订单
      .order('id');
    
    console.log('已经点过配置确认的订单：');
    allOrders?.forEach(order => {
      console.log(`\nID ${order.id}: ${order.tradingview_username}`);
      console.log(`  状态: ${order.status}`);
      console.log(`  duration: ${order.duration}`);
      console.log(`  配置时间: ${order.config_time ? new Date(order.config_time).toLocaleString('zh-CN') : '空'}`);
      console.log(`  更新时间: ${order.updated_at ? new Date(order.updated_at).toLocaleString('zh-CN') : '空'}`);
    });
    
    // 2. 检查duration字段问题
    console.log('\n【2. Duration字段分析】');
    console.log('----------------------------------------');
    
    const confirmedOrders = allOrders?.filter(o => o.status === 'confirmed_config');
    const pendingOrders = allOrders?.filter(o => o.status === 'pending');
    
    console.log('已确认订单的duration值：', confirmedOrders?.map(o => o.duration));
    console.log('待确认订单的duration值：', pendingOrders?.map(o => o.duration));
    
    // 3. 模拟前端查询逻辑
    console.log('\n【3. 模拟前端查询】');
    console.log('----------------------------------------');
    
    // 前端可能有额外的过滤条件
    const { data: frontendQuery } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('status', 'pending');
    
    console.log(`前端查询pending订单数量: ${frontendQuery?.length}`);
    
    // 检查是否有其他条件影响显示
    const sevenDayOrders = frontendQuery?.filter(o => o.duration === '7天' || o.duration === '7days');
    console.log(`其中7天订单: ${sevenDayOrders?.length}个`);
    
    // 4. 检查是否是缓存问题
    console.log('\n【4. 可能的原因分析】');
    console.log('----------------------------------------');
    console.log('1. 前端缓存问题 - Redux store可能没更新');
    console.log('2. 查询条件问题 - 可能有额外的筛选条件');
    console.log('3. duration字段问题 - 7天/7days的判断逻辑');
    console.log('4. 状态更新问题 - config_time设置但status没更新');
    
  } catch (error) {
    console.error('检查过程出错:', error);
  }
}

// 执行检查
checkRealProblem();