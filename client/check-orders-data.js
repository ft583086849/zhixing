/**
 * 检查订单数据详细对比
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOrdersData() {
  console.log('========================================');
  console.log('订单数据详细检查');
  console.log('========================================\n');

  try {
    // 1. 检查orders表
    console.log('【1. orders表数据】');
    console.log('----------------------------------------');
    
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_id, created_at, tradingview_username, duration, amount, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ordersError) {
      console.log('❌ 查询orders表出错:', ordersError.message);
    } else {
      console.log(`获取到 ${ordersData.length} 条记录\n`);
      
      if (ordersData.length > 0) {
        console.log('最新记录:');
        ordersData.slice(0, 3).forEach(order => {
          console.log(`ID: ${order.id}`);
          console.log(`  订单号: ${order.order_id}`);
          console.log(`  用户: ${order.tradingview_username}`);
          console.log(`  时长: ${order.duration}`);
          console.log(`  金额: ${order.amount}`);
          console.log(`  状态: ${order.status}`);
          console.log(`  时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
          console.log();
        });
        
        // 检查最新数据时间
        const latestTime = new Date(ordersData[0].created_at);
        const hoursDiff = (Date.now() - latestTime) / (1000 * 60 * 60);
        console.log(`最新订单时间: ${latestTime.toLocaleString('zh-CN')}`);
        console.log(`距今: ${hoursDiff.toFixed(1)} 小时\n`);
        
        if (hoursDiff < 24) {
          console.log('⚠️ orders表在24小时内有新数据！');
        }
      }
    }
    
    // 2. 检查orders_optimized表
    console.log('【2. orders_optimized表数据】');
    console.log('----------------------------------------');
    
    const { data: optimizedData, error: optimizedError } = await supabase
      .from('orders_optimized')
      .select('id, order_id, created_at, tradingview_username, duration, amount, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (optimizedError) {
      console.log('❌ 查询orders_optimized表出错:', optimizedError.message);
    } else {
      console.log(`获取到 ${optimizedData.length} 条记录\n`);
      
      if (optimizedData.length > 0) {
        console.log('最新记录:');
        optimizedData.slice(0, 3).forEach(order => {
          console.log(`ID: ${order.id}`);
          console.log(`  订单号: ${order.order_id}`);
          console.log(`  用户: ${order.tradingview_username}`);
          console.log(`  时长: ${order.duration}`);
          console.log(`  金额: ${order.amount}`);
          console.log(`  状态: ${order.status}`);
          console.log(`  时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
          console.log();
        });
        
        // 检查duration格式
        const durations = [...new Set(optimizedData.map(o => o.duration).filter(d => d))];
        console.log('Duration值分布:', durations.join(', '));
        
        const nonChineseDurations = durations.filter(d => 
          !['7天', '1个月', '3个月', '6个月', '1年'].includes(d)
        );
        
        if (nonChineseDurations.length > 0) {
          console.log('⚠️ 发现非中文duration值:', nonChineseDurations.join(', '));
        }
      }
    }
    
    // 3. 数据对比
    console.log('\n【3. 数据对比分析】');
    console.log('----------------------------------------');
    
    if (ordersData && optimizedData) {
      // 比较最新订单
      if (ordersData.length > 0 && optimizedData.length > 0) {
        const ordersLatest = new Date(ordersData[0].created_at);
        const optimizedLatest = new Date(optimizedData[0].created_at);
        
        console.log(`orders表最新订单: ${ordersLatest.toLocaleString('zh-CN')}`);
        console.log(`orders_optimized表最新订单: ${optimizedLatest.toLocaleString('zh-CN')}`);
        
        if (ordersLatest > optimizedLatest) {
          const diffHours = (ordersLatest - optimizedLatest) / (1000 * 60 * 60);
          console.log(`\n⚠️ orders表有更新的数据，相差 ${diffHours.toFixed(1)} 小时`);
          console.log('需要同步最新数据到orders_optimized表！');
        } else if (optimizedLatest > ordersLatest) {
          console.log('\n✅ orders_optimized表数据更新');
        } else {
          console.log('\n✅ 两表最新数据时间相同');
        }
        
        // 检查订单号是否一致
        const ordersIds = ordersData.map(o => o.order_id);
        const optimizedIds = optimizedData.map(o => o.order_id);
        
        const missingInOptimized = ordersIds.filter(id => !optimizedIds.includes(id));
        const missingInOrders = optimizedIds.filter(id => !ordersIds.includes(id));
        
        if (missingInOptimized.length > 0) {
          console.log('\n在orders表但不在orders_optimized表的订单:');
          missingInOptimized.forEach(id => console.log(`  - ${id}`));
        }
        
        if (missingInOrders.length > 0) {
          console.log('\n在orders_optimized表但不在orders表的订单:');
          missingInOrders.forEach(id => console.log(`  - ${id}`));
        }
      }
    }
    
    // 4. 备份建议
    console.log('\n========================================');
    console.log('备份操作步骤');
    console.log('========================================\n');
    
    console.log('【最简单的备份方法】\n');
    console.log('1. 登录 Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard');
    console.log('\n2. 选择你的项目');
    console.log('\n3. 点击左侧 "Table Editor"');
    console.log('\n4. 逐个备份以下表:');
    console.log('   a. 选择 orders 表 → 点击 Export → Download as CSV');
    console.log('   b. 选择 orders_optimized 表 → 点击 Export → Download as CSV');
    console.log('   c. 选择 sales_optimized 表 → 点击 Export → Download as CSV');
    console.log('   d. 选择 overview_stats 表 → 点击 Export → Download as CSV');
    console.log('\n5. 保存这些CSV文件到安全的地方');
    
    console.log('\n【SQL备份（在Supabase SQL Editor执行）】\n');
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    console.log('```sql');
    console.log(`-- ${new Date().toLocaleString('zh-CN')} 备份`);
    console.log(`CREATE TABLE orders_backup_${today} AS SELECT * FROM orders;`);
    console.log(`CREATE TABLE orders_optimized_backup_${today} AS SELECT * FROM orders_optimized;`);
    console.log(`CREATE TABLE sales_optimized_backup_${today} AS SELECT * FROM sales_optimized;`);
    console.log('```');
    
    console.log('\n执行后可以在Table Editor中看到备份表');
    
    // 同步建议
    if (ordersData && ordersData.length > 0 && optimizedData) {
      const ordersLatest = new Date(ordersData[0].created_at);
      const optimizedLatest = new Date(optimizedData[0].created_at);
      
      if (ordersLatest > optimizedLatest) {
        console.log('\n========================================');
        console.log('⚠️ 数据同步建议');
        console.log('========================================\n');
        console.log('发现orders表有更新的数据，建议运行同步脚本:');
        console.log('\n```sql');
        console.log('-- 同步缺失的订单到orders_optimized');
        console.log('INSERT INTO orders_optimized');
        console.log('SELECT * FROM orders');
        console.log(`WHERE created_at > '${optimizedLatest.toISOString()}'`);
        console.log('ON CONFLICT (id) DO NOTHING;');
        console.log('```');
      }
    }
    
  } catch (error) {
    console.error('检查过程中发生错误:', error);
  }
}

// 运行检查
checkOrdersData();