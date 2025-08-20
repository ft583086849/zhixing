const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateSalesForCustomer() {
  try {
    console.log('==========================================');
    console.log('查找并更新客户 zengyitian fang 的销售人员');
    console.log('==========================================\n');

    // 1. 查找订单的销售码
    console.log('1️⃣ 查找客户订单的销售码...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .or('customer_wechat.eq.zengyitian fang,tradingview_username.eq.zengyitian588');

    if (ordersError) {
      console.error('查询订单错误:', ordersError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('未找到该客户的订单');
      return;
    }

    console.log(`找到 ${orders.length} 个订单:`);
    const salesCodes = new Set();
    orders.forEach(order => {
      console.log(`  - 订单号: ${order.order_number}`);
      console.log(`    销售码: ${order.sales_code}`);
      if (order.sales_code) {
        salesCodes.add(order.sales_code);
      }
    });

    // 2. 根据销售码查找销售人员
    console.log('\n2️⃣ 根据销售码查找销售人员...');
    for (const salesCode of salesCodes) {
      console.log(`\n查找销售码: ${salesCode}`);
      
      // 检查是否为一级销售
      if (salesCode.startsWith('PRI')) {
        const { data: primarySale, error: primaryError } = await supabase
          .from('primary_sales')
          .select('*')
          .eq('sales_code', salesCode)
          .single();

        if (primarySale) {
          console.log('  找到一级销售:');
          console.log(`    ID: ${primarySale.id}`);
          console.log(`    当前微信名: ${primarySale.wechat_name}`);
          console.log(`    销售码: ${primarySale.sales_code}`);

          // 更新一级销售的微信名
          console.log('\n  更新一级销售的微信名为: Yi111111____');
          const { data: updatedData, error: updateError } = await supabase
            .from('primary_sales')
            .update({ 
              wechat_name: 'Yi111111____',
              updated_at: new Date().toISOString()
            })
            .eq('id', primarySale.id)
            .select();

          if (updateError) {
            console.error(`  ❌ 更新失败:`, updateError.message);
          } else {
            console.log(`  ✅ 成功更新! 新微信名: ${updatedData[0].wechat_name}`);
          }
        }
      }
      
      // 检查是否为二级销售
      if (salesCode.startsWith('SEC')) {
        const { data: secondarySale, error: secondaryError } = await supabase
          .from('secondary_sales')
          .select('*')
          .eq('sales_code', salesCode)
          .single();

        if (secondarySale) {
          console.log('  找到二级销售:');
          console.log(`    ID: ${secondarySale.id}`);
          console.log(`    微信名: ${secondarySale.wechat_name}`);
          console.log(`    销售码: ${secondarySale.sales_code}`);
          console.log(`    一级销售ID: ${secondarySale.primary_sales_id}`);

          // 查找并更新其一级销售
          if (secondarySale.primary_sales_id) {
            const { data: primarySale, error: primaryError } = await supabase
              .from('primary_sales')
              .select('*')
              .eq('id', secondarySale.primary_sales_id)
              .single();

            if (primarySale) {
              console.log(`\n  该二级销售的一级销售:`);
              console.log(`    ID: ${primarySale.id}`);
              console.log(`    当前微信名: ${primarySale.wechat_name}`);
              
              console.log('\n  更新一级销售的微信名为: Yi111111____');
              const { data: updatedData, error: updateError } = await supabase
                .from('primary_sales')
                .update({ 
                  wechat_name: 'Yi111111____',
                  updated_at: new Date().toISOString()
                })
                .eq('id', primarySale.id)
                .select();

              if (updateError) {
                console.error(`  ❌ 更新失败:`, updateError.message);
              } else {
                console.log(`  ✅ 成功更新! 新微信名: ${updatedData[0].wechat_name}`);
              }
            }
          }
        }
      }
    }

    // 3. 验证更新结果
    console.log('\n==========================================');
    console.log('3️⃣ 验证更新结果');
    console.log('==========================================');
    
    const { data: updatedPrimary } = await supabase
      .from('primary_sales')
      .select('*')
      .eq('wechat_name', 'Yi111111____');
    
    if (updatedPrimary && updatedPrimary.length > 0) {
      console.log('\n✅ 所有更新后的primary_sales记录:');
      updatedPrimary.forEach(sale => {
        console.log(`  - ID: ${sale.id}`);
        console.log(`    微信名: ${sale.wechat_name}`);
        console.log(`    销售码: ${sale.sales_code}`);
        console.log(`    更新时间: ${sale.updated_at}`);
        console.log('');
      });
    }

    console.log('==========================================');
    console.log('✨ 操作完成！');
    console.log('==========================================');

  } catch (error) {
    console.error('执行过程中出错:', error);
  }
}

// 执行更新
updateSalesForCustomer();