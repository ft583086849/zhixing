// 检查数据库中存在的销售代码
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gvlwjgbbffxgrcxqprdc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bHdqZ2JiZmZ4Z3JjeHFwcmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ4NDgxNzEsImV4cCI6MjA0MDQyNDE3MX0.MV5o9iOE3rXfCz3t7kQJBKLtLPW_xYvf_K_cVEkQ2OI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSalesCodes() {
  console.log('🔍 查询数据库中的销售代码...');
  
  try {
    // 查询一级销售
    const { data: primarySales, error: primaryError } = await supabase
      .from('primary_sales')
      .select('sales_code, wechat_name')
      .limit(10);
    
    if (primaryError) {
      console.error('❌ 查询一级销售失败:', primaryError);
    } else {
      console.log('\n📋 一级销售代码:');
      primarySales.forEach(sale => {
        console.log(`  - ${sale.sales_code} (${sale.wechat_name})`);
      });
    }
    
    // 查询二级销售
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('sales_code, wechat_name')
      .limit(10);
    
    if (secondaryError) {
      console.error('❌ 查询二级销售失败:', secondaryError);
    } else {
      console.log('\n📋 二级销售代码:');
      secondarySales.forEach(sale => {
        console.log(`  - ${sale.sales_code} (${sale.wechat_name})`);
      });
    }
    
    // 查询优化表
    const { data: optimizedSales, error: optimizedError } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, sales_type')
      .limit(10);
    
    if (optimizedError) {
      console.error('❌ 查询优化销售表失败:', optimizedError);
    } else {
      console.log('\n📋 销售优化表代码:');
      optimizedSales.forEach(sale => {
        console.log(`  - ${sale.sales_code} (${sale.wechat_name}) [${sale.sales_type}]`);
      });
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  }
}

checkSalesCodes();