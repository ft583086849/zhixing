// 📊 统一数据源实现方案
// 让管理员后台使用一级销售对账的数据逻辑

// ============================================
// 1. 修改 AdminAPI.getSales 方法
// ============================================

// client/src/services/api.js
const AdminAPI = {
  // ... 其他方法

  /**
   * 获取销售列表 - 统一使用后端计算逻辑
   * 🔧 重构：使用与一级销售对账相同的数据源
   */
  async getSales(params = {}) {
    try {
      const results = [];
      
      // 1. 获取所有一级销售数据（使用对账页面的逻辑）
      const { data: primarySales } = await supabase
        .from('primary_sales')
        .select('*');
      
      // 处理每个一级销售
      for (const primary of primarySales) {
        // 使用 getPrimarySalesSettlement 的计算逻辑
        const settlementData = await SupabaseService.getPrimarySalesSettlement({
          sales_code: primary.sales_code
        });
        
        if (settlementData) {
          // 转换为管理员页面需要的格式
          results.push({
            id: primary.id,
            sales_type: 'primary',
            sales: {
              id: primary.id,
              wechat_name: primary.wechat_name,
              sales_code: primary.sales_code,
              commission_rate: settlementData.stats?.currentCommissionRate || 0.4,
              sales_type: 'primary'
            },
            total_orders: settlementData.stats?.totalOrders || 0,
            total_amount: settlementData.stats?.totalAmount || 0,
            commission_rate: (settlementData.stats?.currentCommissionRate || 0.4) * 100,
            commission_amount: settlementData.stats?.totalCommission || 0,
            managed_secondary_count: settlementData.secondarySales?.length || 0,
            hierarchy_info: '一级销售',
            links: {
              user_link: `https://zhixing-seven.vercel.app/purchase?sales_code=${primary.sales_code}`,
              secondary_link: `https://zhixing-seven.vercel.app/secondary-sales?registration_code=${primary.secondary_registration_code}`
            }
          });
        }
      }
      
      // 2. 获取所有二级销售数据
      const { data: secondarySales } = await supabase
        .from('secondary_sales')
        .select('*');
      
      // 处理二级销售（区分独立和有上级的）
      for (const secondary of secondarySales) {
        const isIndependent = !secondary.primary_sales_id;
        
        // 获取该二级销售的订单统计
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('sales_code', secondary.sales_code)
          .neq('status', 'rejected');
        
        const confirmedOrders = orders?.filter(o => 
          ['confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
        ) || [];
        
        const totalAmount = confirmedOrders.reduce((sum, order) => {
          const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
          if (order.payment_method === 'alipay') {
            return sum + (amount / 7.15); // RMB转USD
          }
          return sum + amount;
        }, 0);
        
        const commissionRate = secondary.commission_rate || (isIndependent ? 0.3 : 0.25);
        const commissionAmount = totalAmount * commissionRate;
        
        results.push({
          id: secondary.id,
          sales_type: isIndependent ? 'independent' : 'secondary',
          sales: {
            id: secondary.id,
            wechat_name: secondary.wechat_name,
            sales_code: secondary.sales_code,
            commission_rate: commissionRate,
            sales_type: isIndependent ? 'independent' : 'secondary',
            primary_sales_id: secondary.primary_sales_id
          },
          total_orders: confirmedOrders.length,
          total_amount: totalAmount,
          commission_rate: commissionRate * 100,
          commission_amount: commissionAmount,
          hierarchy_info: isIndependent ? '独立销售' : '二级销售',
          links: {
            user_link: `https://zhixing-seven.vercel.app/purchase?sales_code=${secondary.sales_code}`
          }
        });
      }
      
      // 3. 根据搜索条件过滤
      let filteredResults = results;
      
      if (params.wechat_name) {
        const searchTerm = params.wechat_name.toLowerCase();
        filteredResults = filteredResults.filter(item => 
          item.sales.wechat_name?.toLowerCase().includes(searchTerm)
        );
      }
      
      if (params.sales_type) {
        filteredResults = filteredResults.filter(item => 
          item.sales_type === params.sales_type
        );
      }
      
      console.log('✅ 统一数据源返回:', {
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
};

// ============================================
// 2. 数据去重辅助函数
// ============================================

const removeDuplicateSales = (salesList) => {
  const seen = new Map();
  
  return salesList.filter(sale => {
    // 使用 wechat_name + sales_type 作为唯一标识
    const key = `${sale.sales?.wechat_name}_${sale.sales_type}`;
    
    if (seen.has(key)) {
      // 如果已存在，保留订单数更多的那个
      const existing = seen.get(key);
      if (sale.total_orders > existing.total_orders) {
        seen.set(key, sale);
        return true;
      }
      return false;
    }
    
    seen.set(key, sale);
    return true;
  });
};

// ============================================
// 3. 数据格式转换器
// ============================================

const formatSalesForAdmin = (salesData) => {
  return salesData.map(sale => ({
    ...sale,
    // 统一佣金率格式（显示为百分比）
    commission_rate_display: `${(sale.commission_rate * 100).toFixed(2)}%`,
    // 统一金额格式
    total_amount_display: `$${sale.total_amount.toFixed(2)}`,
    commission_amount_display: `$${sale.commission_amount.toFixed(2)}`,
    // 添加类型标签
    type_badge: sale.sales_type === 'primary' ? '一级' : 
               sale.sales_type === 'independent' ? '独立' : '二级'
  }));
};

// ============================================
// 4. 导出给外部使用
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AdminAPI,
    removeDuplicateSales,
    formatSalesForAdmin
  };
}

// ============================================
// 5. 测试脚本
// ============================================

// 在控制台运行测试
const testUnifiedDataSource = async () => {
  console.log('🧪 测试统一数据源...');
  
  // 1. 获取管理员页面数据
  const adminData = await AdminAPI.getSales();
  console.log('管理员数据:', adminData);
  
  // 2. 获取一级销售对账数据
  const primaryData = await SupabaseService.getPrimarySalesSettlement({
    wechat_name: 'WML792355703'
  });
  console.log('一级对账数据:', primaryData);
  
  // 3. 对比关键数值
  console.log('\n📊 数据对比:');
  console.log('管理员页面 vs 一级对账页面');
  
  const adminPrimary = adminData.find(d => d.sales.wechat_name === 'WML792355703');
  if (adminPrimary && primaryData) {
    console.log(`总订单: ${adminPrimary.total_orders} vs ${primaryData.stats?.totalOrders}`);
    console.log(`总金额: ${adminPrimary.total_amount} vs ${primaryData.stats?.totalAmount}`);
    console.log(`佣金率: ${adminPrimary.commission_rate}% vs ${(primaryData.stats?.currentCommissionRate * 100)}%`);
    console.log(`佣金额: ${adminPrimary.commission_amount} vs ${primaryData.stats?.totalCommission}`);
  }
  
  console.log('\n✅ 测试完成');
};

// 暴露到window对象供调试
if (typeof window !== 'undefined') {
  window.testUnifiedDataSource = testUnifiedDataSource;
  window.removeDuplicateSales = removeDuplicateSales;
  window.formatSalesForAdmin = formatSalesForAdmin;
}

console.log('💡 统一数据源实现已加载');
console.log('   运行 testUnifiedDataSource() 进行测试');
