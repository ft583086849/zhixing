#!/usr/bin/env node

/**
 * 初始化 customers_optimized 表数据
 * 从 orders_optimized 表聚合历史数据
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'client', '.env') });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function initCustomersData() {
  console.log('🚀 开始初始化客户数据...\n');

  try {
    // 1. 获取所有订单数据
    console.log('1️⃣ 获取订单数据...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('*')
      .neq('status', 'rejected');

    if (ordersError) {
      console.error('❌ 获取订单失败:', ordersError);
      return;
    }
    console.log(`✅ 获取到 ${orders.length} 个订单`);

    // 2. 获取销售数据
    console.log('\n2️⃣ 获取销售数据...');
    const [primarySalesResult, secondarySalesResult, salesOptimizedResult] = await Promise.all([
      supabase.from('primary_sales').select('*'),
      supabase.from('secondary_sales').select('*'),
      supabase.from('sales_optimized').select('*')
    ]);

    const primarySales = primarySalesResult.data || [];
    const secondarySales = secondarySalesResult.data || [];
    const salesOptimized = salesOptimizedResult.data || [];
    
    // 创建映射
    const primarySalesMap = new Map(primarySales.map(s => [s.sales_code, s]));
    const secondarySalesMap = new Map(secondarySales.map(s => [s.sales_code, s]));
    const salesOptimizedMap = new Map(salesOptimized.map(s => [s.sales_code, s]));

    console.log(`✅ 获取到 ${primarySales.length} 个一级销售，${secondarySales.length} 个二级销售`);

    // 3. 聚合客户数据
    console.log('\n3️⃣ 聚合客户数据...');
    const customerMap = new Map();

    orders.forEach(order => {
      const key = `${order.customer_wechat || ''}_${order.tradingview_username || ''}`;
      
      if (!customerMap.has(key)) {
        // 获取销售信息
        let salesInfo = {
          sales_wechat_name: '-',
          sales_type: 'independent',
          primary_sales_name: null
        };

        if (order.sales_code) {
          // 优先从 sales_optimized 获取
          const salesOpt = salesOptimizedMap.get(order.sales_code);
          if (salesOpt) {
            salesInfo.sales_wechat_name = salesOpt.wechat_name || salesOpt.name;
            salesInfo.sales_type = salesOpt.sales_type || 'independent';
          }

          // 检查是否为一级销售
          const primarySale = primarySalesMap.get(order.sales_code);
          if (primarySale) {
            salesInfo.sales_wechat_name = primarySale.wechat_name || primarySale.name;
            salesInfo.sales_type = 'primary';
          }

          // 检查是否为二级销售
          const secondarySale = secondarySalesMap.get(order.sales_code);
          if (secondarySale) {
            salesInfo.sales_wechat_name = secondarySale.wechat_name || secondarySale.name;
            salesInfo.sales_type = 'secondary';
            
            // 获取上级销售名称
            if (secondarySale.primary_sales_id) {
              const primarySale = Array.from(primarySalesMap.values())
                .find(p => p.id === secondarySale.primary_sales_id);
              if (primarySale) {
                salesInfo.primary_sales_name = primarySale.wechat_name || primarySale.name;
              }
            }
          }
        }

        customerMap.set(key, {
          customer_wechat: order.customer_wechat || '',
          tradingview_username: order.tradingview_username || '',
          sales_code: order.sales_code,
          sales_wechat_name: salesInfo.sales_wechat_name,
          sales_type: salesInfo.sales_type,
          primary_sales_name: salesInfo.primary_sales_name,
          total_orders: 0,
          valid_orders: 0,
          total_amount: 0,
          actual_payment_amount: 0,
          commission_amount: 0,
          latest_order_id: null,
          latest_order_time: null,
          latest_order_status: null,
          latest_order_amount: null,
          latest_expiry_time: null,
          latest_duration: null,
          first_order_id: null,
          first_order_time: null,
          first_order_amount: null,
          orders: []
        });
      }

      const customer = customerMap.get(key);
      customer.orders.push(order);
    });

    // 4. 计算统计数据
    console.log('\n4️⃣ 计算统计数据...');
    const customersToInsert = [];

    for (const [key, customer] of customerMap) {
      // 排序订单
      customer.orders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      // 计算统计
      customer.total_orders = customer.orders.length;
      customer.valid_orders = customer.orders.filter(o => 
        ['confirmed_payment', 'confirmed_config', 'active'].includes(o.status)
      ).length;
      customer.total_amount = customer.orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
      customer.actual_payment_amount = customer.orders.reduce((sum, o) => 
        sum + (parseFloat(o.actual_payment_amount) || 0), 0
      );
      customer.commission_amount = customer.orders.reduce((sum, o) => 
        sum + (parseFloat(o.commission_amount) || 0), 0
      );

      // 最新订单信息
      const latestOrder = customer.orders[customer.orders.length - 1];
      if (latestOrder) {
        customer.latest_order_id = latestOrder.id;
        customer.latest_order_time = latestOrder.created_at;
        customer.latest_order_status = latestOrder.status;
        customer.latest_order_amount = latestOrder.amount;
        customer.latest_expiry_time = latestOrder.expiry_time;
        customer.latest_duration = latestOrder.duration;
        
        // 计算距离最后订单的天数
        const daysSince = Math.floor(
          (new Date() - new Date(latestOrder.created_at)) / (1000 * 60 * 60 * 24)
        );
        customer.days_since_last_order = daysSince;
      }

      // 首单信息
      const firstOrder = customer.orders[0];
      if (firstOrder) {
        customer.first_order_id = firstOrder.id;
        customer.first_order_time = firstOrder.created_at;
        customer.first_order_amount = firstOrder.amount;
      }

      // 移除orders数组，准备插入
      delete customer.orders;
      customersToInsert.push(customer);
    }

    console.log(`✅ 准备插入 ${customersToInsert.length} 个客户`);

    // 5. 批量插入到数据库
    console.log('\n5️⃣ 插入到 customers_optimized 表...');
    
    // 分批插入（每批100条）
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < customersToInsert.length; i += batchSize) {
      const batch = customersToInsert.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('customers_optimized')
        .upsert(batch, {
          onConflict: 'customer_wechat,tradingview_username',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error(`❌ 插入第 ${i}-${i + batch.length} 条失败:`, insertError);
      } else {
        inserted += batch.length;
        console.log(`  ✅ 已插入 ${inserted}/${customersToInsert.length} 条`);
      }
    }

    console.log('\n✅ 客户数据初始化完成！');
    console.log(`   总客户数: ${customersToInsert.length}`);
    console.log(`   成功插入: ${inserted}`);

  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
  }
}

// 执行初始化
initCustomersData();