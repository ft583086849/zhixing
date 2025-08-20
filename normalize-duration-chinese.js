const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tfuhjtrluvjcgqjwlhze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdWhqdHJsdXZqY2dxandsaHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4MjEyNzIsImV4cCI6MjA0OTM5NzI3Mn0.lnjPJqmM0PY4pzq4fmuoIhPYkAA6yB_CoC4MHs76HQE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function normalizeDuration() {
  console.log('🔧 开始规范化duration字段为中文格式...\n');
  
  const updates = [
    {
      newValue: '7天',
      oldValues: ['7天免费', '7days', '7 days', '7日', '七天']
    },
    {
      newValue: '1个月',
      oldValues: ['1月', '1month', '1 month', '一个月', '30天', '30 days']
    },
    {
      newValue: '3个月',
      oldValues: ['3月', '3months', '3 months', '三个月', '90天', '90 days']
    },
    {
      newValue: '6个月',
      oldValues: ['6月', '6months', '6 months', '六个月', '180天', '180 days', '半年']
    },
    {
      newValue: '1年',
      oldValues: ['1year', '1 year', '一年', '12个月', '12 months', '365天', '365 days']
    }
  ];
  
  let totalUpdated = 0;
  
  for (const update of updates) {
    console.log(`\n处理: ${update.newValue}`);
    console.log('-------------------');
    
    for (const oldValue of update.oldValues) {
      // 更新记录
      const { data, error, count } = await supabase
        .from('orders_optimized')
        .update({ duration: update.newValue })
        .eq('duration', oldValue)
        .select('id');
      
      if (error) {
        console.error(`  ❌ 失败 "${oldValue}": ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`  ✅ 已更新 ${data.length} 条记录: "${oldValue}" → "${update.newValue}"`);
        totalUpdated += data.length;
      }
    }
  }
  
  console.log('\n========================================');
  console.log(`✨ 规范化完成！共更新 ${totalUpdated} 条记录`);
  console.log('========================================\n');
  
  // 验证最终结果
  console.log('验证最终的duration值分布:');
  const { data: finalData, error: finalError } = await supabase
    .from('orders_optimized')
    .select('duration')
    .not('duration', 'is', null);
  
  if (!finalError && finalData) {
    const counts = {};
    finalData.forEach(row => {
      counts[row.duration] = (counts[row.duration] || 0) + 1;
    });
    
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([value, count]) => {
        const percentage = ((count / finalData.length) * 100).toFixed(1);
        console.log(`  "${value}": ${count} 条 (${percentage}%)`);
      });
  }
}

// 执行规范化
normalizeDuration().catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});