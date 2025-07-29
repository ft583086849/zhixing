const axios = require('axios');

async function testSalesData() {
  try {
    console.log('=== 测试销售管理数据 ===\n');
    
    // 先登录获取token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: '123456'
    });
    
    if (!loginResponse.data.success) {
      console.error('登录失败:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('登录成功，获取到token');
    
    // 设置请求头
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    // 测试获取销售链接数据
    const response = await axios.get('http://localhost:5000/api/admin/links', config);
    
    if (response.data.success) {
      const links = response.data.data;
      console.log(`获取到 ${links.length} 个销售链接`);
      
      // 检查每个链接的订单数据
      links.forEach((link, index) => {
        const sales = link.sales;
        const orders = link.orders || [];
        const validOrders = orders.filter(o => o.status === 'confirmed_configuration');
        const totalAmount = validOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const commissionRate = sales?.commission_rate || 30;
        const commissionAmount = totalAmount * (commissionRate / 100);
        
        console.log(`\n链接 ${index + 1}:`);
        console.log(`  销售: ${sales?.wechat_name || '无'}`);
        console.log(`  佣金比率: ${commissionRate}%`);
        console.log(`  总订单数: ${orders.length}`);
        console.log(`  有效订单数: ${validOrders.length}`);
        console.log(`  有效订单金额: $${totalAmount}`);
        console.log(`  应返佣金额: $${commissionAmount.toFixed(2)}`);
        
        if (validOrders.length > 0) {
          console.log(`  有效订单详情:`);
          validOrders.forEach(o => {
            console.log(`    - 订单ID: ${o.id}, 金额: $${o.amount}, 状态: ${o.status}`);
          });
        }
      });
    } else {
      console.error('获取销售链接失败:', response.data.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testSalesData(); 