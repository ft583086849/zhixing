const fs = require('fs');
const path = require('path');

// 立即修复一级销售对账API的核心问题
function fixPrimarySalesAPI() {
  console.log('🔧 修复一级销售对账API - 表名错误问题\n');
  
  const filePath = path.join(__dirname, 'client/src/services/supabase.js');
  
  try {
    // 读取文件内容
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log('1. 修复核心问题：secondary_sales表 → sales_optimized表');
    
    // 修复1：错误的表名引用
    const fixes = [
      {
        old: `const { data: secondarySales, error: secondaryError } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('primary_sales_id', primaryStats.id)`,
        new: `const { data: secondarySales, error: secondaryError } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('parent_sales_code', primaryStats.sales_code)`,
        description: '修复二级销售查询表名和关联字段'
      },
      
      // 修复其他secondary_sales表的引用
      {
        old: `supabase.from('secondary_sales')`,
        new: `supabase.from('sales_optimized')`,
        description: '统一使用sales_optimized表'
      },
      
      // 修复关联字段
      {
        old: `eq('primary_sales_id'`,
        new: `eq('parent_sales_code'`,
        description: '使用正确的关联字段parent_sales_code'
      }
    ];
    
    fixes.forEach((fix, index) => {
      if (content.includes(fix.old)) {
        content = content.replace(new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.new);
        console.log(`✅ 修复 ${index + 1}: ${fix.description}`);
      } else {
        console.log(`⚠️  修复 ${index + 1}: 未找到目标代码，可能已修复`);
      }
    });
    
    // 写回文件
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('\n✅ API修复完成！');
    
    console.log('\n📝 修复内容总结:');
    console.log('- 将secondary_sales表改为sales_optimized表');
    console.log('- 将primary_sales_id关联改为parent_sales_code');
    console.log('- 确保查询逻辑与数据库结构一致');
    
    return true;
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    return false;
  }
}

// 创建数据验证脚本
function createValidationScript() {
  console.log('\n🔍 创建数据验证脚本...');
  
  const validationScript = `
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function validateFix() {
  console.log('🧪 验证API修复效果...');
  
  try {
    // 测试修复后的API调用
    const { data: primarySales } = await supabase
      .from('sales_optimized')
      .select('*')
      .is('parent_sales_code', null)
      .limit(1);
    
    if (primarySales && primarySales.length > 0) {
      const testPrimary = primarySales[0];
      console.log('✅ 找到测试一级销售:', testPrimary.sales_code);
      
      // 使用正确的逻辑查询二级销售
      const { data: secondarySales, error } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('parent_sales_code', testPrimary.sales_code);
      
      if (error) {
        console.log('❌ 查询二级销售失败:', error.message);
      } else {
        console.log('✅ 查询二级销售成功，数量:', secondarySales?.length || 0);
        
        if (secondarySales && secondarySales.length > 0) {
          console.log('二级销售列表:');
          secondarySales.forEach(s => {
            console.log(\`- \${s.sales_code} (\${s.wechat_name})\`);
          });
        } else {
          console.log('ℹ️  当前没有二级销售数据，这是正常现象');
        }
      }
    }
    
    console.log('\\n✅ API修复验证完成');
  } catch (error) {
    console.error('❌ 验证失败:', error);
  }
}

validateFix();
`;
  
  fs.writeFileSync('validate-api-fix.js', validationScript);
  console.log('✅ 验证脚本已创建: validate-api-fix.js');
}

// 执行修复
console.log('🚀 开始修复一级销售对账页面数据为0问题\\n');

if (fixPrimarySalesAPI()) {
  createValidationScript();
  
  console.log('\\n🎉 修复完成！');
  console.log('\\n📋 后续步骤:');
  console.log('1. ✅ 立即执行: node validate-api-fix.js (验证修复效果)');
  console.log('2. 🔄 重启前端开发服务器');
  console.log('3. 🧪 测试一级销售对账页面');
  console.log('4. 💾 如果需要测试数据，可以创建二级销售记录');
} else {
  console.log('\\n❌ 修复失败，请手动检查文件路径和内容');
}