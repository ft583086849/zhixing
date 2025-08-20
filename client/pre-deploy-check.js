/**
 * 部署前最终检查
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function preDeployCheck() {
  console.log('========================================');
  console.log('部署前最终检查');
  console.log('========================================\n');
  
  const checks = [];
  
  try {
    // 1. 检查orders_optimized表
    console.log('【1. 数据库表检查】');
    const { data: ordersCheck, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('count', { count: 'exact', head: true });
    
    if (!ordersError) {
      checks.push('✅ orders_optimized表正常');
      console.log('✅ orders_optimized表可访问');
    } else {
      checks.push('❌ orders_optimized表有问题');
      console.log('❌ orders_optimized表错误:', ordersError.message);
    }
    
    // 2. 检查sales_optimized表
    const { data: salesCheck, error: salesError } = await supabase
      .from('sales_optimized')
      .select('count', { count: 'exact', head: true });
    
    if (!salesError) {
      checks.push('✅ sales_optimized表正常');
      console.log('✅ sales_optimized表可访问');
    } else {
      checks.push('❌ sales_optimized表有问题');
      console.log('❌ sales_optimized表错误:', salesError.message);
    }
    
    // 3. 检查数据同步
    console.log('\n【2. 数据同步检查】');
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: optimizedCount } = await supabase
      .from('orders_optimized')
      .select('*', { count: 'exact', head: true });
    
    if (ordersCount === optimizedCount) {
      checks.push('✅ 数据已同步');
      console.log(`✅ 数据同步完成 (orders: ${ordersCount}, optimized: ${optimizedCount})`);
    } else {
      checks.push(`⚠️ 数据差异: ${Math.abs(ordersCount - optimizedCount)}条`);
      console.log(`⚠️ 数据有差异 (orders: ${ordersCount}, optimized: ${optimizedCount})`);
    }
    
    // 4. 检查序列值
    console.log('\n【3. ID序列检查】');
    const { data: maxOrder } = await supabase
      .from('orders')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    const { data: maxOptimized } = await supabase
      .from('orders_optimized')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    console.log(`orders表最大ID: ${maxOrder?.id || 0}`);
    console.log(`orders_optimized表最大ID: ${maxOptimized?.id || 0}`);
    
    if (maxOrder?.id === maxOptimized?.id) {
      checks.push('✅ ID序列一致');
      console.log('✅ ID序列一致');
    } else {
      checks.push('⚠️ ID序列需要调整');
      console.log('⚠️ 建议重置序列值');
    }
    
    // 5. 检查构建文件
    console.log('\n【4. 构建文件检查】');
    const fs = require('fs');
    const buildPath = '/Users/zzj/Documents/w/client/build';
    
    if (fs.existsSync(buildPath)) {
      const stats = fs.statSync(buildPath);
      const buildTime = stats.mtime;
      const hoursSinceBuild = (Date.now() - buildTime) / (1000 * 60 * 60);
      
      if (hoursSinceBuild < 1) {
        checks.push('✅ 构建文件是最新的');
        console.log(`✅ 构建文件是最新的 (${buildTime.toLocaleString('zh-CN')})`);
      } else {
        checks.push('⚠️ 构建文件可能需要更新');
        console.log(`⚠️ 构建文件较旧 (${hoursSinceBuild.toFixed(1)}小时前)`);
      }
    } else {
      checks.push('❌ 没有构建文件');
      console.log('❌ 需要运行 npm run build');
    }
    
    // 总结
    console.log('\n========================================');
    console.log('检查结果总结');
    console.log('========================================\n');
    
    checks.forEach(check => console.log(check));
    
    const hasError = checks.some(c => c.includes('❌'));
    const hasWarning = checks.some(c => c.includes('⚠️'));
    
    console.log('\n========================================');
    console.log('部署建议');
    console.log('========================================\n');
    
    if (hasError) {
      console.log('❌ 有错误需要修复后才能部署');
    } else if (hasWarning) {
      console.log('⚠️ 有警告，建议处理后再部署：');
      console.log('\n在Supabase SQL Editor执行：');
      console.log('```sql');
      const nextId = Math.max(maxOrder?.id || 0, maxOptimized?.id || 0) + 1;
      console.log(`ALTER SEQUENCE orders_id_seq RESTART WITH ${nextId};`);
      console.log(`ALTER SEQUENCE orders_optimized_id_seq RESTART WITH ${nextId};`);
      console.log('```');
    } else {
      console.log('✅ 所有检查通过，可以部署！');
    }
    
    console.log('\n部署命令：');
    console.log('```bash');
    console.log('cd /Users/zzj/Documents/w/client');
    console.log('npm run build  # 如果需要重新构建');
    console.log('vercel --prod  # 部署到生产环境');
    console.log('```');
    
  } catch (error) {
    console.error('检查出错:', error.message);
  }
}

// 运行检查
preDeployCheck();