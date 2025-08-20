/**
 * 查询sales_optimized表中的销售人员数据
 * 用于修复销售人员下拉框显示问题
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function querySalesData() {
  try {
    console.log('📊 开始查询sales_optimized表中的销售人员信息...');
    
    const { data, error } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, parent_sales_code')
      .not('wechat_name', 'is', null)
      .order('wechat_name')
      .limit(20);

    if (error) {
      console.error('❌ 查询错误:', error);
      return;
    }

    console.log('✅ 查询成功，返回', data.length, '条记录：');
    console.log('');
    
    // 格式化显示结果
    console.log('序号 | 销售代码    | 微信名称        | 上级代码');
    console.log('-----|-------------|-----------------|----------');
    
    data.forEach((item, index) => {
      const salesCode = (item.sales_code || '无').padEnd(11);
      const wechatName = (item.wechat_name || '无').padEnd(15);
      const parentCode = item.parent_sales_code || '无';
      
      console.log(`${(index + 1).toString().padStart(4)} | ${salesCode} | ${wechatName} | ${parentCode}`);
    });

    console.log('');
    console.log('🔍 数据分析：');
    const primarySales = data.filter(item => !item.parent_sales_code);
    const secondarySales = data.filter(item => item.parent_sales_code);
    
    console.log('- 一级销售数量:', primarySales.length, '个');
    console.log('- 二级销售数量:', secondarySales.length, '个');
    console.log('- 数据字段格式:');
    console.log('  * sales_code: 销售代码（用作内部标识）');
    console.log('  * wechat_name: 微信名称（用作显示名称）'); 
    console.log('  * parent_sales_code: 上级代码（二级销售才有）');
    
    if (primarySales.length > 0) {
      console.log('');
      console.log('🎯 一级销售示例：');
      primarySales.slice(0, 3).forEach(sale => {
        console.log('  - 代码:', sale.sales_code, ', 微信:', sale.wechat_name);
      });
    }
    
    if (secondarySales.length > 0) {
      console.log('');
      console.log('🎯 二级销售示例：');
      secondarySales.slice(0, 3).forEach(sale => {
        console.log('  - 代码:', sale.sales_code, ', 微信:', sale.wechat_name, ', 上级:', sale.parent_sales_code);
      });
    }
    
  } catch (error) {
    console.error('❌ 执行查询时发生错误:', error);
  }
}

querySalesData();