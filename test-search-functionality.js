require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testSearchFunctionality() {
  console.log('测试搜索功能（包含团队成员）');
  console.log('='.repeat(100));
  
  // 获取所有销售数据
  const { data: primarySales } = await supabase
    .from('primary_sales')
    .select('*');
    
  const { data: secondarySales } = await supabase
    .from('secondary_sales')
    .select('*');
  
  // 模拟搜索"WML"
  const searchTerm = 'WML';
  console.log(`搜索: "${searchTerm}"`);
  
  // 找到匹配的一级销售
  const matchedPrimary = primarySales?.find(sale => 
    sale.wechat_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (matchedPrimary) {
    console.log(`\n找到一级销售: ${matchedPrimary.wechat_name}`);
    console.log(`销售代码: ${matchedPrimary.sales_code}`);
    
    // 找到该一级销售的团队成员
    const teamMembers = secondarySales?.filter(sale => 
      sale.primary_sales_id === matchedPrimary.id
    );
    
    console.log(`\n团队成员 (${teamMembers?.length || 0}人):`);
    teamMembers?.forEach(member => {
      console.log(`  - ${member.wechat_name} (销售代码: ${member.sales_code})`);
    });
    
    // 检查数据结构
    console.log('\n检查关联字段:');
    console.log(`一级销售ID: ${matchedPrimary.id}`);
    console.log(`一级销售代码: ${matchedPrimary.sales_code}`);
    
    // 检查AdminSalesOptimized使用的字段
    console.log('\n前端代码使用parent_sales_code字段关联');
    console.log('但数据库中二级销售表只有primary_sales_id字段');
    console.log('这可能是搜索功能不工作的原因！');
    
    // 检查sales_optimized视图/表
    const { data: salesOptimized } = await supabase
      .from('sales_optimized')
      .select('*')
      .limit(1);
      
    if (salesOptimized && salesOptimized.length > 0) {
      console.log('\nsales_optimized表存在');
      console.log('字段:', Object.keys(salesOptimized[0]).join(', '));
    } else {
      console.log('\nsales_optimized表不存在或为空');
    }
  }
}

testSearchFunctionality();