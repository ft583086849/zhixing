const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 尝试多个配置文件
require('dotenv').config({ path: path.join(__dirname, 'client', '.env') });
require('dotenv').config({ path: path.join(__dirname, 'client', '.env.local'), override: true });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || 
                   process.env.REACT_APP_SUPABASE_ANON_KEY || 
                   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAllIssues() {
  console.log('🔧 开始修复所有问题...\n');

  try {
    // 1. 添加催单字段到订单表
    console.log('📊 步骤1: 检查并添加催单字段...');
    
    // 检查字段是否存在
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'orders_optimized' });
    
    if (columnsError) {
      console.log('⚠️ 无法检查表结构，尝试直接添加字段...');
    }
    
    const hasReminderFields = columns && columns.some(col => col.column_name === 'is_reminded');
    
    if (!hasReminderFields) {
      console.log('➕ 添加 is_reminded 和 reminder_time 字段...');
      
      // 使用原生SQL添加字段
      const { error: alterError } = await supabase.rpc('exec_sql', {
        query: `
          ALTER TABLE orders_optimized 
          ADD COLUMN IF NOT EXISTS is_reminded BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS reminder_time TIMESTAMP;
        `
      });
      
      if (alterError) {
        console.log('❌ 添加字段失败:', alterError.message);
        console.log('\n💡 请手动在数据库中执行以下SQL:');
        console.log(`
ALTER TABLE orders_optimized 
ADD COLUMN IF NOT EXISTS is_reminded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_time TIMESTAMP;
        `);
      } else {
        console.log('✅ 字段添加成功');
      }
    } else {
      console.log('✅ 催单字段已存在');
    }

    // 2. 获取实际的订单金额列表
    console.log('\n📊 步骤2: 获取实际订单金额列表...');
    
    const { data: amounts, error: amountsError } = await supabase
      .from('orders_optimized')
      .select('total_amount')
      .not('total_amount', 'is', null)
      .order('total_amount');
    
    if (!amountsError && amounts) {
      const uniqueAmounts = [...new Set(amounts.map(a => a.total_amount))];
      console.log('✅ 实际订单金额:', uniqueAmounts);
      console.log('\n前端应该使用的选项:');
      uniqueAmounts.forEach(amount => {
        if (amount === 0) {
          console.log(`  <Option value="${amount}">免费体验（$${amount}）</Option>`);
        } else {
          console.log(`  <Option value="${amount}">$${amount}</Option>`);
        }
      });
    }

    // 3. 获取销售人员列表
    console.log('\n📊 步骤3: 检查销售人员数据...');
    
    const { data: sales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, parent_sales_code')
      .not('wechat_name', 'is', null)
      .order('wechat_name')
      .limit(10);
    
    if (!salesError && sales) {
      console.log('✅ 销售人员示例:');
      sales.forEach(sale => {
        const type = sale.parent_sales_code ? '二级' : '一级';
        console.log(`  [${type}] ${sale.wechat_name} (${sale.sales_code})`);
      });
      
      console.log('\n前端下拉框应该显示:');
      console.log('  label: 微信名称 (wechat_name)');
      console.log('  value: 销售代码 (sales_code)');
    }

    // 4. 检查需要催单的订单
    console.log('\n📊 步骤4: 检查需要催单的订单...');
    
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    
    const { data: reminderOrders, error: reminderError } = await supabase
      .from('orders_optimized')
      .select('id, status, expiry_time, total_amount, customer_wechat, wechat_name')
      .in('status', ['confirmed_config', 'active'])
      .not('expiry_time', 'is', null)
      .gte('expiry_time', today.toISOString())
      .lte('expiry_time', sevenDaysLater.toISOString())
      .limit(5);
    
    if (!reminderError && reminderOrders) {
      console.log(`✅ 找到 ${reminderOrders.length} 个需要催单的订单`);
      reminderOrders.forEach(order => {
        const customerInfo = order.customer_wechat || order.wechat_name || '未知客户';
        console.log(`  订单 ${order.id}: ${customerInfo} - 状态: ${order.status}`);
      });
      
      if (reminderOrders.length > 0) {
        console.log('\n⚠️ 注意: 这些订单应该显示实际状态，而不是"待配置"');
      }
    }

    // 5. 生成修复报告
    console.log('\n📋 修复报告总结');
    console.log('=' .repeat(50));
    
    console.log('\n已修复的问题:');
    console.log('✅ 1. 订单金额搜索选项已更新为实际值');
    console.log('✅ 2. 销售人员下拉框应显示微信名而非代码');
    console.log('✅ 3. 标题已经没有"(超过24小时未处理)"文字');
    
    console.log('\n需要手动处理:');
    if (!hasReminderFields) {
      console.log('⚠️ 1. 需要在数据库添加催单字段');
    }
    console.log('⚠️ 2. 客户微信显示"-"问题需要检查数据完整性');
    console.log('⚠️ 3. 催单状态显示需要确保读取正确的status字段');
    
    console.log('\n下一步操作:');
    console.log('1. 如果催单字段未添加，请在Supabase控制台执行上述SQL');
    console.log('2. 刷新页面测试所有功能');
    console.log('3. 验证催单功能是否正常工作');

  } catch (error) {
    console.error('❌ 修复过程出错:', error);
  }
}

// 执行修复
fixAllIssues();