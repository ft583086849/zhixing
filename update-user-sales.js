const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateUserSales() {
  try {
    console.log('==========================================');
    console.log('开始更新用户 zengyitian fang 的销售信息');
    console.log('==========================================\n');

    // 1. 在primary_sales表查找并更新一级销售
    console.log('1️⃣ 查找primary_sales表中的记录...');
    const { data: primarySales, error: primaryError } = await supabase
      .from('primary_sales')
      .select('*')
      .or('wechat_name.eq.zengyitian fang,wechat_name.eq.zengyitian588,name.eq.zengyitian fang,name.eq.zengyitian588');

    if (primaryError) {
      console.error('查询primary_sales错误:', primaryError);
    } else if (primarySales && primarySales.length > 0) {
      console.log(`找到 ${primarySales.length} 条一级销售记录:`);
      primarySales.forEach(sale => {
        console.log(`  - ID: ${sale.id}, 微信名: ${sale.wechat_name}, 姓名: ${sale.name}, 销售码: ${sale.sales_code}`);
      });

      // 更新找到的记录
      console.log('\n更新一级销售的微信名为: Yi111111____');
      for (const sale of primarySales) {
        const { data, error: updateError } = await supabase
          .from('primary_sales')
          .update({ 
            wechat_name: 'Yi111111____',
            updated_at: new Date().toISOString()
          })
          .eq('id', sale.id)
          .select();

        if (updateError) {
          console.error(`  ❌ 更新失败 (ID: ${sale.id}):`, updateError.message);
        } else {
          console.log(`  ✅ 成功更新 (ID: ${sale.id}), 新微信名: ${data[0].wechat_name}`);
        }
      }
    } else {
      console.log('  未找到匹配的一级销售记录');
    }

    // 2. 在secondary_sales表查找
    console.log('\n2️⃣ 查找secondary_sales表中的记录...');
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('*')
      .or('wechat_name.eq.zengyitian fang,wechat_name.eq.zengyitian588,name.eq.zengyitian fang,name.eq.zengyitian588');

    if (secondaryError) {
      console.error('查询secondary_sales错误:', secondaryError);
    } else if (secondarySales && secondarySales.length > 0) {
      console.log(`找到 ${secondarySales.length} 条二级销售记录:`);
      secondarySales.forEach(sale => {
        console.log(`  - ID: ${sale.id}, 微信名: ${sale.wechat_name}, 姓名: ${sale.name}, 一级销售ID: ${sale.primary_sales_id}`);
      });

      // 如果该用户是二级销售，查找其一级销售
      for (const sale of secondarySales) {
        const { data: primaryData } = await supabase
          .from('primary_sales')
          .select('*')
          .eq('id', sale.primary_sales_id)
          .single();
        
        if (primaryData) {
          console.log(`  📎 二级销售 ${sale.wechat_name} 的一级销售是: ${primaryData.wechat_name} (ID: ${primaryData.id})`);
        }
      }
    } else {
      console.log('  未找到匹配的二级销售记录');
    }

    // 3. 在orders表中查找作为客户的订单
    console.log('\n3️⃣ 查找orders表中作为客户的订单...');
    const { data: customerOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .or('customer_wechat.eq.zengyitian fang,tradingview_username.eq.zengyitian588,customer_name.eq.zengyitian fang');

    if (ordersError) {
      console.error('查询orders错误:', ordersError);
    } else if (customerOrders && customerOrders.length > 0) {
      console.log(`找到 ${customerOrders.length} 个客户订单:`);
      customerOrders.forEach(order => {
        console.log(`  - 订单号: ${order.order_number}`);
        console.log(`    客户微信: ${order.customer_wechat}, TradingView: ${order.tradingview_username}`);
        console.log(`    销售码: ${order.sales_code}, 金额: ${order.amount}`);
      });
    } else {
      console.log('  未找到作为客户的订单');
    }

    // 4. 验证更新结果
    console.log('\n==========================================');
    console.log('4️⃣ 验证更新结果');
    console.log('==========================================');
    
    const { data: updatedPrimary } = await supabase
      .from('primary_sales')
      .select('*')
      .eq('wechat_name', 'Yi111111____');
    
    if (updatedPrimary && updatedPrimary.length > 0) {
      console.log('\n✅ 已成功更新的primary_sales记录:');
      updatedPrimary.forEach(sale => {
        console.log(`  - ID: ${sale.id}`);
        console.log(`    微信名: ${sale.wechat_name}`);
        console.log(`    销售码: ${sale.sales_code}`);
        console.log(`    更新时间: ${sale.updated_at}`);
      });
    } else {
      console.log('\n未找到更新后的记录');
    }

    console.log('\n==========================================');
    console.log('✨ 操作完成！');
    console.log('==========================================');

  } catch (error) {
    console.error('执行过程中出错:', error);
  }
}

// 执行更新
updateUserSales();