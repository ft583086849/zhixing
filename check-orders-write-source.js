/**
 * 检查为什么还在写入orders表
 * 分析最新订单的来源
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkWriteSource() {
  console.log('========================================');
  console.log('检查orders表写入来源');
  console.log('========================================\n');

  try {
    // 1. 分析今天的新订单
    console.log('【1. 今天新增的订单分析】');
    console.log('----------------------------------------');
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    // 获取今天orders表的新订单
    const { data: todayOrders, error: todayOrdersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false });
    
    if (todayOrders && todayOrders.length > 0) {
      console.log(`今天orders表新增 ${todayOrders.length} 条订单:\n`);
      
      todayOrders.forEach(order => {
        console.log(`订单ID: ${order.id}`);
        console.log(`  用户: ${order.tradingview_username}`);
        console.log(`  销售代码: ${order.sales_code || '无'}`);
        console.log(`  链接代码: ${order.link_code || '无'}`);
        console.log(`  时长: ${order.duration}`);
        console.log(`  金额: ${order.amount}`);
        console.log(`  状态: ${order.status}`);
        console.log(`  创建时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
        console.log();
      });
      
      // 分析共同特征
      const allPending = todayOrders.every(o => o.status === 'pending');
      const all7Days = todayOrders.every(o => o.duration === '7days');
      const allHaveSalesCode = todayOrders.every(o => o.sales_code);
      
      console.log('特征分析:');
      if (allPending) console.log('  ✓ 全部是pending状态（新提交的订单）');
      if (all7Days) console.log('  ✓ 全部是7天免费订单');
      if (allHaveSalesCode) console.log('  ✓ 全部有销售代码');
      
      // 分析链接代码模式
      const linkCodes = [...new Set(todayOrders.map(o => o.link_code).filter(l => l))];
      if (linkCodes.length > 0) {
        console.log(`  ✓ 涉及的链接代码: ${linkCodes.join(', ')}`);
      }
    } else {
      console.log('今天orders表没有新增订单');
    }
    
    // 2. 检查orders_optimized表今天的数据
    console.log('\n【2. orders_optimized表今天的数据】');
    console.log('----------------------------------------');
    
    const { data: todayOptimized, error: todayOptimizedError } = await supabase
      .from('orders_optimized')
      .select('*')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false });
    
    if (todayOptimized && todayOptimized.length > 0) {
      console.log(`orders_optimized表今天新增 ${todayOptimized.length} 条订单`);
      
      // 检查是否包含刚同步的数据
      const syncedIds = todayOptimized.filter(o => o.id >= 332).map(o => o.id);
      if (syncedIds.length > 0) {
        console.log(`其中 ${syncedIds.length} 条是刚同步的: ${syncedIds.join(', ')}`);
      }
    } else {
      console.log('orders_optimized表今天没有直接写入的新订单');
      console.log('⚠️ 所有新订单都写入了orders表！');
    }
    
    // 3. 查找可能的写入源
    console.log('\n【3. 可能的写入源分析】');
    console.log('----------------------------------------');
    
    console.log('基于订单特征，可能的来源:');
    console.log('\n1. PurchasePage（购买页面）:');
    console.log('   - 路径: /purchase/:linkCode');
    console.log('   - 特征: 7天免费订单，有link_code');
    console.log('   → 需要检查 src/pages/PurchasePage.js');
    
    console.log('\n2. API接口:');
    console.log('   - createOrder API');
    console.log('   - SupabaseService.createOrder()');
    console.log('   → 需要检查 src/services/supabase.js');
    
    console.log('\n3. 其他可能的页面:');
    console.log('   - 二级销售页面');
    console.log('   - 一级销售页面');
    
    // 4. 提供修复建议
    console.log('\n========================================');
    console.log('🔧 修复建议');
    console.log('========================================\n');
    
    console.log('【立即检查以下文件】:\n');
    
    console.log('1. src/services/supabase.js');
    console.log('   搜索: .from("orders")');
    console.log('   替换为: .from("orders_optimized")');
    
    console.log('\n2. src/pages/PurchasePage.js');
    console.log('   搜索: .from("orders")');
    console.log('   替换为: .from("orders_optimized")');
    
    console.log('\n3. src/services/api.js');
    console.log('   搜索: SupabaseService.createOrder');
    console.log('   确认使用正确的表');
    
    console.log('\n【执行步骤】:');
    console.log('1. 使用 grep 搜索所有使用 orders 表的地方');
    console.log('2. 确认所有创建订单的地方都改为 orders_optimized');
    console.log('3. 重新部署前端代码');
    console.log('4. 监控是否还有新数据写入 orders 表');
    
    // 5. 临时解决方案
    console.log('\n========================================');
    console.log('⚠️ 临时解决方案');
    console.log('========================================\n');
    
    console.log('在修复代码之前，可以创建一个数据库触发器自动同步:');
    console.log('\n```sql');
    console.log('-- 创建自动同步触发器');
    console.log('CREATE OR REPLACE FUNCTION sync_orders_to_optimized()');
    console.log('RETURNS TRIGGER AS $$');
    console.log('BEGIN');
    console.log('  INSERT INTO orders_optimized');
    console.log('  SELECT NEW.*;');
    console.log('  RETURN NEW;');
    console.log('END;');
    console.log('$$ LANGUAGE plpgsql;');
    console.log('');
    console.log('CREATE TRIGGER auto_sync_orders');
    console.log('AFTER INSERT ON orders');
    console.log('FOR EACH ROW');
    console.log('EXECUTE FUNCTION sync_orders_to_optimized();');
    console.log('```');
    
    console.log('\n这样即使有遗漏的地方，数据也会自动同步到orders_optimized表');
    
  } catch (error) {
    console.error('检查过程中发生错误:', error);
  }
}

// 运行检查
checkWriteSource();