#!/usr/bin/env node

/**
 * 全面分析佣金系统字段和计算逻辑
 * 
 * 目标：理清待返佣的逻辑，找出所有相关字段和计算关系
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeCommissionFields() {
  console.log('🔍 全面分析佣金系统字段和计算逻辑\n');
  console.log('═'.repeat(60));
  
  try {
    // 1. 分析数据库表结构
    console.log('\n📊 一、数据库表结构分析');
    console.log('─'.repeat(40));
    
    // 1.1 orders_optimized表
    console.log('\n1. orders_optimized表（订单表）:');
    const { data: orderSample } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(1);
    
    if (orderSample && orderSample.length > 0) {
      const commissionFields = [];
      Object.keys(orderSample[0]).forEach(key => {
        if (key.includes('commission') || key.includes('amount') || key.includes('rate')) {
          commissionFields.push(key);
        }
      });
      console.log('   佣金相关字段:');
      commissionFields.forEach(field => {
        console.log(`   • ${field}`);
      });
    }
    
    // 1.2 sales_optimized表
    console.log('\n2. sales_optimized表（销售表）:');
    const { data: salesSample } = await supabase
      .from('sales_optimized')
      .select('*')
      .limit(1);
    
    if (salesSample && salesSample.length > 0) {
      const commissionFields = [];
      Object.keys(salesSample[0]).forEach(key => {
        if (key.includes('commission') || key.includes('paid') || key.includes('total')) {
          commissionFields.push(key);
        }
      });
      console.log('   佣金相关字段:');
      commissionFields.forEach(field => {
        console.log(`   • ${field}`);
      });
    }
    
    // 2. 字段含义和存储逻辑
    console.log('\n\n📝 二、字段含义和存储逻辑');
    console.log('─'.repeat(40));
    
    console.log('\n【orders_optimized表】');
    console.log('• commission_amount: 该订单产生的总佣金（一级+二级）');
    console.log('• primary_commission_amount: 一级销售的佣金');
    console.log('• secondary_commission_amount: 二级销售的佣金');
    console.log('• commission_rate: 一级佣金率');
    console.log('• secondary_commission_rate: 二级佣金率');
    console.log('• commission_paid: 佣金是否已支付（布尔值）');
    console.log('• commission_paid_date: 佣金支付日期');
    
    console.log('\n【sales_optimized表】');
    console.log('• total_commission: 该销售应获得的总佣金');
    console.log('• paid_commission: 已支付给该销售的佣金');
    console.log('• 待返佣金 = total_commission - paid_commission（不存储，实时计算）');
    
    // 3. 实际数据统计
    console.log('\n\n📈 三、实际数据统计');
    console.log('─'.repeat(40));
    
    // 3.1 订单表统计
    console.log('\n1. 订单表佣金统计:');
    const { data: orders } = await supabase
      .from('orders_optimized')
      .select('commission_amount, primary_commission_amount, secondary_commission_amount, status')
      .neq('status', 'rejected');
    
    if (orders) {
      const stats = {
        commission_amount: 0,
        primary_commission: 0,
        secondary_commission: 0,
        count: orders.length
      };
      
      orders.forEach(o => {
        stats.commission_amount += parseFloat(o.commission_amount || 0);
        stats.primary_commission += parseFloat(o.primary_commission_amount || 0);
        stats.secondary_commission += parseFloat(o.secondary_commission_amount || 0);
      });
      
      console.log(`   • 订单总数: ${stats.count}`);
      console.log(`   • commission_amount总和: ${stats.commission_amount.toFixed(2)} 元`);
      console.log(`   • 一级佣金总和: ${stats.primary_commission.toFixed(2)} 元`);
      console.log(`   • 二级佣金总和: ${stats.secondary_commission.toFixed(2)} 元`);
    }
    
    // 3.2 销售表统计
    console.log('\n2. 销售表佣金统计:');
    const { data: sales } = await supabase
      .from('sales_optimized')
      .select('wechat_name, total_commission, paid_commission');
    
    if (sales) {
      const stats = {
        total_commission: 0,
        paid_commission: 0,
        pending_commission: 0,
        salesWithPending: []
      };
      
      sales.forEach(s => {
        const total = parseFloat(s.total_commission || 0);
        const paid = parseFloat(s.paid_commission || 0);
        const pending = total - paid;
        
        stats.total_commission += total;
        stats.paid_commission += paid;
        stats.pending_commission += pending;
        
        if (pending > 0) {
          stats.salesWithPending.push({
            name: s.wechat_name,
            total,
            paid,
            pending
          });
        }
      });
      
      console.log(`   • 销售总数: ${sales.length}`);
      console.log(`   • 应返佣金总和: ${stats.total_commission.toFixed(2)} 元`);
      console.log(`   • 已返佣金总和: ${stats.paid_commission.toFixed(2)} 元`);
      console.log(`   • 待返佣金总和: ${stats.pending_commission.toFixed(2)} 元 ⭐`);
      
      if (stats.salesWithPending.length > 0) {
        console.log('\n   有待返佣金的销售:');
        stats.salesWithPending.forEach(s => {
          console.log(`   • ${s.name}: 待返 ${s.pending.toFixed(2)} 元（应返${s.total.toFixed(2)} - 已返${s.paid.toFixed(2)}）`);
        });
      } else {
        console.log('\n   ✅ 所有销售的佣金都已支付完毕（待返=0）');
      }
    }
    
    // 4. 计算逻辑说明
    console.log('\n\n🧮 四、计算逻辑说明');
    console.log('─'.repeat(40));
    
    console.log('\n1. 订单级别计算（orders_optimized）:');
    console.log('   • 创建订单时，根据佣金率计算commission_amount');
    console.log('   • 如果有二级销售，计算secondary_commission_amount');
    console.log('   • commission_amount = primary_commission_amount + secondary_commission_amount');
    
    console.log('\n2. 销售级别汇总（sales_optimized）:');
    console.log('   • total_commission = SUM(该销售相关的所有订单佣金)');
    console.log('   • paid_commission = 实际已支付的金额（手动更新）');
    console.log('   • 待返佣金 = total_commission - paid_commission');
    
    console.log('\n3. 统计页面显示:');
    console.log('   • 销售返佣金额 = SUM(sales_optimized.total_commission)');
    console.log('   • 已返佣金额 = SUM(sales_optimized.paid_commission)');
    console.log('   • 待返佣金额 = SUM(sales_optimized.total_commission - paid_commission)');
    
    // 5. 问题诊断
    console.log('\n\n🔍 五、问题诊断');
    console.log('─'.repeat(40));
    
    const { data: orderStats } = await supabase
      .from('orders_optimized')
      .select('commission_amount')
      .neq('status', 'rejected');
    
    const orderCommissionSum = orderStats?.reduce((sum, o) => 
      sum + parseFloat(o.commission_amount || 0), 0) || 0;
    
    const { data: salesStats } = await supabase
      .from('sales_optimized')
      .select('total_commission, paid_commission');
    
    const salesPendingSum = salesStats?.reduce((sum, s) => {
      const total = parseFloat(s.total_commission || 0);
      const paid = parseFloat(s.paid_commission || 0);
      return sum + (total - paid);
    }, 0) || 0;
    
    console.log(`\n订单表commission_amount总和: ${orderCommissionSum.toFixed(2)} 元`);
    console.log(`销售表待返佣金总和: ${salesPendingSum.toFixed(2)} 元`);
    
    if (Math.abs(orderCommissionSum - 3276) < 1) {
      console.log('\n⚠️ 发现问题！');
      console.log(`订单表commission_amount总和（${orderCommissionSum.toFixed(2)}）≈ 3276`);
      console.log('这就是页面显示3276的来源！');
      
      if (salesPendingSum === 0) {
        console.log('\n❌ BUG确认：');
        console.log('• 页面错误地使用了订单表的commission_amount总和作为待返佣金');
        console.log('• 实际待返佣金应该是0（从销售表计算）');
        console.log('• 需要修复API中的计算逻辑');
      }
    }
    
    // 6. 关联关系图
    console.log('\n\n🔗 六、字段关联关系');
    console.log('─'.repeat(40));
    console.log(`
订单创建时:
  orders_optimized.commission_amount = 订单金额 × 佣金率
                   ↓
销售汇总时:
  sales_optimized.total_commission = SUM(相关订单的commission_amount)
                   ↓
支付佣金时:
  sales_optimized.paid_commission = 实际支付金额
                   ↓
页面显示时:
  待返佣金 = total_commission - paid_commission
  
⚠️ 注意：待返佣金应该从sales_optimized表计算，不是orders_optimized表！
`);
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
  }
}

analyzeCommissionFields();