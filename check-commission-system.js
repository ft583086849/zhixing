const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkCommissionSystem() {
  console.log('========== 系统佣金体系完整说明 ==========\n');
  
  try {
    // 1. 查看销售的佣金率配置
    console.log('1. 销售佣金率配置');
    console.log('==================');
    const { data: sales } = await supabase
      .from('sales_optimized')
      .select('sales_code, name, sales_type, commission_rate, parent_sales_code')
      .order('sales_type', { ascending: true })
      .limit(10);
    
    console.log('销售类型和佣金率:');
    sales?.forEach(s => {
      console.log(`  ${s.sales_code}: ${s.name || '未命名'}`);
      console.log(`    类型: ${s.sales_type || 'null(直销)'}, 佣金率: ${(s.commission_rate * 100).toFixed(1)}%`);
      if (s.parent_sales_code) {
        console.log(`    上级: ${s.parent_sales_code}`);
      }
    });
    
    // 2. 查看订单391的实际佣金计算
    console.log('\n\n2. 订单391的佣金计算');
    console.log('===================');
    const { data: order391 } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('id', 391)
      .single();
    
    if (order391) {
      console.log('订单信息:');
      console.log(`  订单号: ${order391.order_number}`);
      console.log(`  销售代码: ${order391.sales_code}`);
      console.log(`  销售类型: ${order391.sales_type}`);
      console.log(`  订单金额: ${order391.amount}`);
      console.log(`  实付金额: ${order391.actual_payment_amount || 'null'}`);
      console.log(`  总金额: ${order391.total_amount}`);
      console.log(`  佣金率: ${(order391.commission_rate * 100).toFixed(1)}%`);
      console.log(`  佣金金额: ${order391.commission_amount}`);
      console.log(`  订单状态: ${order391.status}`);
      
      // 获取销售的佣金率
      const { data: salesInfo } = await supabase
        .from('sales_optimized')
        .select('commission_rate, sales_type')
        .eq('sales_code', order391.sales_code)
        .single();
      
      console.log('\n销售配置:');
      console.log(`  销售佣金率: ${(salesInfo?.commission_rate * 100).toFixed(1)}%`);
      console.log(`  销售类型: ${salesInfo?.sales_type}`);
      
      console.log('\n佣金计算分析:');
      const expectedCommission = order391.amount * salesInfo?.commission_rate;
      console.log(`  应得佣金 = 订单金额 × 佣金率`);
      console.log(`  ${expectedCommission.toFixed(2)} = ${order391.amount} × ${salesInfo?.commission_rate}`);
      console.log(`  实际佣金: ${order391.commission_amount}`);
      
      if (Math.abs(expectedCommission - order391.commission_amount) > 0.01) {
        console.log(`  ⚠️ 佣金不匹配！差额: ${(order391.commission_amount - expectedCommission).toFixed(2)}`);
        console.log('\n  需要修复：将佣金从 88.88 改回正确的 635.2');
      } else {
        console.log(`  ✅ 佣金计算正确`);
      }
    }
    
    console.log('\n\n========== 佣金体系说明 ==========');
    console.log('\n【佣金计算规则】');
    console.log('1. 佣金率存储在 sales_optimized 表的 commission_rate 字段');
    console.log('2. 一级销售(primary)默认佣金率: 40%');
    console.log('3. 二级销售(secondary)默认佣金率: 25%');
    console.log('4. 独立销售默认佣金率: 25%');
    
    console.log('\n【佣金计算触发器 trg_calculate_order_commission】');
    console.log('触发时机: 订单创建时(BEFORE INSERT)');
    console.log('计算逻辑:');
    console.log('  - 只有 status = "confirmed_config" 的订单才有佣金');
    console.log('  - 佣金金额 = 实付金额(或订单金额) × 佣金率');
    console.log('  - 从 sales_optimized 表获取销售的佣金率');
    
    console.log('\n【佣金更新触发器 trg_update_order_commission_on_status】');
    console.log('触发时机: 订单状态更新时(BEFORE UPDATE OF status)');
    console.log('更新逻辑:');
    console.log('  - status = "rejected" 时，佣金清零');
    console.log('  - 拒绝状态是终态，不能恢复');
    
    console.log('\n【统计更新触发器 update_sales_statistics】');
    console.log('作用: 自动更新销售统计表(sales_optimized)的佣金汇总');
    console.log('更新逻辑(按用户要求):');
    console.log('  - INSERT: 总佣金 += 订单佣金');
    console.log('  - UPDATE: ');
    console.log('    * 如果订单金额改了 → 重新计算佣金');
    console.log('    * 如果之前没算进去 → 加上佣金');
    console.log('    * 如果已经算了 → 佣金不变');
    console.log('  - DELETE: 总佣金 -= 订单佣金');
    
    console.log('\n【问题总结】');
    console.log('订单391存在的问题:');
    console.log('  1. 我测试时错误地将佣金从 635.2 改成了 88.88');
    console.log('  2. 正确的佣金应该是: 1588 × 0.4 = 635.2元');
    console.log('  3. total_amount = 0 (应该等于 amount = 1588)');
    
    // 修复订单391
    console.log('\n\n3. 修复订单391的数据');
    console.log('====================');
    const { error: fixError } = await supabase
      .from('orders_optimized')
      .update({
        commission_amount: 635.2,  // 恢复正确的佣金
        total_amount: 1588  // 修复总金额
      })
      .eq('id', 391);
    
    if (!fixError) {
      console.log('✅ 已修复订单391:');
      console.log('   - 佣金恢复为: 635.2元');
      console.log('   - 总金额修复为: 1588元');
    } else {
      console.log('❌ 修复失败:', fixError.message);
    }
    
  } catch (error) {
    console.error('检查出错:', error);
  }
  
  console.log('\n========== 完成 ==========');
  process.exit(0);
}

checkCommissionSystem();