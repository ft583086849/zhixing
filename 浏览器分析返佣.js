// 在浏览器控制台运行此脚本
// 请先登录到 https://zhixing-seven.vercel.app/admin/dashboard

async function analyzeCommissions() {
  console.log('%c===== 销售返佣金额分析报告 =====', 'color: #1890ff; font-size: 16px; font-weight: bold;');
  
  try {
    // 从API获取销售数据
    const salesResponse = await fetch('/api/admin/sales', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!salesResponse.ok) {
      console.error('获取销售数据失败，请确保已登录管理员账户');
      return;
    }
    
    const salesData = await salesResponse.json();
    console.log('原始销售数据:', salesData);
    
    // 获取订单数据
    const ordersResponse = await fetch('/api/admin/orders?status=confirmed_config', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!ordersResponse.ok) {
      console.error('获取订单数据失败');
      return;
    }
    
    const ordersData = await ordersResponse.json();
    console.log('原始订单数据:', ordersData);
    
    // 分析返佣组成
    let totalCommission = 0;
    const commissionDetails = [];
    
    // 从销售数据分析
    if (salesData.sales && Array.isArray(salesData.sales)) {
      salesData.sales.forEach(sale => {
        if (sale.commission_amount > 0) {
          totalCommission += sale.commission_amount;
          
          console.log(`\n%c【${sale.name || sale.wechat_name}】`, 'color: #52c41a; font-weight: bold;');
          console.log(`销售类型: ${sale.sales_display_type || sale.sales_type}`);
          console.log(`总订单数: ${sale.total_orders}`);
          console.log(`有效订单数: ${sale.effective_orders}`);
          console.log(`订单总额: $${sale.total_amount?.toFixed(2) || '0.00'}`);
          console.log(`已配置确认金额: $${sale.confirmed_amount?.toFixed(2) || '0.00'}`);
          console.log(`佣金率: ${sale.commission_rate}%`);
          console.log(`应返佣金: $${sale.commission_amount?.toFixed(2) || '0.00'}`);
          console.log(`已返佣金: $${sale.paid_commission?.toFixed(2) || '0.00'}`);
          console.log(`待返佣金: $${sale.pending_commission?.toFixed(2) || '0.00'}`);
          
          // 如果有订单详情
          if (sale.orders && sale.orders.length > 0) {
            console.log('\n订单明细:');
            sale.orders.forEach(order => {
              if (order.status === 'confirmed_config') {
                const orderCommission = order.amount * (sale.commission_rate / 100);
                console.log(`  - 订单#${order.id}: 买家[${order.user_wechat}] 金额[$${order.amount}] 佣金[$${orderCommission.toFixed(2)}]`);
              }
            });
          }
        }
      });
    }
    
    // 从订单数据分析详细信息
    if (ordersData.orders && Array.isArray(ordersData.orders)) {
      console.log('\n%c===== 订单详细分析 =====', 'color: #722ed1; font-size: 14px; font-weight: bold;');
      
      ordersData.orders.forEach((order, index) => {
        if (order.status === 'confirmed_config') {
          console.log(`\n%c订单 ${index + 1}:`, 'color: #fa8c16; font-weight: bold;');
          console.log(`订单ID: ${order.id}`);
          console.log(`买家微信: ${order.user_wechat || '-'}`);
          console.log(`TradingView: ${order.tradingview_username || '-'}`);
          console.log(`订单金额: $${order.amount}`);
          console.log(`销售微信: ${order.sales_wechat || '-'}`);
          console.log(`销售类型: ${order.sales_type || '-'}`);
          console.log(`一级销售: ${order.primary_sales_wechat || '-'}`);
          console.log(`下单时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
          
          // 计算该订单的佣金
          let orderCommission = 0;
          if (order.sales_type === '二级销售' && order.secondary_commission_rate) {
            // 二级销售佣金
            const secondaryCommission = order.amount * (order.secondary_commission_rate / 100);
            const primaryCommission = order.amount * ((40 - order.secondary_commission_rate) / 100);
            orderCommission = secondaryCommission + primaryCommission;
            console.log(`二级销售佣金: $${secondaryCommission.toFixed(2)} (${order.secondary_commission_rate}%)`);
            console.log(`一级销售佣金: $${primaryCommission.toFixed(2)} (${40 - order.secondary_commission_rate}%)`);
          } else {
            // 一级或独立销售
            orderCommission = order.amount * 0.4;
            console.log(`销售佣金: $${orderCommission.toFixed(2)} (40%)`);
          }
          console.log(`订单总佣金: $${orderCommission.toFixed(2)}`);
        }
      });
    }
    
    console.log('\n%c===== 汇总 =====', 'color: #1890ff; font-size: 16px; font-weight: bold;');
    console.log(`%c总返佣金额: $${totalCommission.toFixed(2)}`, 'color: #f5222d; font-size: 18px; font-weight: bold;');
    console.log(`预期值: $444.00`);
    console.log(`差异: $${(444 - totalCommission).toFixed(2)}`);
    
    // 获取统计数据
    const statsResponse = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('\n系统统计数据:');
      console.log(`总订单数: ${stats.total_orders}`);
      console.log(`总收入: $${stats.total_revenue?.toFixed(2) || '0.00'}`);
      console.log(`销售返佣金额: $${stats.sales_commission?.toFixed(2) || '0.00'}`);
    }
    
  } catch (error) {
    console.error('分析失败:', error);
  }
}

// 自动执行
console.log('开始分析销售返佣金额组成...');
console.log('请确保您已登录管理员账户');
analyzeCommissions();
