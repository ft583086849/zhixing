/**
 * 初始化统计表数据脚本
 * 用于首次创建表后初始化数据
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeStats() {
  console.log('🚀 开始初始化统计表数据...\n');
  
  try {
    // 1. 检查overview_stats表是否存在
    console.log('1️⃣ 检查overview_stats表...');
    const { data: checkTable, error: checkError } = await supabase
      .from('overview_stats')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('❌ overview_stats表不存在或查询失败:', checkError.message);
      console.log('\n请先执行SQL脚本创建表：');
      console.log('在Supabase控制台的SQL编辑器中执行 database/migrations/001_create_overview_stats_tables.sql');
      return;
    }
    
    console.log('✅ overview_stats表存在');
    
    // 2. 插入初始统计记录
    console.log('\n2️⃣ 创建初始统计记录...');
    
    const periods = ['all', 'today', 'week', 'month', 'year'];
    
    for (const period of periods) {
      const { error: insertError } = await supabase
        .from('overview_stats')
        .upsert({
          stat_type: 'realtime',
          stat_period: period,
          start_date: null,
          end_date: null,
          total_orders: 0,
          today_orders: 0,
          pending_payment_orders: 0,
          confirmed_payment_orders: 0,
          pending_config_orders: 0,
          confirmed_config_orders: 0,
          rejected_orders: 0,
          active_orders: 0,
          total_amount: 0,
          today_amount: 0,
          confirmed_amount: 0,
          total_commission: 0,
          paid_commission: 0,
          pending_commission: 0,
          primary_sales_count: 0,
          secondary_sales_count: 0,
          independent_sales_count: 0,
          active_sales_count: 0,
          free_trial_orders: 0,
          one_month_orders: 0,
          three_month_orders: 0,
          six_month_orders: 0,
          yearly_orders: 0,
          free_trial_percentage: 0,
          one_month_percentage: 0,
          three_month_percentage: 0,
          six_month_percentage: 0,
          yearly_percentage: 0,
          last_calculated_at: new Date().toISOString(),
          calculation_duration_ms: 0,
          data_version: 1
        }, {
          onConflict: 'stat_type,stat_period,start_date,end_date',
          ignoreDuplicates: false
        });
      
      if (insertError) {
        console.error(`❌ 创建${period}统计记录失败:`, insertError.message);
      } else {
        console.log(`✅ 创建${period}统计记录成功`);
      }
    }
    
    // 3. 触发首次数据更新
    console.log('\n3️⃣ 触发数据更新...');
    console.log('数据更新功能需要在应用中触发，或等待自动更新（每5分钟）');
    
    // 4. 验证数据
    console.log('\n4️⃣ 验证数据...');
    const { data: stats, error: statsError } = await supabase
      .from('overview_stats')
      .select('stat_period, last_calculated_at')
      .eq('stat_type', 'realtime');
    
    if (stats && stats.length > 0) {
      console.log('\n📊 统计表初始化成功！当前记录：');
      stats.forEach(stat => {
        console.log(`  - ${stat.stat_period}: 最后更新 ${stat.last_calculated_at}`);
      });
    }
    
    console.log('\n✨ 初始化完成！');
    console.log('\n下一步：');
    console.log('1. 访问 http://localhost:3000/admin/overview');
    console.log('2. 打开浏览器控制台查看日志');
    console.log('3. 应该看到"使用新的统计方式"的提示');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  }
}

// 执行初始化
initializeStats();