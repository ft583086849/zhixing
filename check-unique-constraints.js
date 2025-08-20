const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUniqueConstraints() {
  console.log('====== 检查数据库唯一约束 ======\n');
  
  try {
    // 1. 检查最近失败的订单
    console.log('1. 检查最近的重复订单（按创建时间倒序）：');
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('id, customer_name, tradingview_username, sales_code, duration, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ordersError) {
      console.error('查询订单失败:', ordersError);
    } else {
      // 查找重复的tradingview_username
      const tvCounts = {};
      recentOrders.forEach(o => {
        const tv = o.tradingview_username;
        if (tv) {
          tvCounts[tv] = (tvCounts[tv] || 0) + 1;
        }
      });
      
      console.log('\nTradingView用户名统计：');
      Object.entries(tvCounts).forEach(([tv, count]) => {
        if (count > 1) {
          console.log(`⚠️ ${tv}: ${count}次`);
        }
      });
      
      console.log('\n最近10条订单：');
      console.table(recentOrders.map(o => ({
        ID: o.id,
        客户: o.customer_name,
        TV用户名: o.tradingview_username,
        销售代码: o.sales_code,
        时长: o.duration,
        状态: o.status,
        创建时间: new Date(o.created_at).toLocaleString('zh-CN')
      })));
    }
    
    // 2. 检查7天免费订单的重复情况
    console.log('\n2. 检查7天免费订单重复情况：');
    const { data: freeOrders, error: freeError } = await supabase
      .from('orders_optimized')
      .select('tradingview_username, count')
      .eq('duration', '7天')
      .order('created_at', { ascending: false });
    
    if (!freeError && freeOrders) {
      const tvFreeCount = {};
      freeOrders.forEach(o => {
        const tv = o.tradingview_username;
        if (tv) {
          tvFreeCount[tv] = (tvFreeCount[tv] || 0) + 1;
        }
      });
      
      const duplicates = Object.entries(tvFreeCount).filter(([tv, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log('发现重复的7天免费订单：');
        duplicates.forEach(([tv, count]) => {
          console.log(`- ${tv}: ${count}个订单`);
        });
      } else {
        console.log('✅ 没有重复的7天免费订单');
      }
    }
    
    // 3. 模拟创建订单看看会不会报错
    console.log('\n3. 测试订单创建约束：');
    const testOrder = {
      customer_name: 'test_' + Date.now(),
      tradingview_username: 'test_tv_' + Date.now(),
      sales_code: 'PRI17547196352594604',
      duration: '7天',
      amount: 0,
      status: 'pending_payment'
    };
    
    console.log('尝试创建测试订单...');
    const { data: newOrder, error: createError } = await supabase
      .from('orders_optimized')
      .insert([testOrder])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ 创建失败:', createError.message);
      console.error('错误代码:', createError.code);
      console.error('错误详情:', createError.details);
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
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkUniqueConstraints();