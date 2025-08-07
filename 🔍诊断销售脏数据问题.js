/**
 * 诊断销售管理页面脏数据问题
 * 在浏览器控制台运行此脚本
 */

async function diagnoseDirtyData() {
  console.clear();
  console.log('='.repeat(60));
  console.log('🔍 开始诊断销售管理脏数据问题');
  console.log('='.repeat(60));
  
  const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
  
  // 1. 检查销售表数据
  console.log('\n📋 步骤1：检查销售表数据完整性');
  
  const salesTables = ['primary_sales', 'secondary_sales'];
  const allSalesData = [];
  
  for (const table of salesTables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`\n✅ ${table} 表: ${data.length} 条记录`);
        
        // 检查每个销售的字段完整性
        data.forEach((sale, index) => {
          const issues = [];
          
          // 检查关键字段
          if (!sale.sales_code) issues.push('缺少sales_code');
          if (!sale.wechat_name) issues.push('缺少wechat_name（微信号）');
          if (!sale.name && !sale.wechat_name) issues.push('name和wechat_name都为空');
          
          if (issues.length > 0) {
            console.warn(`⚠️ ${table}[${index}] 数据问题:`, {
              id: sale.id,
              sales_code: sale.sales_code || '空',
              wechat_name: sale.wechat_name || '空',
              name: sale.name || '空',
              问题: issues
            });
          }
          
          allSalesData.push({
            ...sale,
            table: table
          });
        });
      }
    } catch (error) {
      console.error(`❌ 查询 ${table} 失败:`, error);
    }
  }
  
  // 2. 检查订单表的sales_code
  console.log('\n📋 步骤2：检查订单表sales_code匹配情况');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (response.ok) {
      const orders = await response.json();
      console.log(`✅ orders表: ${orders.length} 条记录`);
      
      // 统计sales_code分布
      const salesCodeStats = {};
      const unmatchedCodes = new Set();
      
      orders.forEach(order => {
        const code = order.sales_code;
        if (code) {
          salesCodeStats[code] = (salesCodeStats[code] || 0) + 1;
          
          // 检查是否能匹配到销售表
          const matchedSale = allSalesData.find(s => s.sales_code === code);
          if (!matchedSale) {
            unmatchedCodes.add(code);
          }
        } else {
          salesCodeStats['[空值]'] = (salesCodeStats['[空值]'] || 0) + 1;
        }
      });
      
      console.log('\n📊 订单sales_code统计:');
      Object.entries(salesCodeStats).forEach(([code, count]) => {
        const sale = allSalesData.find(s => s.sales_code === code);
        if (sale) {
          console.log(`✅ ${code}: ${count}个订单 → 匹配到${sale.table}的 ${sale.wechat_name || sale.name || '未知'}`);
        } else if (code === '[空值]') {
          console.warn(`⚠️ ${code}: ${count}个订单`);
        } else {
          console.error(`❌ ${code}: ${count}个订单 → 无法匹配到销售表`);
        }
      });
      
      if (unmatchedCodes.size > 0) {
        console.error('\n❌ 无法匹配的sales_code:', Array.from(unmatchedCodes));
      }
    }
  } catch (error) {
    console.error('❌ 查询订单失败:', error);
  }
  
  // 3. 分析具体销售的问题
  console.log('\n📋 步骤3：分析具体销售问题');
  
  // 检查几个特定销售
  const checkSales = ['天金三角仿', '浙莱一级', 'Zhixingjun', '张子俊1111234'];
  
  for (const salesName of checkSales) {
    const sale = allSalesData.find(s => 
      s.name === salesName || 
      s.wechat_name === salesName
    );
    
    if (sale) {
      console.log(`\n🔍 分析销售: ${salesName}`);
      console.log('- sales_code:', sale.sales_code || '❌ 空');
      console.log('- wechat_name:', sale.wechat_name || '❌ 空');
      console.log('- name:', sale.name || '空');
      console.log('- 表:', sale.table);
      
      // 查找该销售的订单
      const orderCount = salesCodeStats[sale.sales_code] || 0;
      console.log('- 订单数:', orderCount);
    }
  }
  
  // 4. 提供修复建议
  console.log('\n' + '='.repeat(60));
  console.log('💡 问题总结和修复建议');
  console.log('='.repeat(60));
  
  console.log(`
可能的问题：
1. 销售表缺少 wechat_name 字段值
2. 某些订单的 sales_code 无法匹配到销售表
3. 销售表的 sales_code 可能有重复或格式问题

修复方案：
1. 补充销售表的 wechat_name 字段：
   UPDATE primary_sales SET wechat_name = name WHERE wechat_name IS NULL;
   UPDATE secondary_sales SET wechat_name = name WHERE wechat_name IS NULL;

2. 检查并修复订单表的 sales_code：
   -- 查看无法匹配的订单
   SELECT * FROM orders WHERE sales_code NOT IN 
   (SELECT sales_code FROM primary_sales UNION SELECT sales_code FROM secondary_sales);

3. 确保销售表的 sales_code 唯一性：
   SELECT sales_code, COUNT(*) FROM primary_sales GROUP BY sales_code HAVING COUNT(*) > 1;
   SELECT sales_code, COUNT(*) FROM secondary_sales GROUP BY sales_code HAVING COUNT(*) > 1;
  `);
}

// 执行诊断
diagnoseDirtyData();

