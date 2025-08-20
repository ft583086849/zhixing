const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://itwpzsmqdxfluhfqsnwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0d3B6c21xZHhmbHVoZnFzbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Mzk2NDksImV4cCI6MjA1MDAxNTY0OX0.6sFI8OTcrP0ErjLs3XIRNeQnGeWH97xygILqfI6NWGI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSalesTableStructure() {
  console.log('=== 检查 sales_optimized 表结构和数据 ===\n');
  
  try {
    // 获取前3个销售数据查看字段
    const { data: sales, error } = await supabase
      .from('sales_optimized')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('查询失败:', error);
      return;
    }
    
    if (sales && sales.length > 0) {
      console.log('表中有', sales.length, '条销售数据');
      console.log('\n所有字段名:');
      console.log(Object.keys(sales[0]));
      
      console.log('\n前3个销售的关键字段:');
      sales.forEach((sale, index) => {
        console.log(`${index + 1}. 销售数据:`, {
          id: sale.id,
          sales_code: sale.sales_code,
          wechat_name: sale.wechat_name,
          sales_name: sale.sales_name,
          name: sale.name,
          username: sale.username,
          sales_type: sale.sales_type,
          total_amount: sale.total_amount
        });
      });
      
      console.log('\n=== 可能的名称字段分析 ===');
      const nameFields = ['wechat_name', 'sales_name', 'name', 'username'];
      nameFields.forEach(field => {
        const hasData = sales.some(sale => sale[field] && sale[field] !== null);
        console.log(`${field}: ${hasData ? '有数据' : '无数据'}`);
      });
      
    } else {
      console.log('表中没有数据');
    }
  } catch (error) {
    console.error('检查表结构失败:', error);
  }
}

checkSalesTableStructure();