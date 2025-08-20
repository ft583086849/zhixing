require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersFields() {
  console.log('检查 orders_optimized 表结构...\n');
  
  try {
    // 获取一条记录来查看所有字段
    const { data, error } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const fields = Object.keys(data[0]);
      console.log('orders_optimized 表字段列表：');
      console.log('='.repeat(40));
      
      // 分类显示字段
      const customerFields = fields.filter(f => f.includes('customer'));
      const salesFields = fields.filter(f => f.includes('sales') || f.includes('commission'));
      const paymentFields = fields.filter(f => f.includes('payment') || f.includes('amount'));
      const otherFields = fields.filter(f => 
        !f.includes('customer') && 
        !f.includes('sales') && 
        !f.includes('commission') &&
        !f.includes('payment') &&
        !f.includes('amount')
      );
      
      console.log('\n客户相关字段：');
      customerFields.forEach(f => console.log(`  - ${f}: ${typeof data[0][f]}`));
      
      console.log('\n销售/佣金相关字段：');
      salesFields.forEach(f => {
        const value = data[0][f];
        const display = value === null ? 'null' : 
                        typeof value === 'string' ? `"${value}"` : value;
        console.log(`  - ${f}: ${display}`);
      });
      
      console.log('\n支付/金额相关字段：');
      paymentFields.forEach(f => {
        const value = data[0][f];
        const display = value === null ? 'null' : 
                        typeof value === 'string' ? `"${value}"` : value;
        console.log(`  - ${f}: ${display}`);
      });
      
      console.log('\n其他字段：');
      otherFields.slice(0, 10).forEach(f => console.log(`  - ${f}`));
      
      // 检查有销售信息的订单
      console.log('\n\n检查有销售信息的订单...');
      const { data: salesOrders, error: salesError } = await supabase
        .from('orders_optimized')
        .select('sales_code, sales_type, primary_sales_id, secondary_sales_id, commission_amount')
        .not('sales_code', 'is', null)
        .limit(5);
      
      if (salesOrders && salesOrders.length > 0) {
        console.log(`\n找到 ${salesOrders.length} 条有销售代码的订单：`);
        salesOrders.forEach((order, i) => {
          console.log(`\n订单 ${i + 1}:`);
          console.log(`  sales_code: ${order.sales_code}`);
          console.log(`  sales_type: ${order.sales_type}`);
          console.log(`  primary_sales_id: ${order.primary_sales_id}`);
          console.log(`  secondary_sales_id: ${order.secondary_sales_id}`);
          console.log(`  commission_amount: ${order.commission_amount}`);
        });
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkOrdersFields();