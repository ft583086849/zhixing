/**
 * 统一数据源的 getSales 方法
 * 使用一级销售对账页面的逻辑作为标准
 */

export async function getUnifiedSalesData(params = {}) {
  try {
    const SupabaseService = window.SupabaseService || require('./supabase').SupabaseService;
    
    // 获取所有一级销售
    const primarySales = await SupabaseService.getPrimarySales();
    const secondarySales = await SupabaseService.getSecondarySales();
    const orders = await SupabaseService.getOrders();
    
    const processedData = [];
    
    // 处理一级销售 - 使用 getPrimarySalesSettlement 的逻辑
    for (const primarySale of primarySales) {
      try {
        // 调用标准的一级销售对账数据
        const settlementData = await SupabaseService.getPrimarySalesSettlement({
          wechat_name: primarySale.wechat_name
        });
        
        if (settlementData) {
          // 转换数据格式以适配管理员页面
          const { sales, statistics, secondary_sales } = settlementData;
          
          // 生成链接
          const baseUrl = window.location.origin;
          const purchaseLink = `${baseUrl}/purchase?sales_code=${sales.sales_code}`;
          const salesRegisterLink = `${baseUrl}/secondary-sales?sales_code=${sales.sales_code}`;
          
          const links = [
            {
              type: 'purchase',
              title: '用户购买链接',
              code: sales.sales_code,
              fullUrl: purchaseLink,
              description: '分享给用户进行购买'
            },
            {
              type: 'sales_register',
              title: '分销注册链接',
              code: sales.sales_code,
              fullUrl: salesRegisterLink,
              description: '招募二级销售注册'
            }
          ];
          
          processedData.push({
            // 保留原始销售数据
            sales: {
              ...sales,
              sales_type: 'primary',
              payment_method: sales.payment_method,
              payment_account: sales.payment_account
            },
            // 统计数据
            sales_type: 'primary',
            sales_display_type: '一级销售',
            total_orders: statistics.totalOrders || 0,
            valid_orders: statistics.totalOrders || 0,  // 已确认订单
            total_amount: statistics.totalAmount || 0,
            confirmed_amount: statistics.totalAmount || 0,  // 已确认金额
            commission_rate: (sales.commission_rate * 100) || 40,  // 转换为百分比
            commission_amount: statistics.totalCommission || 0,
            hierarchy_info: '一级销售',
            secondary_sales_count: secondary_sales?.length || 0,
            links: links,
            // 添加本月和当日数据
            month_orders: statistics.monthOrders || 0,
            month_amount: statistics.monthAmount || 0,
            month_commission: statistics.monthCommission || 0,
            today_orders: statistics.todayOrders || 0,
            today_amount: statistics.todayAmount || 0,
            today_commission: statistics.todayCommission || 0
          });
        }
      } catch (error) {
        console.error(`获取一级销售 ${primarySale.wechat_name} 数据失败:`, error);
        // 如果获取失败，使用基础数据
        processedData.push({
          sales: {
            ...primarySale,
            sales_type: 'primary'
          },
          sales_type: 'primary',
          sales_display_type: '一级销售',
          total_orders: 0,
          valid_orders: 0,
          total_amount: 0,
          confirmed_amount: 0,
          commission_rate: 40,
          commission_amount: 0,
          hierarchy_info: '一级销售',
          secondary_sales_count: 0
        });
      }
    }
    
    // 处理独立的二级销售（没有上级的）
    const independentSales = secondarySales.filter(s => !s.primary_sales_id);
    
    for (const sale of independentSales) {
      // 获取该销售的订单
      const saleOrders = orders.filter(order => 
        order.sales_code === sale.sales_code &&
        order.status !== 'rejected'
      );
      
      const confirmedOrders = saleOrders.filter(order => 
        ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)
      );
      
      const totalAmount = confirmedOrders.reduce((sum, order) => {
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        if (order.payment_method === 'alipay') {
          return sum + (amount / 7.15);
        }
        return sum + amount;
      }, 0);
      
      // 独立销售固定30%佣金率
      const commissionRate = 30;
      const commissionAmount = totalAmount * 0.3;
      
      processedData.push({
        sales: {
          ...sale,
          sales_type: 'independent',
          payment_method: sale.payment_method,
          payment_account: sale.payment_account
        },
        sales_type: 'independent',
        sales_display_type: '独立销售',
        total_orders: saleOrders.length,
        valid_orders: confirmedOrders.length,
        total_amount: Math.round(totalAmount * 100) / 100,
        confirmed_amount: Math.round(totalAmount * 100) / 100,
        commission_rate: commissionRate,
        commission_amount: Math.round(commissionAmount * 100) / 100,
        hierarchy_info: '独立销售'
      });
    }
    
    // 应用搜索和过滤
    let filteredData = processedData;
    
    // 销售类型过滤
    if (params.sales_type) {
      filteredData = filteredData.filter(item => item.sales_type === params.sales_type);
    }
    
    // 微信号搜索（支持一级带二级）
    if (params.wechat_name) {
      const searchTerm = params.wechat_name.toLowerCase();
      
      // 找出匹配的一级销售ID
      const matchedPrimaryIds = new Set();
      filteredData.forEach(item => {
        if (item.sales_type === 'primary') {
          const wechatMatch = item.sales?.wechat_name?.toLowerCase().includes(searchTerm);
          const nameMatch = item.sales?.name?.toLowerCase().includes(searchTerm);
          const codeMatch = item.sales?.sales_code?.toLowerCase().includes(searchTerm);
          
          if (wechatMatch || nameMatch || codeMatch) {
            matchedPrimaryIds.add(item.sales.id);
          }
        }
      });
      
      // 如果有匹配的一级销售，添加其二级销售
      if (matchedPrimaryIds.size > 0) {
        const primarySecondaries = secondarySales.filter(s => 
          s.primary_sales_id && matchedPrimaryIds.has(s.primary_sales_id)
        );
        
        // 将二级销售添加到结果中
        for (const sale of primarySecondaries) {
          if (!filteredData.some(item => item.sales?.id === sale.id && item.sales_type === 'secondary')) {
            const saleOrders = orders.filter(order => 
              order.sales_code === sale.sales_code &&
              order.status !== 'rejected'
            );
            
            const confirmedOrders = saleOrders.filter(order => 
              ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)
            );
            
            const totalAmount = confirmedOrders.reduce((sum, order) => {
              const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
              if (order.payment_method === 'alipay') {
                return sum + (amount / 7.15);
              }
              return sum + amount;
            }, 0);
            
            const commissionRate = sale.commission_rate || 25;
            const commissionAmount = totalAmount * (commissionRate / 100);
            
            filteredData.push({
              sales: {
                ...sale,
                sales_type: 'secondary',
                payment_method: sale.payment_method,
                payment_account: sale.payment_account
              },
              sales_type: 'secondary',
              sales_display_type: '二级销售',
              total_orders: saleOrders.length,
              valid_orders: confirmedOrders.length,
              total_amount: Math.round(totalAmount * 100) / 100,
              confirmed_amount: Math.round(totalAmount * 100) / 100,
              commission_rate: commissionRate,
              commission_amount: Math.round(commissionAmount * 100) / 100,
              hierarchy_info: '二级销售'
            });
          }
        }
      }
      
      // 过滤出匹配的结果
      filteredData = filteredData.filter(item => {
        const wechatMatch = item.sales?.wechat_name?.toLowerCase().includes(searchTerm);
        const nameMatch = item.sales?.name?.toLowerCase().includes(searchTerm);
        const codeMatch = item.sales?.sales_code?.toLowerCase().includes(searchTerm);
        const isPrimarySecondary = item.sales_type === 'secondary' && 
                                   item.sales?.primary_sales_id && 
                                   matchedPrimaryIds.has(item.sales.primary_sales_id);
        
        return wechatMatch || nameMatch || codeMatch || isPrimarySecondary;
      });
    }
    
    return filteredData;
  } catch (error) {
    console.error('获取统一销售数据失败:', error);
    throw error;
  }
}
