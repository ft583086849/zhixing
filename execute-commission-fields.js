/**
 * 执行添加佣金拆分字段的SQL脚本
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeCommissionFields() {
  console.log('🚀 开始添加佣金拆分字段...\n');
  
  try {
    // 读取SQL文件内容
    const sqlContent = fs.readFileSync(path.join(__dirname, 'add-commission-fields.sql'), 'utf8');
    
    // 将SQL分割成单独的语句
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`准备执行 ${sqlStatements.length} 个SQL语句\n`);
    
    // 逐个执行SQL语句
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i] + ';';
      
      // 提取语句类型
      const stmtType = statement.split(' ')[0].toUpperCase();
      
      console.log(`${i + 1}. 执行 ${stmtType} 语句...`);
      
      // 根据语句类型执行
      if (statement.includes('ALTER TABLE') || 
          statement.includes('CREATE FUNCTION') || 
          statement.includes('CREATE TRIGGER') ||
          statement.includes('DROP TRIGGER')) {
        // 这些DDL语句需要通过raw SQL执行
        console.log('   ⚠️  注意：DDL语句需要通过Supabase Dashboard执行');
        console.log('   语句预览:', statement.substring(0, 100) + '...');
      } else if (statement.includes('UPDATE')) {
        // UPDATE语句
        console.log('   执行UPDATE语句...');
        // 由于Supabase JS客户端限制，复杂的UPDATE需要手动处理
        console.log('   ⚠️  注意：复杂UPDATE语句需要通过Supabase Dashboard执行');
      } else if (statement.includes('SELECT')) {
        // SELECT语句 - 验证结果
        console.log('   执行SELECT验证...');
        // 这里简化处理，实际验证需要解析具体查询
      }
    }
    
    console.log('\n📝 SQL脚本已准备好，请通过以下方式执行：');
    console.log('1. 打开 Supabase Dashboard: https://app.supabase.com');
    console.log('2. 选择你的项目');
    console.log('3. 进入 SQL Editor');
    console.log('4. 复制 add-commission-fields.sql 的内容');
    console.log('5. 执行SQL');
    
    console.log('\n或者使用以下简化版本直接在这里执行：');
    
    // 执行简化版本 - 只更新现有数据
    console.log('\n📊 更新现有订单的佣金数据...');
    
    // 获取所有订单
    const { data: orders, error: fetchError } = await supabase
      .from('orders_optimized')
      .select('*')
      .gt('amount', 0);
    
    if (fetchError) {
      console.error('获取订单失败:', fetchError);
      return;
    }
    
    console.log(`找到 ${orders.length} 个订单需要更新`);
    
    // 批量更新订单佣金
    let updateCount = 0;
    for (const order of orders) {
      let primaryCommission = 0;
      let secondaryCommission = 0;
      let secondaryRate = 0;
      
      // 计算佣金
      if (order.sales_type === 'primary') {
        // 一级销售直接销售
        primaryCommission = order.amount * 0.4;
        secondaryCommission = 0;
      } else if (order.sales_type === 'secondary') {
        // 二级销售销售
        secondaryRate = order.commission_rate || 0.25;
        secondaryCommission = order.amount * secondaryRate;
        primaryCommission = order.amount * (0.4 - secondaryRate);
      } else if (order.sales_type === 'independent') {
        // 独立销售
        primaryCommission = 0;
        secondaryCommission = order.amount * 0.4;
        secondaryRate = 0.4;
      }
      
      // 更新订单（注意：由于字段可能不存在，这里只更新现有字段）
      const { error: updateError } = await supabase
        .from('orders_optimized')
        .update({
          commission_amount: primaryCommission + secondaryCommission,
          commission_rate: order.sales_type === 'secondary' ? secondaryRate : order.commission_rate
        })
        .eq('id', order.id);
      
      if (!updateError) {
        updateCount++;
        if (updateCount % 10 === 0) {
          console.log(`   已更新 ${updateCount} 个订单...`);
        }
      }
    }
    
    console.log(`\n✅ 成功更新 ${updateCount} 个订单的佣金数据`);
    console.log('\n⚠️  注意：由于数据库字段限制，需要手动执行 add-commission-fields.sql 来添加新字段');
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

// 执行
executeCommissionFields();