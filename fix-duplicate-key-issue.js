/**
 * 修复主键冲突问题
 * 检查并解决orders_optimized_pkey重复问题
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixDuplicateKey() {
  console.log('========================================');
  console.log('诊断主键冲突问题');
  console.log('========================================\n');

  try {
    // 1. 检查两表的最大ID
    console.log('【1. 检查ID范围】');
    console.log('----------------------------------------');
    
    const { data: ordersMax } = await supabase
      .from('orders')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    const { data: optimizedMax } = await supabase
      .from('orders_optimized')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    console.log(`orders表最大ID: ${ordersMax?.id || 0}`);
    console.log(`orders_optimized表最大ID: ${optimizedMax?.id || 0}`);
    
    // 2. 检查序列值
    console.log('\n【2. 检查序列（自增ID）】');
    console.log('----------------------------------------');
    console.log('在Supabase SQL Editor执行以下SQL查看序列值：\n');
    
    console.log('```sql');
    console.log('-- 查看orders表的序列');
    console.log("SELECT last_value FROM orders_id_seq;");
    console.log('');
    console.log('-- 查看orders_optimized表的序列');
    console.log("SELECT last_value FROM orders_optimized_id_seq;");
    console.log('```');
    
    // 3. 查找重复的ID
    console.log('\n【3. 查找可能重复的ID】');
    console.log('----------------------------------------');
    
    // 获取最近的orders记录
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id')
      .order('id', { ascending: false })
      .limit(10);
    
    const { data: recentOptimized } = await supabase
      .from('orders_optimized')
      .select('id')
      .order('id', { ascending: false })
      .limit(10);
    
    if (recentOrders && recentOptimized) {
      const ordersIds = recentOrders.map(o => o.id);
      const optimizedIds = recentOptimized.map(o => o.id);
      
      console.log('orders表最近ID:', ordersIds.join(', '));
      console.log('orders_optimized表最近ID:', optimizedIds.join(', '));
      
      // 查找重复
      const duplicates = ordersIds.filter(id => optimizedIds.includes(id));
      if (duplicates.length > 0) {
        console.log(`\n发现重复ID: ${duplicates.join(', ')}`);
      }
    }
    
    // 4. 提供解决方案
    console.log('\n========================================');
    console.log('解决方案');
    console.log('========================================\n');
    
    console.log('【方案1: 修复序列值】');
    console.log('在Supabase SQL Editor执行：\n');
    
    const nextId = Math.max(ordersMax?.id || 0, optimizedMax?.id || 0) + 1;
    
    console.log('```sql');
    console.log('-- 重置orders表的序列');
    console.log(`ALTER SEQUENCE orders_id_seq RESTART WITH ${nextId};`);
    console.log('');
    console.log('-- 重置orders_optimized表的序列');
    console.log(`ALTER SEQUENCE orders_optimized_id_seq RESTART WITH ${nextId};`);
    console.log('```');
    
    console.log('\n【方案2: 修改触发器避免冲突】');
    console.log('```sql');
    console.log('-- 修改同步触发器，使用ON CONFLICT处理');
    console.log('CREATE OR REPLACE FUNCTION sync_orders_to_optimized()');
    console.log('RETURNS TRIGGER AS $$');
    console.log('BEGIN');
    console.log('  -- 使用UPSERT避免主键冲突');
    console.log('  INSERT INTO orders_optimized');
    console.log('  SELECT NEW.*');
    console.log('  ON CONFLICT (id) DO UPDATE SET');
    console.log('    updated_at = EXCLUDED.updated_at,');
    console.log('    status = EXCLUDED.status,');
    console.log('    duration = CASE EXCLUDED.duration');
    console.log("      WHEN '7days' THEN '7天'");
    console.log("      WHEN '1month' THEN '1个月'");
    console.log("      WHEN '3months' THEN '3个月'");
    console.log("      WHEN '6months' THEN '6个月'");
    console.log("      WHEN '1year' THEN '1年'");
    console.log('      ELSE EXCLUDED.duration');
    console.log('    END;');
    console.log('  RETURN NEW;');
    console.log('END;');
    console.log('$$ LANGUAGE plpgsql;');
    console.log('```');
    
    console.log('\n【方案3: 临时禁用触发器】');
    console.log('如果Vercel部署使用旧代码，可以临时禁用触发器：');
    console.log('```sql');
    console.log('-- 临时禁用触发器');
    console.log('ALTER TABLE orders DISABLE TRIGGER auto_sync_orders_insert;');
    console.log('ALTER TABLE orders DISABLE TRIGGER auto_sync_orders_update;');
    console.log('```');
    
    // 5. Vercel部署检查
    console.log('\n========================================');
    console.log('Vercel部署检查');
    console.log('========================================\n');
    
    console.log('发现Vercel部署地址：https://zhixing-seven.vercel.app/');
    console.log('\n需要立即执行：');
    console.log('1. 登录Vercel Dashboard');
    console.log('2. 检查部署的代码版本');
    console.log('3. 查看环境变量配置');
    console.log('4. 重新部署最新代码');
    
    console.log('\n或使用命令行：');
    console.log('```bash');
    console.log('# 检查Vercel项目');
    console.log('vercel list');
    console.log('');
    console.log('# 查看最近部署');
    console.log('vercel ls zhixing-seven');
    console.log('');
    console.log('# 重新部署');
    console.log('cd /Users/zzj/Documents/w/client');
    console.log('vercel --prod');
    console.log('```');
    
  } catch (error) {
    console.error('诊断过程中发生错误:', error.message);
  }
}

// 运行诊断
fixDuplicateKey();