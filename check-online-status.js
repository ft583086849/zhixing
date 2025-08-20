const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOnlineStatus() {
  console.log('====== 检查线上系统状态 ======\n');
  
  try {
    // 1. 查看最近创建的订单
    console.log('1. 最近创建的订单（按创建时间倒序）：');
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('id, customer_name, sales_code, amount, commission_amount, primary_commission_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.error('查询订单失败:', ordersError);
    } else {
      console.table(recentOrders.map(o => ({
        订单ID: String(o.id).substring(0, 8) + '...',
        客户: o.customer_name,
        销售代码: o.sales_code,
        金额: o.amount,
        旧佣金字段: o.commission_amount,
        新佣金字段: o.primary_commission_amount,
        状态: o.status,
        创建时间: new Date(o.created_at).toLocaleString('zh-CN')
      })));
    }
    
    // 2. 检查触发器是否正常工作
    console.log('\n2. 检查佣金字段设置情况：');
    const { data: commissionCheck, error: checkError } = await supabase
      .from('orders_optimized')
      .select('count')
      .not('commission_amount', 'is', null)
      .not('primary_commission_amount', 'is', null)
      .single();
    
    if (!checkError && commissionCheck) {
      console.log(`✅ 同时设置了两个佣金字段的订单数: ${commissionCheck.count}`);
    }
    
    const { data: oldOnlyCheck } = await supabase
      .from('orders_optimized')
      .select('count')
      .not('commission_amount', 'is', null)
      .is('primary_commission_amount', null)
      .single();
    
    if (oldOnlyCheck) {
      console.log(`⚠️ 只设置了旧佣金字段的订单数: ${oldOnlyCheck.count}`);
    }
    
    const { data: newOnlyCheck } = await supabase
      .from('orders_optimized')
      .select('count')
      .is('commission_amount', null)
      .not('primary_commission_amount', 'is', null)
      .single();
    
    if (newOnlyCheck) {
      console.log(`⚠️ 只设置了新佣金字段的订单数: ${newOnlyCheck.count}`);
    }
    
    // 3. 检查触发器状态
    console.log('\n3. 检查数据库触发器状态：');
    let triggers = null;
    try {
      const { data, error } = await supabase
        .rpc('get_triggers_info', {
          table_name: 'orders_optimized'
        });
      triggers = data;
    } catch (e) {
      // 忽略错误
    }
    
    if (triggers) {
      console.log('触发器信息:', triggers);
    } else {
      console.log('无法获取触发器信息（需要管理员权限）');
    }
    
    // 4. 测试销售代码
    const testSalesCode = 'PRI17547196352594604';
    console.log(`\n4. 测试销售代码 ${testSalesCode}：`);
    
    const { data: salesInfo, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_code', testSalesCode)
      .single();
    
    if (salesError) {
      console.error('销售代码不存在或查询失败:', salesError.message);
    } else {
      console.log('销售信息:');
      console.log(`- 销售姓名: ${salesInfo.username}`);
      console.log(`- 销售类型: ${salesInfo.sales_type}`);
      console.log(`- 佣金率: ${(salesInfo.commission_rate * 100).toFixed(2)}%`);
      console.log(`- 状态: ${salesInfo.status}`);
      console.log(`- 上级销售: ${salesInfo.parent_sales_code || '无'}`);
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkOnlineStatus();