// 测试前端数据获取
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetSales() {
  console.log('📊 测试 getSales 函数逻辑...\n');
  
  try {
    // 模拟前端 getSales 的查询
    const { data: salesData, error } = await supabase
      .from('sales_optimized')
      .select('*')
      .order('total_amount', { ascending: false });
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log(`✅ 获取到 ${salesData?.length || 0} 个销售数据\n`);
    
    // 找出Top5销售（有实际销售额的）
    const top5 = salesData
      .filter(s => s.total_amount > 0)
      .slice(0, 5);
    
    console.log('🏆 Top5 销售排行榜:');
    console.log('─'.repeat(60));
    
    if (top5.length === 0) {
      console.log('⚠️  没有销售额大于0的销售员');
    } else {
      top5.forEach((sale, index) => {
        console.log(`${index + 1}. ${sale.wechat_name || sale.name || '未知'}`);
        console.log(`   类型: ${sale.sales_type}`);
        console.log(`   销售额: $${sale.total_amount}`);
        console.log(`   佣金: $${sale.total_commission || 0}`);
        console.log('');
      });
    }
    
    // 统计订单分类
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('duration, status');
    
    if (!ordersError && orders) {
      const validOrders = orders.filter(o => o.status !== 'rejected');
      const total = validOrders.length;
      
      const stats = {
        '7天': validOrders.filter(o => o.duration === '7天').length,
        '1个月': validOrders.filter(o => o.duration === '1个月').length,
        '3个月': validOrders.filter(o => o.duration === '3个月').length,
        '6个月': validOrders.filter(o => o.duration === '6个月').length,
        '1年': validOrders.filter(o => o.duration === '1年').length,
      };
      
      console.log('\n📈 订单分类统计:');
      console.log('─'.repeat(60));
      Object.entries(stats).forEach(([duration, count]) => {
        const percentage = total > 0 ? (count / total * 100).toFixed(2) : 0;
        console.log(`${duration}: ${count} 笔 (${percentage}%)`);
      });
    }
    
    // 计算转化率
    const totalSales = salesData.length;
    const activeSales = salesData.filter(s => s.total_amount > 0).length;
    const conversionRate = totalSales > 0 ? (activeSales / totalSales * 100).toFixed(2) : 0;
    
    console.log('\n💹 转化率统计:');
    console.log('─'.repeat(60));
    console.log(`总销售员: ${totalSales} 人`);
    console.log(`有业绩销售员: ${activeSales} 人`);
    console.log(`转化率: ${conversionRate}%`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testGetSales();