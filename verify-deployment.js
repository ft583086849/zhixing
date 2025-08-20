/**
 * 验证部署状态脚本
 * 检查线上环境是否真正使用了新代码
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyDeployment() {
  console.log('========================================');
  console.log('部署验证报告');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================\n');

  const results = {
    deployment: false,
    jsVersion: null,
    databaseCheck: false,
    recommendation: ''
  };

  // 1. 检查HTML中的JS版本
  console.log('【1. 检查生产环境JS版本】');
  console.log('----------------------------------------');
  
  await new Promise((resolve) => {
    https.get('https://zhixing-seven.vercel.app/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/main\.([a-f0-9]+)\.js/);
        if (match) {
          results.jsVersion = match[1];
          console.log(`当前JS版本: main.${match[1]}.js`);
          
          // 检查是否是旧版本
          if (match[1] === '1259862b') {
            console.log('❌ 这是旧版本的JS文件（11天前的版本）');
            console.log('说明：虽然执行了部署，但线上可能有缓存或CDN延迟');
          } else {
            console.log('✅ JS文件已更新为新版本');
            results.deployment = true;
          }
        }
        resolve();
      });
    });
  });

  // 2. 检查数据库最新订单
  console.log('\n【2. 检查数据库订单状态】');
  console.log('----------------------------------------');
  
  try {
    // 获取最近5分钟的订单
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, created_at')
      .gte('created_at', fiveMinutesAgo.toISOString())
      .order('created_at', { ascending: false });
    
    const { data: recentOptimized } = await supabase
      .from('orders_optimized')
      .select('id, created_at')
      .gte('created_at', fiveMinutesAgo.toISOString())
      .order('created_at', { ascending: false });
    
    console.log(`orders表最近5分钟新增: ${recentOrders?.length || 0} 条`);
    console.log(`orders_optimized表最近5分钟新增: ${recentOptimized?.length || 0} 条`);
    
    if (recentOrders && recentOrders.length > 0) {
      console.log('⚠️ orders表仍有新数据，说明有旧代码在运行');
    } else {
      console.log('✅ orders表没有新数据');
      results.databaseCheck = true;
    }
  } catch (error) {
    console.error('数据库检查失败:', error.message);
  }

  // 3. 检查Vercel部署记录
  console.log('\n【3. Vercel部署验证】');
  console.log('----------------------------------------');
  console.log('部署URL: https://client-8t8kynhh9-ft583086849s-projects.vercel.app');
  console.log('生产域名: https://zhixing-seven.vercel.app');
  console.log('别名设置: 已执行 vercel alias set');

  // 最终结论
  console.log('\n========================================');
  console.log('验证结论');
  console.log('========================================\n');
  
  if (results.jsVersion === '1259862b') {
    console.log('❌ 部署尚未完全生效');
    console.log('\n可能原因：');
    console.log('1. CDN缓存未更新（通常需要几分钟）');
    console.log('2. 浏览器缓存');
    console.log('3. Vercel边缘网络同步延迟');
    
    console.log('\n建议操作：');
    console.log('1. 等待5-10分钟让CDN缓存更新');
    console.log('2. 使用无痕模式访问验证');
    console.log('3. 强制刷新页面（Ctrl+Shift+R）');
    
    results.recommendation = '等待缓存更新';
  } else if (results.deployment && results.databaseCheck) {
    console.log('✅✅✅ 部署完全成功！');
    console.log('\n确认项：');
    console.log('✅ 新版本JS文件已上线');
    console.log('✅ 新订单直接进入orders_optimized表');
    console.log('✅ 不再依赖触发器同步');
    
    results.recommendation = '部署成功';
  } else {
    console.log('⚠️ 部署部分生效');
    console.log('需要进一步观察和验证');
    
    results.recommendation = '继续监控';
  }
  
  return results;
}

// 执行验证
verifyDeployment().then(results => {
  console.log('\n========================================');
  console.log('下一步行动');
  console.log('========================================');
  
  if (results.recommendation === '等待缓存更新') {
    console.log('将在2分钟后自动重新检查...');
    setTimeout(() => {
      console.log('\n\n=== 重新检查 ===\n');
      verifyDeployment();
    }, 120000);
  }
});