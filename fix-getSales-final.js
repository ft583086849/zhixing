// 修复getSales函数，使用sales_optimized表
const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'client/src/services/api.js');
let content = fs.readFileSync(apiPath, 'utf8');

// 要替换的旧代码（使用primary_sales和secondary_sales）
const oldCode = `      // 获取一级销售查询
      const primaryQuery = supabaseClient.from('primary_sales').select('*');
      const secondaryQuery = supabaseClient.from('secondary_sales').select('*');`;

// 新代码（使用sales_optimized表）
const newCode = `      // 从 sales_optimized 表获取数据
      const salesQuery = supabaseClient
        .from('sales_optimized')
        .select('*')
        .order('total_amount', { ascending: false });`;

// 替换
if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  console.log('✅ 替换了查询代码');
} else {
  console.log('⚠️ 找不到要替换的旧代码');
}

// 替换获取数据的逻辑
const oldDataFetch = `      // 先获取所有数据
      const [allPrimary, allSecondary] = await Promise.all([
        primaryQuery.then(result => result.data || []),
        secondaryQuery.then(result => result.data || [])
      ]);`;

const newDataFetch = `      // 执行查询
      const { data: allSales, error } = await salesQuery;
      
      if (error) {
        console.error('获取销售数据失败:', error);
        throw error;
      }
      
      // 分离一级和二级销售
      const allPrimary = allSales?.filter(s => s.sales_type === 'primary') || [];
      const allSecondary = allSales?.filter(s => s.sales_type === 'secondary') || [];`;

if (content.includes(oldDataFetch)) {
  content = content.replace(oldDataFetch, newDataFetch);
  console.log('✅ 替换了数据获取逻辑');
} else {
  console.log('⚠️ 找不到要替换的数据获取逻辑');
}

// 写回文件
fs.writeFileSync(apiPath, content, 'utf8');
console.log('✅ getSales函数已修复');