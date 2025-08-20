/**
 * 检查表结构和数据
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('========================================');
  console.log('表结构和数据检查');
  console.log('========================================\n');

  try {
    // 1. 尝试获取orders表的所有字段
    console.log('【1. orders表】');
    console.log('----------------------------------------');
    
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(3);
    
    if (ordersError) {
      console.log('❌ 无法访问orders表:', ordersError.message);
    } else {
      console.log(`✅ 成功获取 ${ordersData.length} 条记录\n`);
      
      if (ordersData.length > 0) {
        console.log('表字段:');
        console.log(Object.keys(ordersData[0]).join(', '));
        
        console.log('\n示例数据:');
        ordersData.forEach((order, index) => {
          console.log(`\n记录 ${index + 1}:`);
          console.log(`  ID: ${order.id}`);
          console.log(`  用户: ${order.tradingview_username || '无'}`);
          console.log(`  时长: ${order.duration || '无'}`);
          console.log(`  金额: ${order.amount || 0}`);
          console.log(`  状态: ${order.status || '无'}`);
          console.log(`  创建时间: ${order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '无'}`);
        });
        
        // 统计总数
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        
        console.log(`\n总记录数: ${ordersCount || '无法获取'}`);
        
        // 检查最新数据
        const { data: latestOrder } = await supabase
          .from('orders')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (latestOrder) {
          const latestTime = new Date(latestOrder.created_at);
          const hoursDiff = (Date.now() - latestTime) / (1000 * 60 * 60);
          console.log(`最新记录时间: ${latestTime.toLocaleString('zh-CN')}`);
          console.log(`距今: ${hoursDiff.toFixed(1)} 小时`);
          
          if (hoursDiff < 1) {
            console.log('⚠️ orders表在1小时内有新数据！');
          }
        }
      }
    }
    
    console.log();
    
    // 2. 检查orders_optimized表
    console.log('【2. orders_optimized表】');
    console.log('----------------------------------------');
    
    const { data: optimizedData, error: optimizedError } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(3);
    
    if (optimizedError) {
      console.log('❌ 无法访问orders_optimized表:', optimizedError.message);
    } else {
      console.log(`✅ 成功获取 ${optimizedData.length} 条记录\n`);
      
      if (optimizedData.length > 0) {
        console.log('表字段:');
        console.log(Object.keys(optimizedData[0]).join(', '));
        
        console.log('\n示例数据:');
        optimizedData.forEach((order, index) => {
          console.log(`\n记录 ${index + 1}:`);
          console.log(`  ID: ${order.id}`);
          console.log(`  用户: ${order.tradingview_username || '无'}`);
          console.log(`  时长: ${order.duration || '无'}`);
          console.log(`  金额: ${order.amount || 0}`);
          console.log(`  状态: ${order.status || '无'}`);
          console.log(`  创建时间: ${order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '无'}`);
        });
        
        // 统计总数
        const { count: optimizedCount } = await supabase
          .from('orders_optimized')
          .select('*', { count: 'exact', head: true });
        
        console.log(`\n总记录数: ${optimizedCount || '无法获取'}`);
        
        // 检查duration格式
        const { data: durationData } = await supabase
          .from('orders_optimized')
          .select('duration')
          .not('duration', 'is', null)
          .limit(20);
        
        if (durationData && durationData.length > 0) {
          const durations = [...new Set(durationData.map(d => d.duration))];
          console.log('\nDuration值类型:');
          durations.forEach(d => {
            const count = durationData.filter(item => item.duration === d).length;
            console.log(`  ${d}: ${count}条`);
          });
          
          const nonChinese = durations.filter(d => 
            !['7天', '1个月', '3个月', '6个月', '1年'].includes(d)
          );
          
          if (nonChinese.length > 0) {
            console.log('\n⚠️ 发现非标准中文duration值:', nonChinese.join(', '));
          } else {
            console.log('\n✅ Duration字段已全部规范化为中文');
          }
        }
      }
    }
    
    console.log();
    
    // 3. 对比分析
    console.log('【3. 数据对比】');
    console.log('----------------------------------------');
    
    if (!ordersError && !optimizedError) {
      const { count: count1 } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      const { count: count2 } = await supabase
        .from('orders_optimized')
        .select('*', { count: 'exact', head: true });
      
      console.log(`orders表: ${count1 || 0} 条记录`);
      console.log(`orders_optimized表: ${count2 || 0} 条记录`);
      
      if (count1 && count2) {
        const diff = count1 - count2;
        if (diff === 0) {
          console.log('\n✅ 两表记录数相同');
        } else if (diff > 0) {
          console.log(`\n⚠️ orders表比orders_optimized表多 ${diff} 条记录`);
          console.log('需要同步数据！');
        } else {
          console.log(`\nℹ️ orders_optimized表比orders表多 ${Math.abs(diff)} 条记录`);
        }
      }
    }
    
    // 4. 备份建议
    console.log('\n========================================');
    console.log('备份方案（简单版）');
    console.log('========================================\n');
    
    console.log('【方法1: Supabase Dashboard导出】');
    console.log('1. 登录 https://supabase.com/dashboard');
    console.log('2. 选择项目 → Table Editor');
    console.log('3. 选择表 → Export → Download as CSV');
    console.log('4. 保存CSV文件');
    
    console.log('\n【方法2: SQL备份】');
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    console.log('在SQL Editor执行:');
    console.log(`CREATE TABLE orders_bak_${date} AS SELECT * FROM orders;`);
    console.log(`CREATE TABLE orders_optimized_bak_${date} AS SELECT * FROM orders_optimized;`);
    console.log(`CREATE TABLE sales_optimized_bak_${date} AS SELECT * FROM sales_optimized;`);
    
    console.log('\n✅ 备份完成后即可安全部署');
    
  } catch (error) {
    console.error('检查过程中发生错误:', error);
  }
}

// 运行检查
checkTables();