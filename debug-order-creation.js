const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOrderCreation() {
  console.log('====== 调试订单创建问题 ======\n');
  
  try {
    // 1. 检查表结构和约束
    console.log('1. 检查orders_optimized表的约束：');
    
    // 生成一个订单号
    const orderNumber = `ORD${Date.now()}`;
    console.log('生成的订单号:', orderNumber);
    
    // 2. 模拟完整的订单创建（和购买页面一样）
    console.log('\n2. 模拟完整订单创建：');
    const testOrderData = {
      order_number: orderNumber,
      created_at: new Date().toISOString(),
      status: 'pending',
      payment_status: 'pending',
      sales_code: 'PRI17547196352594604',
      link_code: 'PRI17547196352594604',
      customer_name: 'test_customer_' + Date.now(),
      customer_wechat: 'test_wechat_' + Date.now(),
      tradingview_username: 'test_tv_' + Date.now(),
      duration: '7天',
      purchase_type: 'immediate',
      effective_time: null,
      amount: 0,
      actual_payment_amount: 0,
      alipay_amount: null,
      crypto_amount: null,
      payment_method: null,
      payment_time: new Date().toISOString(),
      screenshot_data: null,
      commission_rate: 0,
      commission_amount: 0,
      primary_commission_amount: 0,
      secondary_commission_amount: 0
    };
    
    console.log('测试订单数据:', JSON.stringify(testOrderData, null, 2));
    
    const { data: newOrder, error: createError } = await supabase
      .from('orders_optimized')
      .insert([testOrderData])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ 创建失败:', createError.message);
      console.error('错误代码:', createError.code);
      console.error('错误详情:', createError.details);
      
      // 分析错误类型
      if (createError.code === '23505') {
        console.log('\n🔍 这是唯一性约束冲突错误！');
        console.log('可能的原因：');
        console.log('1. order_number 重复');
        console.log('2. tradingview_username 在该销售下重复');
        console.log('3. 其他唯一字段冲突');
      } else if (createError.code === '23502') {
        console.log('\n🔍 这是非空约束违反错误！');
        console.log('某个必填字段为空');
      }
    } else {
      console.log('✅ 创建成功，订单ID:', newOrder.id);
      
      // 清理测试数据
      const { error: deleteError } = await supabase
        .from('orders_optimized')
        .delete()
        .eq('id', newOrder.id);
      
      if (!deleteError) {
        console.log('✅ 测试数据已清理');
      }
    }
    
    // 3. 检查可能的重复数据
    console.log('\n3. 检查可能导致重复的数据：');
    
    // 检查是否已经有相同的tradingview_username的7天免费订单
    const testTvUsername = 'existing_user_test';
    const { data: existingOrders, error: checkError } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, duration, status')
      .eq('tradingview_username', testTvUsername)
      .eq('duration', '7天');
    
    if (!checkError) {
      console.log(`${testTvUsername} 的7天订单数量:`, existingOrders.length);
    }
    
    // 4. 检查最近的重复提交
    console.log('\n4. 检查最近可能重复提交的订单：');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentOrders, error: recentError } = await supabase
      .from('orders_optimized')
      .select('tradingview_username, customer_name, created_at, count')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false });
    
    if (!recentError && recentOrders) {
      console.log('最近5分钟的订单:', recentOrders.length);
      
      // 统计重复
      const duplicates = {};
      recentOrders.forEach(order => {
        const key = `${order.tradingview_username}_${order.customer_name}`;
        duplicates[key] = (duplicates[key] || 0) + 1;
      });
      
      const realDuplicates = Object.entries(duplicates).filter(([key, count]) => count > 1);
      if (realDuplicates.length > 0) {
        console.log('发现可能的重复提交:', realDuplicates);
      } else {
        console.log('没有发现重复提交');
      }
    }
    
  } catch (error) {
    console.error('调试失败:', error);
  }
}

debugOrderCreation();