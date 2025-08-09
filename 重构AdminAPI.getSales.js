// 🚀 重构AdminAPI.getSales方法
// 目标：使用一级销售对账页面的数据，确保数据一致性

// 这段代码将替换 client/src/services/api.js 中的 getSales 方法

/**
 * 获取销售列表 - 使用统一的后端计算逻辑
 * 🚀 重构：一级销售使用getPrimarySalesSettlement的数据
 * 佣金率优先级：管理员设置 > 一级销售设置 > 默认值
 */
async getSales(params = {}) {
  try {
    const supabaseClient = SupabaseService.supabase || window.supabaseClient;
    const results = [];
    
    // 🚀 获取所有一级销售
    const { data: allPrimarySales } = await supabaseClient
      .from('primary_sales')
      .select('*');
    
    // 🚀 获取所有二级销售  
    const { data: allSecondarySales } = await supabaseClient
      .from('secondary_sales')
      .select('*');
      
    // 获取所有订单（排除已拒绝）
    const { data: allOrders } = await supabaseClient
      .from('orders')
      .select('*')
      .neq('status', 'rejected');
    
    console.log('📊 开始处理销售数据:', {
      一级销售: allPrimarySales?.length || 0,
      二级销售: allSecondarySales?.length || 0,
      订单总数: allOrders?.length || 0
    });
    
    // 1️⃣ 处理一级销售：使用对账页面的逻辑实时获取
    const primaryDataMap = new Map(); // 存储一级销售的完整数据
    
    for (const primarySale of allPrimarySales || []) {
      try {
        // 调用一级销售对账API获取完整数据（包含动态佣金计算）
        const settlementData = await SupabaseService.getPrimarySalesSettlement({
          sales_code: primarySale.sales_code
        });
        
        if (settlementData) {
          // 保存到Map供后续查询
          primaryDataMap.set(primarySale.id, settlementData);
          
          // 转换为管理员页面需要的格式
          const formattedData = {
            id: primarySale.id,
            sales_type: 'primary',
            sales: {
              id: primarySale.id,
              wechat_name: primarySale.wechat_name,
              sales_code: primarySale.sales_code,
              commission_rate: settlementData.stats?.currentCommissionRate || 0.4,
              sales_type: 'primary',
              payment_account: primarySale.payment_account,
              payment_method: primarySale.payment_method
            },
            total_orders: settlementData.stats?.totalOrders || 0,
            total_amount: settlementData.stats?.totalAmount || 0,
            commission_rate: (settlementData.stats?.currentCommissionRate || 0.4) * 100,
            commission_amount: settlementData.stats?.totalCommission || 0,
            managed_secondary_count: settlementData.secondarySales?.length || 0,
            hierarchy_info: '一级销售',
            links: {
              user_link: `https://zhixing-seven.vercel.app/purchase?sales_code=${primarySale.sales_code}`,
              secondary_link: primarySale.secondary_registration_code ? 
                `https://zhixing-seven.vercel.app/secondary-sales?registration_code=${primarySale.secondary_registration_code}` : null
            }
          };
          
          results.push(formattedData);
          
          console.log(`✅ 一级销售 ${primarySale.wechat_name}:`, {
            佣金率: formattedData.commission_rate + '%',
            订单数: formattedData.total_orders,
            金额: formattedData.total_amount
          });
        }
      } catch (error) {
        console.error(`获取一级销售 ${primarySale.wechat_name} 数据失败:`, error);
      }
    }
    
    // 2️⃣ 处理二级销售和独立销售
    for (const secondarySale of allSecondarySales || []) {
      const isIndependent = !secondarySale.primary_sales_id;
      
      // 获取该二级销售的订单
      const saleOrders = (allOrders || []).filter(order => 
        order.sales_code === secondarySale.sales_code
      );
      
      const confirmedOrders = saleOrders.filter(order =>
        ['confirmed_config', 'confirmed_configuration', 'active'].includes(order.status)
      );
      
      const totalAmount = confirmedOrders.reduce((sum, order) => {
        const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
        if (order.payment_method === 'alipay') {
          return sum + (amount / 7.15);
        }
        return sum + amount;
      }, 0);
      
      // 🔧 佣金率优先级逻辑
      let commissionRate = 0.25; // 默认25%
      let rateSource = '默认值';
      
      // 优先级1：管理员设置（存在secondary_sales表中）
      if (secondarySale.commission_rate !== null && secondarySale.commission_rate !== undefined) {
        commissionRate = secondarySale.commission_rate;
        rateSource = '管理员设置';
      } 
      // 优先级2：一级销售设置（从对账数据获取）
      else if (!isIndependent && secondarySale.primary_sales_id) {
        const primaryData = primaryDataMap.get(secondarySale.primary_sales_id);
        if (primaryData && primaryData.secondarySales) {
          const secondaryInPrimary = primaryData.secondarySales.find(s => 
            s.sales_code === secondarySale.sales_code
          );
          if (secondaryInPrimary && secondaryInPrimary.commission_rate !== null) {
            commissionRate = secondaryInPrimary.commission_rate;
            rateSource = '一级销售设置';
          }
        }
      }
      
      // 转换为百分比格式（如果是小数）
      if (commissionRate > 0 && commissionRate < 1) {
        commissionRate = commissionRate * 100;
      }
      
      const commissionAmount = totalAmount * (commissionRate / 100);
      
      const formattedData = {
        id: secondarySale.id,
        sales_type: isIndependent ? 'independent' : 'secondary',
        sales: {
          id: secondarySale.id,
          wechat_name: secondarySale.wechat_name,
          sales_code: secondarySale.sales_code,
          commission_rate: commissionRate / 100,
          sales_type: isIndependent ? 'independent' : 'secondary',
          primary_sales_id: secondarySale.primary_sales_id,
          payment_account: secondarySale.payment_account,
          payment_method: secondarySale.payment_method
        },
        total_orders: confirmedOrders.length,
        total_amount: totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        hierarchy_info: isIndependent ? '独立销售' : '二级销售',
        links: {
          user_link: `https://zhixing-seven.vercel.app/purchase?sales_code=${secondarySale.sales_code}`
        }
      };
      
      // 如果是二级销售，添加上级信息
      if (!isIndependent && secondarySale.primary_sales_id) {
        const primaryData = primaryDataMap.get(secondarySale.primary_sales_id);
        if (primaryData) {
          formattedData.primary_sales_name = primaryData.sales?.wechat_name;
        }
      }
      
      results.push(formattedData);
      
      console.log(`✅ ${formattedData.hierarchy_info} ${secondarySale.wechat_name}:`, {
        佣金率: formattedData.commission_rate + '%',
        来源: rateSource,
        订单数: formattedData.total_orders,
        金额: formattedData.total_amount
      });
    }
    
    // 3️⃣ 应用搜索过滤
    let filteredResults = results;
    
    // 微信号搜索
    if (params.wechat_name) {
      const searchTerm = params.wechat_name.toLowerCase();
      filteredResults = filteredResults.filter(item => 
        item.sales.wechat_name?.toLowerCase().includes(searchTerm) ||
        item.sales.sales_code?.toLowerCase().includes(searchTerm)
      );
    }
    
    // 销售类型过滤
    if (params.sales_type) {
      filteredResults = filteredResults.filter(item => 
        item.sales_type === params.sales_type
      );
    }
    
    // 佣金率过滤
    if (params.commission_rate) {
      const rate = parseFloat(params.commission_rate);
      filteredResults = filteredResults.filter(item => 
        Math.abs(item.commission_rate - rate) < 0.01
      );
    }
    
    console.log('\n📊 最终结果:', {
      总数: filteredResults.length,
      一级: filteredResults.filter(r => r.sales_type === 'primary').length,
      二级: filteredResults.filter(r => r.sales_type === 'secondary').length,
      独立: filteredResults.filter(r => r.sales_type === 'independent').length
    });
    
    return filteredResults;
    
  } catch (error) {
    console.error('获取销售列表失败:', error);
    return [];
  }
}
