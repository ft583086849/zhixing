const SupabaseService = require('./client/src/services/supabase.js');
const { adminAPI } = require('./client/src/services/api.js');

async function testPerformance() {
  console.log('🚀 开始性能测试...\n');
  console.log('='.repeat(50));
  
  const tests = [
    {
      name: '订单列表查询',
      fn: async () => {
        const start = Date.now();
        const { data } = await SupabaseService.supabase
          .from('orders')
          .select('*')
          .limit(100);
        return Date.now() - start;
      }
    },
    {
      name: '销售统计查询（从统计表）',
      fn: async () => {
        const start = Date.now();
        const { data } = await SupabaseService.supabase
          .from('sales_statistics')
          .select('*');
        return Date.now() - start;
      }
    },
    {
      name: '数据概览查询（从统计表）',
      fn: async () => {
        const start = Date.now();
        const { data } = await SupabaseService.supabase
          .from('overview_stats')
          .select('*')
          .eq('stat_type', 'realtime')
          .eq('stat_period', 'all')
          .single();
        return Date.now() - start;
      }
    },
    {
      name: '财务统计查询',
      fn: async () => {
        const start = Date.now();
        const { data } = await SupabaseService.supabase
          .from('finance_daily_stats')
          .select('*')
          .order('stat_date', { ascending: false })
          .limit(30);
        return Date.now() - start;
      }
    },
    {
      name: '佣金记录查询',
      fn: async () => {
        const start = Date.now();
        const { data } = await SupabaseService.supabase
          .from('commission_records')
          .select('*')
          .eq('status', 'pending')
          .limit(50);
        return Date.now() - start;
      }
    },
    {
      name: 'API getStats方法',
      fn: async () => {
        const start = Date.now();
        await adminAPI.getStats({ timeRange: 'all' });
        return Date.now() - start;
      }
    },
    {
      name: 'API getSales方法',
      fn: async () => {
        const start = Date.now();
        await adminAPI.getSales({});
        return Date.now() - start;
      }
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    process.stdout.write(`测试 ${test.name}...`);
    
    try {
      // 运行3次取平均值
      const times = [];
      for (let i = 0; i < 3; i++) {
        const time = await test.fn();
        times.push(time);
      }
      
      const avgTime = Math.round(times.reduce((a, b) => a + b) / times.length);
      const status = avgTime < 500 ? '✅ 优秀' : avgTime < 1000 ? '⚠️ 一般' : '❌ 较慢';
      
      console.log(` ${status} (${avgTime}ms)`);
      
      results.push({
        test: test.name,
        avgTime,
        status
      });
      
    } catch (error) {
      console.log(` ❌ 失败`);
      results.push({
        test: test.name,
        avgTime: -1,
        status: '失败'
      });
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 性能测试结果汇总\n');
  
  console.table(results);
  
  const avgTotal = results
    .filter(r => r.avgTime > 0)
    .reduce((sum, r) => sum + r.avgTime, 0) / results.filter(r => r.avgTime > 0).length;
    
  console.log(`\n整体平均响应时间: ${Math.round(avgTotal)}ms`);
  
  if (avgTotal < 500) {
    console.log('🎉 性能优秀！');
  } else if (avgTotal < 1000) {
    console.log('⚠️ 性能一般，建议继续优化');
  } else {
    console.log('❌ 性能较差，需要优化');
  }
  
  process.exit(0);
}

testPerformance();