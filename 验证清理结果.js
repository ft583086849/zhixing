// 在管理后台控制台运行，验证数据是否清理成功

console.log('🔍 验证数据清理结果...\n');

async function verifyCleanup() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('请先登录管理员账号');
    return;
  }
  
  try {
    // 检查订单
    const ordersRes = await fetch('https://zhixing-seven.vercel.app/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const ordersData = await ordersRes.json();
    const orderCount = ordersData.data?.length || 0;
    
    // 检查销售
    const salesRes = await fetch('https://zhixing-seven.vercel.app/api/admin/sales', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const salesData = await salesRes.json();
    const salesCount = salesData.data?.length || 0;
    
    // 检查客户
    const customersRes = await fetch('https://zhixing-seven.vercel.app/api/admin/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const customersData = await customersRes.json();
    const customerCount = customersData.data?.length || 0;
    
    console.log('📊 数据统计：');
    console.log(`- 订单数量: ${orderCount}`);
    console.log(`- 销售数量: ${salesCount}`);
    console.log(`- 客户数量: ${customerCount}`);
    
    if (orderCount === 0 && salesCount === 0 && customerCount === 0) {
      console.log('\n✅ 数据清理成功！系统已准备好投入使用');
      console.log('\n下一步：');
      console.log('1. 创建第一个真实的一级销售');
      console.log('2. 设置支付配置');
      console.log('3. 开始运营！');
    } else {
      console.log('\n⚠️ 仍有数据存在，可能需要再次清理');
    }
    
  } catch (error) {
    console.error('验证失败:', error);
  }
}

verifyCleanup();
