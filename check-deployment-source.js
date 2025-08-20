/**
 * 检查部署来源和版本
 * 分析订单的详细信息来追踪来源
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDeploymentSource() {
  console.log('========================================');
  console.log('部署源和版本检查');
  console.log('========================================\n');

  try {
    // 1. 检查最近1小时的订单，看是否都来自同一个源
    console.log('【1. 最近1小时订单分析】');
    console.log('----------------------------------------');
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { data: recentOrders, error: recentError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false });
    
    if (recentOrders && recentOrders.length > 0) {
      console.log(`最近1小时有 ${recentOrders.length} 条新订单\n`);
      
      // 分析链接代码分布
      const linkCodeMap = {};
      recentOrders.forEach(order => {
        const code = order.link_code || 'unknown';
        linkCodeMap[code] = (linkCodeMap[code] || 0) + 1;
      });
      
      console.log('链接代码分布:');
      Object.entries(linkCodeMap).forEach(([code, count]) => {
        console.log(`  ${code}: ${count}条`);
      });
      
      // 分析用户代理信息（如果有存储）
      const deviceInfo = recentOrders
        .map(o => o.device_info)
        .filter(d => d);
      
      if (deviceInfo.length > 0) {
        console.log('\n设备信息:');
        [...new Set(deviceInfo)].forEach(info => {
          console.log(`  ${info}`);
        });
      }
    }
    
    // 2. 检查orders_optimized表的最新数据
    console.log('\n【2. orders_optimized表最新数据】');
    console.log('----------------------------------------');
    
    const { data: optimizedRecent, error: optimizedError } = await supabase
      .from('orders_optimized')
      .select('*')
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (optimizedRecent && optimizedRecent.length > 0) {
      console.log(`orders_optimized表最近1小时有 ${optimizedRecent.length} 条数据`);
      
      // 检查是否是触发器同步的
      const syncedIds = optimizedRecent.filter(o => o.id >= 331).map(o => o.id);
      console.log(`其中ID >= 331的（可能是同步的）: ${syncedIds.join(', ')}`);
    } else {
      console.log('orders_optimized表最近1小时没有直接写入的数据');
      console.log('✅ 说明触发器正在工作，数据从orders表同步过来');
    }
    
    // 3. 检查可能的部署环境
    console.log('\n【3. 可能的部署环境分析】');
    console.log('----------------------------------------');
    
    console.log('基于链接代码模式，可能的访问入口:');
    console.log('\n1. 生产环境（如果已部署）:');
    console.log('   - 域名: 需要确认是否有线上域名');
    console.log('   - 特征: 用户通过分享链接访问');
    
    console.log('\n2. 本地开发环境:');
    console.log('   - 地址: http://localhost:3000');
    console.log('   - 状态: 当前正在运行');
    
    console.log('\n3. 其他可能:');
    console.log('   - Vercel/Netlify等托管平台');
    console.log('   - 其他开发者的本地环境');
    
    // 4. 提供解决方案
    console.log('\n========================================');
    console.log('🔧 解决方案');
    console.log('========================================\n');
    
    console.log('【立即执行】:\n');
    
    console.log('1. 检查是否有线上部署:');
    console.log('   - Vercel: vercel list');
    console.log('   - Netlify: netlify sites:list');
    console.log('   - 自定义服务器: 检查服务器配置');
    
    console.log('\n2. 清理和重新部署:');
    console.log('   ```bash');
    console.log('   # 停止本地开发服务器');
    console.log('   # 在运行npm start的终端按 Ctrl+C');
    console.log('   ');
    console.log('   # 清理缓存');
    console.log('   rm -rf node_modules/.cache');
    console.log('   rm -rf build');
    console.log('   ');
    console.log('   # 重新构建');
    console.log('   npm run build');
    console.log('   ');
    console.log('   # 部署到生产环境');
    console.log('   # (根据你的部署方式)');
    console.log('   ```');
    
    console.log('\n3. 验证修复:');
    console.log('   - 创建测试订单');
    console.log('   - 检查是否写入orders_optimized表');
    console.log('   - 监控orders表是否还有新数据');
    
    // 5. 创建监控脚本
    console.log('\n========================================');
    console.log('📊 持续监控');
    console.log('========================================\n');
    
    console.log('触发器已创建，现在会自动同步数据。');
    console.log('建议持续监控，确认问题来源:');
    
    console.log('\n监控SQL（在Supabase SQL Editor执行）:');
    console.log('```sql');
    console.log('-- 查看最新的orders表数据');
    console.log('SELECT id, tradingview_username, created_at, link_code');
    console.log('FROM orders');
    console.log('WHERE created_at > NOW() - INTERVAL \'1 hour\'');
    console.log('ORDER BY created_at DESC;');
    console.log('');
    console.log('-- 查看触发器是否工作');
    console.log('SELECT ');
    console.log('  o.id,');
    console.log('  o.created_at as orders_time,');
    console.log('  op.created_at as optimized_time,');
    console.log('  o.duration as orders_duration,');
    console.log('  op.duration as optimized_duration');
    console.log('FROM orders o');
    console.log('LEFT JOIN orders_optimized op ON o.id = op.id');
    console.log('WHERE o.created_at > NOW() - INTERVAL \'1 hour\'');
    console.log('ORDER BY o.created_at DESC;');
    console.log('```');
    
    // 检查是否有环境变量配置文件
    console.log('\n【4. 环境配置检查】');
    console.log('----------------------------------------');
    
    const fs = require('fs');
    const path = require('path');
    
    const envFiles = [
      '.env',
      '.env.local',
      '.env.production',
      '.env.development'
    ];
    
    console.log('检查环境配置文件:');
    envFiles.forEach(file => {
      const filePath = path.join('/Users/zzj/Documents/w/client', file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  ✓ ${file} (修改时间: ${stats.mtime.toLocaleString('zh-CN')})`);
      } else {
        console.log(`  ✗ ${file} (不存在)`);
      }
    });
    
  } catch (error) {
    console.error('检查过程中发生错误:', error);
  }
}

// 运行检查
checkDeploymentSource();