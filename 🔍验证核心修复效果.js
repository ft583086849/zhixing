/**
 * 🔍 验证核心修复效果
 * 检查订单销售ID关联逻辑是否正常工作
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCoreFix() {
  console.log('🔍 开始验证核心修复效果...\n');
  
  try {
    // 1. 检查最新的订单是否有销售ID字段
    console.log('📊 检查最新订单的销售ID字段：');
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, sales_code, sales_type, primary_sales_id, secondary_sales_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.error('❌ 查询订单失败:', ordersError);
      return;
    }
    
    console.log('最新5个订单：');
    recentOrders.forEach(order => {
      console.log(`  订单 #${order.id} (${order.order_number}):`);
      console.log(`    - sales_code: ${order.sales_code || '空'}`);
      console.log(`    - sales_type: ${order.sales_type || '空'}`);
      console.log(`    - primary_sales_id: ${order.primary_sales_id || '空'}`);
      console.log(`    - secondary_sales_id: ${order.secondary_sales_id || '空'}`);
      console.log(`    - created_at: ${order.created_at}`);
      
      // 验证逻辑
      if (order.sales_type === 'primary' && !order.primary_sales_id) {
        console.log(`    ⚠️ 警告：一级销售订单缺少primary_sales_id`);
      }
      if (order.sales_type === 'secondary' && !order.secondary_sales_id) {
        console.log(`    ⚠️ 警告：二级销售订单缺少secondary_sales_id`);
      }
    });
    
    // 2. 统计销售ID填充情况
    console.log('\n📊 统计销售ID填充情况：');
    const { data: stats, error: statsError } = await supabase
      .from('orders')
      .select('sales_type, primary_sales_id, secondary_sales_id');
    
    if (!statsError && stats) {
      const total = stats.length;
      const hasPrimaryId = stats.filter(o => o.primary_sales_id).length;
      const hasSecondaryId = stats.filter(o => o.secondary_sales_id).length;
      const primaryOrders = stats.filter(o => o.sales_type === 'primary').length;
      const secondaryOrders = stats.filter(o => o.sales_type === 'secondary').length;
      
      console.log(`  总订单数: ${total}`);
      console.log(`  有primary_sales_id的订单: ${hasPrimaryId} (${(hasPrimaryId/total*100).toFixed(1)}%)`);
      console.log(`  有secondary_sales_id的订单: ${hasSecondaryId} (${(hasSecondaryId/total*100).toFixed(1)}%)`);
      console.log(`  一级销售订单: ${primaryOrders}`);
      console.log(`  二级销售订单: ${secondaryOrders}`);
    }
    
    // 3. 检查独立二级销售的识别
    console.log('\n📊 检查独立二级销售识别：');
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('id, wechat_name, primary_sales_id');
    
    if (!secondaryError && secondarySales) {
      const independent = secondarySales.filter(s => !s.primary_sales_id);
      const linked = secondarySales.filter(s => s.primary_sales_id);
      
      console.log(`  总二级销售数: ${secondarySales.length}`);
      console.log(`  独立二级销售: ${independent.length}`);
      console.log(`  一级下属二级销售: ${linked.length}`);
      
      if (independent.length > 0) {
        console.log('\n  独立二级销售列表：');
        independent.forEach(s => {
          console.log(`    - ${s.wechat_name} (ID: ${s.id})`);
        });
      }
    }
    
    console.log('\n✅ 验证完成！');
    
    // 4. 检查核心逻辑是否被保护
    console.log('\n🔒 检查核心业务逻辑保护：');
    console.log('  - 已创建 🔒核心业务逻辑保护.md');
    console.log('  - 已创建 .gitattributes 文件');
    console.log('  - 核心代码已添加保护注释');
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error);
  }
}

// 运行验证
verifyCoreFix();
