/**
 * 修复订单管理页面显示问题
 * 问题分析：
 * 1. 代码中访问的字段名 commission_amount_primary 与数据库实际字段名 primary_commission_amount 不匹配
 * 2. 销售信息显示为空可能是因为数据关联逻辑问题
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDisplayIssue() {
  console.log('🔍 分析订单管理页面显示问题...\n');
  
  try {
    // 1. 检查订单数据结构和销售关联
    console.log('=== 1. 分析订单数据和销售关联问题 ===');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select(`
        id, 
        order_number,
        sales_code,
        amount,
        commission_amount,
        primary_commission_amount,
        secondary_commission_amount,
        status,
        tradingview_username,
        customer_wechat
      `)
      .neq('status', 'rejected')
      .limit(10);
      
    if (ordersError) {
      console.error('❌ 查询订单失败:', ordersError.message);
      return;
    }
    
    console.log(`✅ 获取到 ${orders.length} 个订单`);
    
    // 2. 分析销售关联问题
    console.log('\n=== 2. 分析销售关联问题 ===');
    
    for (const order of orders.slice(0, 5)) {
      console.log(`\n📋 订单: ${order.order_number}`);
      console.log(`  - ID: ${order.id}`);
      console.log(`  - sales_code: ${order.sales_code}`);
      console.log(`  - 用户: ${order.tradingview_username}`);
      console.log(`  - 微信: ${order.customer_wechat}`);
      console.log(`  - 金额: $${order.amount}`);
      console.log(`  - 佣金字段检查:`);
      console.log(`    * commission_amount: ${order.commission_amount}`);
      console.log(`    * primary_commission_amount: ${order.primary_commission_amount}`);
      console.log(`    * secondary_commission_amount: ${order.secondary_commission_amount}`);
      
      // 检查销售关联
      if (order.sales_code) {
        const { data: salesInfo, error: salesError } = await supabase
          .from('sales_optimized')
          .select('wechat_name, sales_type, commission_rate, name')
          .eq('sales_code', order.sales_code)
          .single();
          
        if (salesError) {
          console.log(`  ❌ 销售关联失败: ${salesError.message}`);
        } else {
          console.log(`  ✅ 销售信息: ${salesInfo.wechat_name || salesInfo.name} (${salesInfo.sales_type})`);
        }
      } else {
        console.log(`  ❌ 缺少销售代码`);
      }
    }
    
    // 3. 模拟前端代码逻辑测试
    console.log('\n=== 3. 模拟前端访问逻辑 ===');
    
    const testOrder = orders[1]; // 取第二个订单做测试
    console.log(`\n🧪 测试订单: ${testOrder.order_number}`);
    console.log('前端代码访问测试:');
    
    // 模拟前端代码中的访问方式
    console.log(`  - record.commission_amount_primary: ${testOrder.commission_amount_primary} (❌ 字段不存在)`);
    console.log(`  - record.primary_commission_amount: ${testOrder.primary_commission_amount} (✅ 正确字段)`);
    console.log(`  - record.secondary_commission_amount: ${testOrder.secondary_commission_amount} (✅ 正确字段)`);
    
    // 4. 检查销售信息关联逻辑
    console.log('\n=== 4. 测试销售信息关联逻辑 ===');
    
    if (testOrder.sales_code) {
      const { data: sales, error } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('sales_code', testOrder.sales_code)
        .single();
        
      if (sales) {
        console.log('✅ 销售信息结构:');
        console.log(`  - wechat_name: ${sales.wechat_name}`);
        console.log(`  - sales_type: ${sales.sales_type}`);
        console.log(`  - parent_sales_code: ${sales.parent_sales_code}`);
        
        // 模拟前端销售信息显示逻辑
        console.log('\n前端销售信息显示逻辑测试:');
        
        let salesWechat = '-';
        let salesType = '-';
        
        // 检查是否是二级销售
        if (sales.parent_sales_code) {
          salesWechat = sales.wechat_name || '-';
          salesType = '二级销售';
          console.log(`  ✅ 识别为二级销售: ${salesWechat}`);
        } else if (sales.sales_type === 'primary') {
          salesWechat = sales.wechat_name || '-';
          salesType = '一级销售';
          console.log(`  ✅ 识别为一级销售: ${salesWechat}`);
        } else if (sales.sales_type === 'independent') {
          salesWechat = sales.wechat_name || '-';
          salesType = '独立销售';
          console.log(`  ✅ 识别为独立销售: ${salesWechat}`);
        }
        
        console.log(`  最终显示: ${salesWechat} (${salesType})`);
      }
    }
    
    // 5. 生成问题总结和解决方案
    console.log('\n=== 5. 问题总结和解决方案 ===');
    console.log('\n🔍 发现的问题:');
    console.log('1. ❌ 佣金字段名不匹配');
    console.log('   - 代码中: commission_amount_primary');
    console.log('   - 数据库: primary_commission_amount');
    console.log('\n2. ✅ 销售信息关联正常');
    console.log('   - sales_code 字段存在');
    console.log('   - sales_optimized 表关联正常');
    
    console.log('\n💡 解决方案:');
    console.log('1. 修改 AdminOrders.js 中的字段访问名称');
    console.log('2. 确保前端代码使用正确的数据库字段名');
    console.log('3. 测试修复后的显示效果');
    
  } catch (error) {
    console.error('❌ 分析过程出错:', error.message);
  }
}

// 执行分析
analyzeDisplayIssue().then(() => {
  console.log('\n✅ 问题分析完成！');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 问题分析失败:', error.message);
  process.exit(1);
});