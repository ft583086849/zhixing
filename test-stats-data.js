const { adminAPI } = require('./client/src/services/api.js');

async function testStats() {
  try {
    console.log('测试获取统计数据...');
    const stats = await adminAPI.getStats({ timeRange: 'all' });
    console.log('统计数据:', JSON.stringify(stats, null, 2));
    
    console.log('\n测试获取销售数据...');
    const sales = await adminAPI.getSales({});
    console.log('销售数量:', sales.length);
    if (sales.length > 0) {
      console.log('第一个销售数据样例:', JSON.stringify(sales[0], null, 2));
    }
    
    // 计算实际的统计
    const primarySales = sales.filter(s => s.sales_type === 'primary');
    const secondarySales = sales.filter(s => s.sales_type === 'secondary');
    const independentSales = sales.filter(s => {
      return s.sales_type === 'independent' || 
             (s.sales_type === 'secondary' && !s.sales?.primary_sales_id);
    });
    
    console.log('\n销售类型统计:');
    console.log('一级销售:', primarySales.length);
    console.log('二级销售:', secondarySales.filter(s => s.sales?.primary_sales_id).length);
    console.log('独立销售:', independentSales.length);
    
    // 统计订单类型
    const durationCounts = {};
    sales.forEach(sale => {
      if (sale.orders) {
        sale.orders.forEach(order => {
          if (order.status !== 'rejected') {
            durationCounts[order.duration] = (durationCounts[order.duration] || 0) + 1;
          }
        });
      }
    });
    
    console.log('\n订单时长统计:', durationCounts);
    
    // 计算Top5销售
    const sortedSales = [...sales]
      .filter(s => s.total_amount > 0)
      .sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
      .slice(0, 5);
    
    console.log('\nTop5销售排行:');
    sortedSales.forEach((sale, index) => {
      console.log(`${index + 1}. ${sale.sales?.wechat_name || sale.sales?.name || '未知'}: $${sale.total_amount || 0}`);
    });
    
  } catch (error) {
    console.error('错误:', error.message);
  }
  process.exit(0);
}

testStats();