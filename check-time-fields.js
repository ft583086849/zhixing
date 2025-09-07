const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dqfhtpfzlxvjjfdfspkn.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZmh0cGZ6bHh2ampmZGZzcGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NjA3MjYsImV4cCI6MjA1MTQzNjcyNn0.vZA5mPWKJzEKoI8M1E-4nCKoOeVNRvwMJNczJ8dRN0o';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('正在查询orders_optimized表的时间字段情况...');

async function checkTimeFields() {
  try {
    const { data, error } = await supabase
      .from('orders_optimized')
      .select('id, sales_code, status, duration, effective_time, expiry_time, config_time, payment_time, created_at')
      .order('created_at', { ascending: false })
      .limit(15);
    
    if (error) {
      console.error('查询失败:', error);
      return;
    }
    
    console.log('\n==== 最近15个订单的时间字段情况 ====');
    data.forEach((order, index) => {
      console.log(`${index + 1}. 订单ID: ${order.id} | 状态: ${order.status} | 时长: ${order.duration}`);
      console.log(`   销售代码: ${order.sales_code}`);
      console.log(`   创建时间: ${order.created_at}`);
      console.log(`   付款时间: ${order.payment_time || '未设置'}`);
      console.log(`   配置时间: ${order.config_time || '未设置'}`);
      console.log(`   生效时间: ${order.effective_time || '未设置'}`);
      console.log(`   到期时间: ${order.expiry_time || '未设置'}`);
      console.log('   ---');
    });
    
    // 统计各字段为空的情况
    const stats = {
      effective_time_empty: data.filter(o => !o.effective_time).length,
      expiry_time_empty: data.filter(o => !o.expiry_time).length,
      config_time_empty: data.filter(o => !o.config_time).length,
      payment_time_empty: data.filter(o => !o.payment_time).length,
      total: data.length
    };
    
    console.log('\n==== 时间字段统计 ====');
    console.log(`生效时间为空: ${stats.effective_time_empty}/${stats.total} (${(stats.effective_time_empty/stats.total*100).toFixed(1)}%)`);
    console.log(`到期时间为空: ${stats.expiry_time_empty}/${stats.total} (${(stats.expiry_time_empty/stats.total*100).toFixed(1)}%)`);
    console.log(`配置时间为空: ${stats.config_time_empty}/${stats.total} (${(stats.config_time_empty/stats.total*100).toFixed(1)}%)`);
    console.log(`付款时间为空: ${stats.payment_time_empty}/${stats.total} (${(stats.payment_time_empty/stats.total*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('执行出错:', error);
  }
}

checkTimeFields();