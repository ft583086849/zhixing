const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 配置环境变量
require('dotenv').config({ path: path.join(__dirname, 'client', '.env') });

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReminderData() {
  console.log('🧪 测试催单订单数据完整性\n');

  try {
    // 1. 检查字段是否存在
    console.log('📊 步骤1: 验证数据库字段...');
    const { data: fieldsCheck, error: fieldsError } = await supabase
      .from('orders_optimized')
      .select('is_reminded, reminded_at')
      .limit(1);
    
    if (fieldsError && fieldsError.message.includes('does not exist')) {
      console.log('❌ 催单字段不存在:', fieldsError.message);
      return;
    } else {
      console.log('✅ 催单字段已存在');
    }

    // 2. 模拟getPrimarySalesSettlement的查询
    console.log('\n📊 步骤2: 模拟催单订单查询...');
    
    const testSalesCode = 'PRI17547241780648255'; // WML792355703的代码
    
    const { data: reminderOrders, error: reminderError } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('sales_code', testSalesCode)
      .in('status', ['confirmed_config', 'active']);
    
    if (reminderError) {
      console.log('❌ 查询催单订单失败:', reminderError.message);
      return;
    }

    console.log(`✅ 找到 ${reminderOrders?.length || 0} 个已生效订单`);
    
    // 3. 检查订单数据完整性
    if (reminderOrders && reminderOrders.length > 0) {
      console.log('\n📊 步骤3: 检查订单数据完整性...');
      
      reminderOrders.forEach((order, index) => {
        console.log(`\n订单 ${index + 1} (ID: ${order.id}):`);
        console.log(`  customer_wechat: ${order.customer_wechat || '❌ 无数据'}`);
        console.log(`  wechat_name: ${order.wechat_name || '❌ 无数据'}`);
        console.log(`  tradingview_username: ${order.tradingview_username || '❌ 无数据'}`);
        console.log(`  status: ${order.status}`);
        console.log(`  is_reminded: ${order.is_reminded || false}`);
        console.log(`  expiry_time: ${order.expiry_time || '需计算'}`);
        
        // 显示客户信息（模拟前端逻辑）
        const customerInfo = order.customer_wechat || order.wechat_name || order.tradingview_username || '未知客户';
        console.log(`  👤 显示的客户信息: ${customerInfo}`);
        
        if (customerInfo === '未知客户') {
          console.log(`  ⚠️ 警告: 此订单客户信息缺失`);
        }
      });
      
      // 4. 统计客户信息完整性
      console.log('\n📊 步骤4: 客户信息完整性统计...');
      
      const stats = {
        total: reminderOrders.length,
        hasCustomerWechat: 0,
        hasWechatName: 0,
        hasTradingViewUsername: 0,
        hasAnyCustomerInfo: 0,
        noCustomerInfo: 0
      };
      
      reminderOrders.forEach(order => {
        if (order.customer_wechat) stats.hasCustomerWechat++;
        if (order.wechat_name) stats.hasWechatName++;
        if (order.tradingview_username) stats.hasTradingViewUsername++;
        
        const hasAny = order.customer_wechat || order.wechat_name || order.tradingview_username;
        if (hasAny) {
          stats.hasAnyCustomerInfo++;
        } else {
          stats.noCustomerInfo++;
        }
      });
      
      console.log('统计结果:');
      console.log(`  总订单数: ${stats.total}`);
      console.log(`  有客户微信: ${stats.hasCustomerWechat} (${(stats.hasCustomerWechat/stats.total*100).toFixed(1)}%)`);
      console.log(`  有微信名: ${stats.hasWechatName} (${(stats.hasWechatName/stats.total*100).toFixed(1)}%)`);
      console.log(`  有TradingView用户名: ${stats.hasTradingViewUsername} (${(stats.hasTradingViewUsername/stats.total*100).toFixed(1)}%)`);
      console.log(`  有任何客户信息: ${stats.hasAnyCustomerInfo} (${(stats.hasAnyCustomerInfo/stats.total*100).toFixed(1)}%)`);
      console.log(`  缺失客户信息: ${stats.noCustomerInfo} (${(stats.noCustomerInfo/stats.total*100).toFixed(1)}%)`);
      
      // 5. 分析问题原因
      console.log('\n📊 步骤5: 问题分析...');
      
      if (stats.noCustomerInfo > 0) {
        console.log('❌ 发现数据缺失问题:');
        console.log(`  ${stats.noCustomerInfo} 个订单缺少客户信息`);
        console.log('  这会导致催单列表显示"未知客户"');
        
        console.log('\n💡 可能的原因:');
        console.log('  1. 订单创建时客户信息未正确填写');
        console.log('  2. 数据迁移或导入时丢失了客户信息');
        console.log('  3. 字段映射不正确');
        
        console.log('\n🔧 建议解决方案:');
        console.log('  1. 检查订单创建流程，确保客户信息必填');
        console.log('  2. 对于已存在的订单，可考虑从其他来源补充客户信息');
        console.log('  3. 在催单界面增加订单ID显示，方便追踪');
      } else {
        console.log('✅ 所有订单都有客户信息，数据完整性良好');
      }
      
    } else {
      console.log('ℹ️ 该销售员没有需要催单的订单');
    }

    // 6. 测试催单字段更新
    console.log('\n📊 步骤6: 测试催单功能...');
    
    if (reminderOrders && reminderOrders.length > 0) {
      const testOrder = reminderOrders[0];
      console.log(`准备测试催单订单: ${testOrder.id}`);
      
      // 模拟催单操作
      const { error: updateError } = await supabase
        .from('orders_optimized')
        .update({
          is_reminded: true,
          reminded_at: new Date().toISOString()
        })
        .eq('id', testOrder.id);
      
      if (!updateError) {
        console.log('✅ 催单功能测试成功');
        
        // 恢复原状态
        await supabase
          .from('orders_optimized')
          .update({
            is_reminded: false,
            reminded_at: null
          })
          .eq('id', testOrder.id);
          
        console.log('✅ 测试后已恢复原状态');
      } else {
        console.log('❌ 催单功能测试失败:', updateError.message);
      }
    }

  } catch (error) {
    console.error('❌ 测试过程出错:', error);
  }
}

// 执行测试
testReminderData();