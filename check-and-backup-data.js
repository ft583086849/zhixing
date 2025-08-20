/**
 * 数据检查和备份脚本
 * 1. 比较orders和orders_optimized表的数据
 * 2. 生成备份SQL
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndCompare() {
  console.log('========================================');
  console.log('数据检查和比较');
  console.log('========================================\n');

  try {
    // 1. 获取orders表的统计
    console.log('【1. orders表统计】');
    console.log('----------------------------------------');
    
    const { data: ordersCount, error: ordersCountError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const ordersTotal = ordersCountError ? 0 : ordersCount;
    console.log(`总记录数: ${ordersTotal}条`);
    
    // 获取最新的订单
    const { data: latestOrders, error: latestOrdersError } = await supabase
      .from('orders')
      .select('id, order_id, created_at, tradingview_username, duration, amount')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (latestOrders && latestOrders.length > 0) {
      console.log('\n最新5条订单:');
      latestOrders.forEach(order => {
        const date = new Date(order.created_at).toLocaleString('zh-CN');
        console.log(`  - ID: ${order.id}, 订单号: ${order.order_id}, 时间: ${date}`);
        console.log(`    用户: ${order.tradingview_username}, 时长: ${order.duration}, 金额: ${order.amount}`);
      });
      
      // 检查今天是否有新订单
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = latestOrders.filter(o => new Date(o.created_at) >= today);
      if (todayOrders.length > 0) {
        console.log(`\n⚠️ 警告: orders表今天有${todayOrders.length}条新订单！`);
      }
    }
    
    console.log();
    
    // 2. 获取orders_optimized表的统计
    console.log('【2. orders_optimized表统计】');
    console.log('----------------------------------------');
    
    const { data: optimizedCount, error: optimizedCountError } = await supabase
      .from('orders_optimized')
      .select('*', { count: 'exact', head: true });
    
    const optimizedTotal = optimizedCountError ? 0 : optimizedCount;
    console.log(`总记录数: ${optimizedTotal}条`);
    
    // 获取最新的订单
    const { data: latestOptimized, error: latestOptimizedError } = await supabase
      .from('orders_optimized')
      .select('id, order_id, created_at, tradingview_username, duration, amount')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (latestOptimized && latestOptimized.length > 0) {
      console.log('\n最新5条订单:');
      latestOptimized.forEach(order => {
        const date = new Date(order.created_at).toLocaleString('zh-CN');
        console.log(`  - ID: ${order.id}, 订单号: ${order.order_id}, 时间: ${date}`);
        console.log(`    用户: ${order.tradingview_username}, 时长: ${order.duration}, 金额: ${order.amount}`);
      });
    }
    
    console.log();
    
    // 3. 数据比较
    console.log('【3. 数据比较】');
    console.log('----------------------------------------');
    
    const diff = Math.abs(ordersTotal - optimizedTotal);
    if (diff === 0) {
      console.log('✅ 两表记录数相同');
    } else if (ordersTotal > optimizedTotal) {
      console.log(`⚠️ orders表比orders_optimized表多${diff}条记录`);
      
      // 查找缺失的订单
      const { data: missingOrders } = await supabase
        .from('orders')
        .select('id, order_id, created_at')
        .order('created_at', { ascending: false })
        .limit(diff + 10);
      
      console.log('\n可能缺失的订单（显示前几条）:');
      // 这里简化处理，实际需要更复杂的比对逻辑
      if (missingOrders) {
        missingOrders.slice(0, 5).forEach(order => {
          console.log(`  - ID: ${order.id}, 订单号: ${order.order_id}, 时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
        });
      }
    } else {
      console.log(`ℹ️ orders_optimized表比orders表多${diff}条记录`);
    }
    
    // 4. 检查今天的数据
    console.log('\n【4. 今日数据检查】');
    console.log('----------------------------------------');
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const { data: todayOrdersData, error: todayOrdersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());
    
    const { data: todayOptimizedData, error: todayOptimizedError } = await supabase
      .from('orders_optimized')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());
    
    const todayOrdersCount = todayOrdersError ? 0 : todayOrdersData;
    const todayOptimizedCount = todayOptimizedError ? 0 : todayOptimizedData;
    
    console.log(`orders表今日新增: ${todayOrdersCount}条`);
    console.log(`orders_optimized表今日新增: ${todayOptimizedCount}条`);
    
    if (todayOrdersCount > 0 && todayOrdersCount !== todayOptimizedCount) {
      console.log('⚠️ 警告: 今天两表的新增数据不一致！需要同步');
    }
    
    console.log();
    
    // 5. 生成备份建议
    console.log('========================================');
    console.log('备份方案');
    console.log('========================================\n');
    
    console.log('【方案1: Supabase Dashboard备份】');
    console.log('1. 登录 Supabase Dashboard');
    console.log('2. 进入 Table Editor');
    console.log('3. 选择要备份的表');
    console.log('4. 点击 Export -> Download as CSV');
    console.log('5. 备份以下表:');
    console.log('   - orders');
    console.log('   - orders_optimized');
    console.log('   - sales_optimized');
    console.log('   - overview_stats');
    
    console.log('\n【方案2: SQL备份命令】');
    console.log('在 Supabase SQL Editor 中执行:');
    console.log('```sql');
    console.log('-- 创建备份表');
    console.log(`CREATE TABLE orders_backup_${new Date().toISOString().split('T')[0]} AS SELECT * FROM orders;`);
    console.log(`CREATE TABLE orders_optimized_backup_${new Date().toISOString().split('T')[0]} AS SELECT * FROM orders_optimized;`);
    console.log(`CREATE TABLE sales_optimized_backup_${new Date().toISOString().split('T')[0]} AS SELECT * FROM sales_optimized;`);
    console.log('```');
    
    console.log('\n【方案3: 使用pg_dump（推荐）】');
    console.log('如果有数据库直接访问权限:');
    console.log('```bash');
    console.log('pg_dump -h aws-0-ap-southeast-1.pooler.supabase.com \\');
    console.log('  -p 6543 \\');
    console.log('  -U postgres.tfuhjtrluvjcgqjwlhze \\');
    console.log('  -d postgres \\');
    console.log('  --table=orders \\');
    console.log('  --table=orders_optimized \\');
    console.log('  --table=sales_optimized \\');
    console.log(`  -f backup_${new Date().toISOString().split('T')[0]}.sql`);
    console.log('```');
    
    // 数据同步建议
    if (diff > 0 || todayOrdersCount > 0) {
      console.log('\n========================================');
      console.log('⚠️ 数据同步建议');
      console.log('========================================\n');
      
      console.log('发现数据不一致，建议执行以下同步:');
      console.log('\n```sql');
      console.log('-- 将orders表中缺失的数据同步到orders_optimized');
      console.log('INSERT INTO orders_optimized');
      console.log('SELECT * FROM orders');
      console.log('WHERE id NOT IN (SELECT id FROM orders_optimized);');
      console.log('```');
      
      console.log('\n或者运行同步脚本: node sync-orders-to-optimized.js');
    }
    
    // 部署前检查清单
    console.log('\n========================================');
    console.log('部署前检查清单');
    console.log('========================================\n');
    
    const checks = [
      { item: '数据备份完成', done: false },
      { item: '数据同步完成', done: diff === 0 },
      { item: 'orders表停止写入', done: todayOrdersCount === 0 },
      { item: 'orders_optimized表正常', done: optimizedTotal > 0 },
      { item: '环境变量配置正确', done: false },
    ];
    
    checks.forEach(check => {
      console.log(`${check.done ? '✅' : '⬜'} ${check.item}`);
    });
    
    if (todayOrdersCount > 0) {
      console.log('\n❌ 重要: orders表今天还有新数据，需要先确保应用不再写入orders表！');
    } else if (diff === 0) {
      console.log('\n✅ 数据一致性良好，可以进行部署');
    } else {
      console.log('\n⚠️ 建议先同步数据再部署');
    }
    
  } catch (error) {
    console.error('检查过程中发生错误:', error.message);
  }
}

// 运行检查
checkAndCompare();