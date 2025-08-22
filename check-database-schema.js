#!/usr/bin/env node

// 检查数据库表结构和佣金字段的脚本
console.log('🔍 检查数据库表结构和佣金字段...');

// 使用现有的服务层
const path = require('path');
const clientPath = path.join(__dirname, 'client');

// 动态导入 SupabaseService
async function checkDatabase() {
  try {
    // 设置环境变量
    process.env.NODE_PATH = clientPath;
    
    // 导入Supabase服务
    const { SupabaseService } = await import('./client/src/services/supabase.js');
    const supabase = SupabaseService.supabase;
    
    console.log('📊 1. 检查 orders_optimized 表样本数据...');
    
    // 获取一条最新的订单记录
    const { data: orderSample, error: orderError } = await supabase
      .from('orders_optimized')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (orderError) {
      console.error('❌ 查询订单表失败:', orderError);
      return;
    }
    
    if (orderSample && orderSample[0]) {
      const order = orderSample[0];
      console.log('✅ orders_optimized 表字段:');
      console.log(Object.keys(order).sort());
      
      console.log('\n📋 订单佣金相关字段值:');
      console.log('- commission_amount:', order.commission_amount);
      console.log('- commission_amount_primary:', order.commission_amount_primary);
      console.log('- secondary_commission_amount:', order.secondary_commission_amount);
      console.log('- sales_code:', order.sales_code);
      console.log('- status:', order.status);
    }
    
    console.log('\n📊 2. 检查 sales_optimized 表样本数据...');
    
    // 获取一条销售记录
    const { data: salesSample, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .limit(1);
      
    if (salesError) {
      console.error('❌ 查询销售表失败:', salesError);
      return;
    }
    
    if (salesSample && salesSample[0]) {
      const sales = salesSample[0];
      console.log('✅ sales_optimized 表字段:');
      console.log(Object.keys(sales).sort());
      
      console.log('\n📋 销售信息关键字段值:');
      console.log('- id:', sales.id);
      console.log('- sales_code:', sales.sales_code);
      console.log('- wechat_name:', sales.wechat_name);
      console.log('- sales_type:', sales.sales_type);
      console.log('- parent_sales_code:', sales.parent_sales_code);
      console.log('- primary_sales_code:', sales.primary_sales_code);
    }
    
    console.log('\n📊 3. 检查佣金字段统计...');
    
    // 检查有佣金字段值的订单数量
    const { data: commissionStats, error: statsError } = await supabase
      .from('orders_optimized')
      .select('commission_amount, commission_amount_primary, secondary_commission_amount')
      .not('commission_amount', 'is', null)
      .limit(10);
      
    if (!statsError && commissionStats) {
      console.log(`✅ 找到 ${commissionStats.length} 条有commission_amount的订单`);
      
      const withPrimary = commissionStats.filter(r => r.commission_amount_primary != null).length;
      const withSecondary = commissionStats.filter(r => r.secondary_commission_amount != null).length;
      
      console.log(`- 有 commission_amount_primary 值的: ${withPrimary} 条`);
      console.log(`- 有 secondary_commission_amount 值的: ${withSecondary} 条`);
      
      if (commissionStats.length > 0) {
        console.log('\n📋 前3条佣金数据示例:');
        commissionStats.slice(0, 3).forEach((record, index) => {
          console.log(`${index + 1}. 总佣金: ${record.commission_amount}, 一级: ${record.commission_amount_primary}, 二级: ${record.secondary_commission_amount}`);
        });
      }
    }
    
    console.log('\n✅ 数据库检查完成');
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error);
  }
}

checkDatabase();