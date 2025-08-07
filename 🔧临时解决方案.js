/**
 * 临时解决方案 - 直接在控制台创建查询功能
 * 如果页面刷新后仍然无法使用，运行此脚本
 */

// 直接创建查询函数
async function queryZhixing() {
  console.clear();
  console.log('🔍 直接查询 Zhixing 的二级销售数据...\n');
  
  const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';
  
  try {
    // 1. 查询二级销售信息
    console.log('步骤1: 查询二级销售信息...');
    const salesResponse = await fetch(
      `${supabaseUrl}/rest/v1/secondary_sales?wechat_name=eq.Zhixing&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    const salesData = await salesResponse.json();
    
    if (!salesData || salesData.length === 0) {
      console.error('❌ 未找到 Zhixing 的二级销售记录');
      console.log('请确认 Zhixing 已经通过二级销售注册流程');
      return;
    }
    
    const sales = salesData[0];
    console.log('✅ 找到二级销售记录:');
    console.log('- 微信号:', sales.wechat_name);
    console.log('- 销售代码:', sales.sales_code);
    console.log('- 佣金率:', sales.commission_rate || 0.1);
    console.log('- 注册时间:', new Date(sales.created_at).toLocaleString());
    
    // 2. 查询订单
    console.log('\n步骤2: 查询相关订单...');
    const ordersResponse = await fetch(
      `${supabaseUrl}/rest/v1/orders?sales_code=eq.${sales.sales_code}&select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    const orders = await ordersResponse.json();
    console.log(`✅ 找到 ${orders.length} 个订单`);
    
    // 3. 计算统计
    const confirmedOrders = orders.filter(o => o.config_confirmed === true);
    const totalAmount = confirmedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalCommission = totalAmount * (sales.commission_rate || 0.1);
    
    console.log('\n📊 统计数据:');
    console.log('- 总订单数:', orders.length);
    console.log('- 已确认订单:', confirmedOrders.length);
    console.log('- 总金额: ¥', totalAmount.toFixed(2));
    console.log('- 预计佣金: ¥', totalCommission.toFixed(2));
    
    // 4. 显示订单详情
    if (orders.length > 0) {
      console.log('\n📋 订单详情:');
      orders.forEach((order, index) => {
        console.log(`\n订单 ${index + 1}:`);
        console.log('- ID:', order.id);
        console.log('- 客户微信:', order.customer_wechat);
        console.log('- 金额: ¥', order.amount);
        console.log('- 状态:', order.status);
        console.log('- 配置确认:', order.config_confirmed ? '✅' : '❌');
        console.log('- 创建时间:', new Date(order.created_at).toLocaleString());
      });
    }
    
    // 5. 在页面上显示结果
    console.log('\n' + '='.repeat(60));
    console.log('✅ 查询完成！');
    console.log('Zhixing 作为二级销售的数据已成功获取');
    console.log('\n💡 提示: 页面功能修复后，您可以直接在页面上查询');
    console.log('='.repeat(60));
    
    // 返回数据供进一步使用
    return {
      sales,
      orders,
      stats: {
        totalOrders: orders.length,
        confirmedOrders: confirmedOrders.length,
        totalAmount,
        totalCommission
      }
    };
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
    console.log('\n可能的原因:');
    console.log('1. 网络连接问题');
    console.log('2. Supabase 服务暂时不可用');
    console.log('3. 数据权限问题');
  }
}

// 立即执行查询
queryZhixing().then(result => {
  if (result) {
    console.log('\n💾 查询结果已保存到变量 window.zhixingData');
    window.zhixingData = result;
    console.log('您可以通过 window.zhixingData 访问完整数据');
  }
});

