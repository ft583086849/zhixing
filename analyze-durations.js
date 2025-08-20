const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDurations() {
  console.log('📊 分析当前购买时长数据分布...\n');
  
  // 查询orders_optimized表中的所有唯一duration值
  const { data, error } = await supabase
    .from('orders_optimized')
    .select('duration');
    
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  // 统计各种duration值的分布
  const durationCounts = {};
  data.forEach(row => {
    const duration = row.duration;
    if (duration !== null && duration !== undefined) {
      if (!durationCounts[duration]) {
        durationCounts[duration] = 0;
      }
      durationCounts[duration]++;
    }
  });
  
  console.log('当前duration字段的值分布:');
  Object.entries(durationCounts).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).forEach(([duration, count]) => {
    console.log(`  ${duration}个月: ${count}条记录`);
  });
  
  console.log('\n需要规范化为:');
  console.log('  0.25 (7天)');
  console.log('  3 (3个月)');
  console.log('  6 (6个月)');
  console.log('  12 (1年)');
  
  console.log('\n映射规则:');
  console.log('  1个月 -> 0.25 (7天)');
  console.log('  2个月 -> 3 (3个月)');
  console.log('  3个月 -> 3 (3个月)');
  console.log('  4-5个月 -> 6 (6个月)');
  console.log('  6个月 -> 6 (6个月)');
  console.log('  7-11个月 -> 12 (1年)');
  console.log('  12个月及以上 -> 12 (1年)');
}

analyzeDurations();