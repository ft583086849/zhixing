/**
 * 生产环境部署效果验证脚本
 * 全面测试线上环境是否正确使用orders_optimized表
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 彩色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyDeployment() {
  log('\n========================================', 'cyan');
  log('🚀 生产环境部署验证', 'cyan');
  log(`时间: ${new Date().toLocaleString('zh-CN')}`, 'cyan');
  log('========================================\n', 'cyan');

  const results = {
    jsVersion: false,
    codeContent: false,
    dataFlow: false,
    performance: false
  };

  // 1. 验证JS文件版本
  log('【1. 检查线上JS版本】', 'blue');
  log('----------------------------------------');
  
  try {
    const htmlContent = await new Promise((resolve, reject) => {
      https.get('https://zhixing-seven.vercel.app/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });
    });

    const jsMatch = htmlContent.match(/main\.([a-f0-9]+)\.js/);
    if (jsMatch) {
      log(`JS文件版本: main.${jsMatch[1]}.js`, 'green');
      
      // 检查是否是旧版本
      if (jsMatch[1] === '1259862b') {
        log('❌ 还是旧版本！', 'red');
      } else {
        log('✅ 已更新为新版本', 'green');
        results.jsVersion = true;
      }
    }
  } catch (error) {
    log(`❌ 获取页面失败: ${error.message}`, 'red');
  }

  // 2. 验证代码内容
  log('\n【2. 验证代码内容】', 'blue');
  log('----------------------------------------');
  
  try {
    const jsContent = await new Promise((resolve, reject) => {
      https.get('https://zhixing-seven.vercel.app/static/js/main.75f07a9e.js', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });
    });

    const ordersCount = (jsContent.match(/orders"/g) || []).length;
    const optimizedCount = (jsContent.match(/orders_optimized/g) || []).length;
    
    log(`"orders"表引用: ${ordersCount} 次`);
    log(`"orders_optimized"表引用: ${optimizedCount} 次`);
    
    if (optimizedCount > 0) {
      log('✅ 代码中使用了orders_optimized表', 'green');
      results.codeContent = true;
    } else {
      log('❌ 代码中没有找到orders_optimized', 'red');
    }

    // 检查关键函数
    const hasCreateOrder = jsContent.includes('createOrder');
    const hasUpdateStatus = jsContent.includes('updateOrderStatus');
    log(`\n关键函数检查:`);
    log(`createOrder函数: ${hasCreateOrder ? '✅' : '❌'}`);
    log(`updateOrderStatus函数: ${hasUpdateStatus ? '✅' : '❌'}`);
    
  } catch (error) {
    log(`❌ 获取JS文件失败: ${error.message}`, 'red');
  }

  // 3. 验证数据流向
  log('\n【3. 数据流向验证】', 'blue');
  log('----------------------------------------');
  
  try {
    // 获取两表的最新记录
    const startTime = Date.now();
    
    const { data: ordersLatest } = await supabase
      .from('orders')
      .select('id, created_at, tradingview_username')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const { data: optimizedLatest } = await supabase
      .from('orders_optimized')
      .select('id, created_at, tradingview_username')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (ordersLatest && optimizedLatest) {
      const ordersTime = new Date(ordersLatest.created_at);
      const optimizedTime = new Date(optimizedLatest.created_at);
      
      log(`orders表最新订单:`);
      log(`  ID: ${ordersLatest.id}, 用户: ${ordersLatest.tradingview_username}`);
      log(`  时间: ${ordersTime.toLocaleString('zh-CN')}`);
      
      log(`\norders_optimized表最新订单:`);
      log(`  ID: ${optimizedLatest.id}, 用户: ${optimizedLatest.tradingview_username}`);
      log(`  时间: ${optimizedTime.toLocaleString('zh-CN')}`);
      
      const timeDiff = optimizedTime - ordersTime;
      if (timeDiff > 0) {
        log(`\n✅ orders_optimized表有更新的数据（领先${Math.round(timeDiff/1000)}秒）`, 'green');
        log('说明新订单直接进入orders_optimized表！', 'green');
        results.dataFlow = true;
      } else if (ordersLatest.id === optimizedLatest.id) {
        log('\n⚠️ 两表数据同步，可能是触发器在工作', 'yellow');
      } else {
        log('\n❌ orders表有更新数据，可能还在使用旧代码', 'red');
      }
    }
    
    // 检查最近5分钟的数据
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const { count: recentOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fiveMinutesAgo.toISOString());
    
    const { count: recentOptimizedCount } = await supabase
      .from('orders_optimized')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fiveMinutesAgo.toISOString());
    
    log(`\n最近5分钟数据统计:`);
    log(`orders表新增: ${recentOrdersCount || 0} 条`);
    log(`orders_optimized表新增: ${recentOptimizedCount || 0} 条`);
    
    if (recentOrdersCount === 0 && recentOptimizedCount === 0) {
      log('（暂无新订单，需要等待用户下单验证）', 'yellow');
    }
    
  } catch (error) {
    log(`❌ 数据库查询失败: ${error.message}`, 'red');
  }

  // 4. 性能测试
  log('\n【4. 查询性能对比】', 'blue');
  log('----------------------------------------');
  
  try {
    // 测试orders表查询速度
    const ordersStart = Date.now();
    await supabase
      .from('orders')
      .select('*')
      .limit(100);
    const ordersTime = Date.now() - ordersStart;
    
    // 测试orders_optimized表查询速度
    const optimizedStart = Date.now();
    await supabase
      .from('orders_optimized')
      .select('*')
      .limit(100);
    const optimizedTime = Date.now() - optimizedStart;
    
    log(`orders表查询100条: ${ordersTime}ms`);
    log(`orders_optimized表查询100条: ${optimizedTime}ms`);
    
    const improvement = ((ordersTime - optimizedTime) / ordersTime * 100).toFixed(1);
    if (optimizedTime < ordersTime) {
      log(`✅ 性能提升: ${improvement}%`, 'green');
      results.performance = true;
    } else {
      log(`⚠️ 性能相当`, 'yellow');
    }
    
  } catch (error) {
    log(`❌ 性能测试失败: ${error.message}`, 'red');
  }

  // 5. 总结
  log('\n========================================', 'cyan');
  log('📊 验证结果总结', 'cyan');
  log('========================================\n', 'cyan');
  
  const passedTests = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  
  log(`通过测试: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    log('\n🎉🎉🎉 部署完全成功！', 'green');
    log('所有测试项全部通过', 'green');
    log('新订单将直接进入orders_optimized表', 'green');
  } else if (passedTests >= totalTests * 0.7) {
    log('\n✅ 部署基本成功', 'yellow');
    log('大部分功能正常，建议继续观察', 'yellow');
  } else {
    log('\n❌ 部署可能有问题', 'red');
    log('请检查部署日志和配置', 'red');
  }

  // 给出建议
  log('\n【下一步建议】', 'blue');
  log('----------------------------------------');
  if (results.dataFlow) {
    log('1. ✅ 数据流向正确，可以正常使用');
  } else {
    log('1. ⚠️ 建议创建测试订单验证数据流向');
  }
  log('2. 持续监控orders表是否还有新数据进入');
  log('3. 可以考虑禁用或删除数据库触发器');
  log('4. 定期检查两表数据一致性');

  return results;
}

// 执行验证
console.log('开始验证生产环境部署效果...\n');
verifyDeployment().then(results => {
  console.log('\n验证完成！');
  
  // 如果需要持续监控
  if (!results.dataFlow) {
    console.log('\n将在30秒后重新检查...');
    setTimeout(() => {
      console.log('\n=== 第二次验证 ===');
      verifyDeployment();
    }, 30000);
  }
}).catch(error => {
  console.error('验证脚本执行失败:', error);
});