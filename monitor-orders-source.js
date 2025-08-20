/**
 * 监控订单来源
 * 实时监控新订单是否还在写入orders表
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 记录最后检查的ID
let lastOrderId = 0;
let lastOptimizedId = 0;

async function monitorOrders() {
  console.log('\n' + '='.repeat(60));
  console.log(`监控时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('='.repeat(60));
  
  try {
    // 1. 检查orders表的新数据
    const { data: newOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, tradingview_username, sales_code, link_code, duration, created_at, status')
      .gt('id', lastOrderId)
      .order('id', { ascending: true });
    
    if (newOrders && newOrders.length > 0) {
      console.log(`\n🔴 发现 ${newOrders.length} 条新订单写入 orders 表:`);
      newOrders.forEach(order => {
        console.log(`  ID ${order.id}: ${order.tradingview_username} (${order.duration}) - ${new Date(order.created_at).toLocaleTimeString('zh-CN')}`);
        console.log(`    链接: ${order.link_code}`);
      });
      
      // 更新最后ID
      lastOrderId = Math.max(...newOrders.map(o => o.id));
      
      // 分析来源
      const linkCodes = [...new Set(newOrders.map(o => o.link_code))];
      console.log(`\n  涉及的链接代码: ${linkCodes.join(', ')}`);
    } else {
      console.log('\n✅ orders表没有新数据');
    }
    
    // 2. 检查orders_optimized表的新数据
    const { data: newOptimized, error: optimizedError } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, sales_code, link_code, duration, created_at, status')
      .gt('id', lastOptimizedId)
      .order('id', { ascending: true });
    
    if (newOptimized && newOptimized.length > 0) {
      console.log(`\n📊 orders_optimized表新增 ${newOptimized.length} 条记录:`);
      
      // 检查是否是同步的
      const syncedFromOrders = newOptimized.filter(o => newOrders && newOrders.find(no => no.id === o.id));
      const directInserts = newOptimized.filter(o => !syncedFromOrders.includes(o));
      
      if (syncedFromOrders.length > 0) {
        console.log(`  ↻ ${syncedFromOrders.length} 条从orders表同步（触发器工作正常）`);
      }
      
      if (directInserts.length > 0) {
        console.log(`  ✅ ${directInserts.length} 条直接写入（使用新代码）:`);
        directInserts.forEach(order => {
          console.log(`    ID ${order.id}: ${order.tradingview_username}`);
        });
      }
      
      // 更新最后ID
      lastOptimizedId = Math.max(...newOptimized.map(o => o.id));
    }
    
    // 3. 统计分析
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: optimizedCount } = await supabase
      .from('orders_optimized')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n📈 当前统计:');
    console.log(`  orders表总计: ${ordersCount} 条`);
    console.log(`  orders_optimized表总计: ${optimizedCount} 条`);
    console.log(`  差异: ${Math.abs(ordersCount - optimizedCount)} 条`);
    
    // 4. 判断状态
    if (newOrders && newOrders.length > 0) {
      console.log('\n⚠️ 警告: 仍有代码在写入orders表！');
      console.log('可能原因:');
      console.log('  1. 有缓存的旧版本前端代码');
      console.log('  2. CDN缓存未更新');
      console.log('  3. 用户浏览器缓存');
      console.log('  4. 其他部署实例');
    } else {
      console.log('\n✅ 系统状态正常');
    }
    
  } catch (error) {
    console.error('监控出错:', error.message);
  }
}

// 初始化：获取当前最大ID
async function initialize() {
  console.log('初始化监控系统...');
  
  try {
    const { data: latestOrder } = await supabase
      .from('orders')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    if (latestOrder) {
      lastOrderId = latestOrder.id;
      console.log(`orders表当前最大ID: ${lastOrderId}`);
    }
    
    const { data: latestOptimized } = await supabase
      .from('orders_optimized')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    if (latestOptimized) {
      lastOptimizedId = latestOptimized.id;
      console.log(`orders_optimized表当前最大ID: ${lastOptimizedId}`);
    }
    
    console.log('\n开始监控（每30秒检查一次）...');
    console.log('按 Ctrl+C 停止监控\n');
    
    // 立即执行一次
    await monitorOrders();
    
    // 定时监控
    setInterval(monitorOrders, 30000); // 每30秒检查一次
    
  } catch (error) {
    console.error('初始化失败:', error.message);
  }
}

// 启动监控
initialize();