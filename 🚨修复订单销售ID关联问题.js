// 🚨 修复订单创建时的销售ID关联问题
// 这是系统的核心缺陷修复

// ============================================
// 1. 修改 calculateCommission 方法
// ============================================

async calculateCommission(salesCode, amount) {
  const salesResult = await SalesAPI.getSalesByCode(salesCode);
  if (!salesResult.success) {
    throw new Error('销售代码不存在');
  }
  
  const sale = salesResult.data;
  let commissionRate = sale.commission_rate;
  
  // 默认值：一级40%，二级30%
  if (!commissionRate) {
    commissionRate = sale.type === 'primary' ? 0.4 : 0.3;
  }
  
  const commission = parseFloat(amount) * commissionRate;
  
  // 🔧 修复：返回完整的销售信息，包括ID和上级关系
  return {
    commission,
    type: sale.type,
    rate: commissionRate,
    // 新增：返回销售ID信息
    salesId: sale.id,
    primarySalesId: sale.type === 'primary' 
      ? sale.id 
      : sale.primary_sales_id || null,  // 二级销售的上级ID（如果有）
    secondarySalesId: sale.type === 'secondary' 
      ? sale.id 
      : null
  };
}

// ============================================
// 2. 修改订单创建逻辑
// ============================================

async create(orderData) {
  try {
    const processedOrderData = {
      // ... 基础字段
      sales_code: orderData.sales_code,
      // ... 其他字段
    };
    
    // 计算佣金并获取销售关系
    if (processedOrderData.sales_code && processedOrderData.amount > 0) {
      try {
        const salesInfo = await this.calculateCommission(
          processedOrderData.sales_code, 
          processedOrderData.amount
        );
        
        // 🔧 修复：添加销售ID关联
        processedOrderData.commission_amount = salesInfo.commission;
        processedOrderData.sales_type = salesInfo.type;
        processedOrderData.commission_rate = salesInfo.rate;
        
        // 🎯 核心修复：添加销售ID字段
        processedOrderData.primary_sales_id = salesInfo.primarySalesId;
        processedOrderData.secondary_sales_id = salesInfo.secondarySalesId;
        
      } catch (error) {
        console.warn('计算佣金失败:', error.message);
        processedOrderData.commission_amount = 0;
        processedOrderData.commission_rate = 0;
      }
    }
    
    const newOrder = await SupabaseService.createOrder(processedOrderData);
    return { success: true, data: newOrder };
  } catch (error) {
    console.error('订单创建失败:', error);
    throw error;
  }
}

// ============================================
// 3. 区分独立二级和一级下属二级的逻辑
// ============================================

function categorizeOrder(order) {
  // 一级销售的直接订单
  if (order.sales_type === 'primary') {
    return {
      type: 'PRIMARY_DIRECT',
      primarySalesId: order.primary_sales_id,
      commission: order.amount * 0.4
    };
  }
  
  // 二级销售的订单
  if (order.sales_type === 'secondary') {
    if (order.primary_sales_id) {
      // 🎯 一级下属的二级销售订单
      return {
        type: 'SUBORDINATE_SECONDARY',
        primarySalesId: order.primary_sales_id,
        secondarySalesId: order.secondary_sales_id,
        secondaryCommission: order.commission_amount,
        // 一级获得管理佣金（总金额 - 二级佣金）
        primaryManagementCommission: order.amount - order.commission_amount
      };
    } else {
      // 🎯 独立二级销售订单
      return {
        type: 'INDEPENDENT_SECONDARY',
        secondarySalesId: order.secondary_sales_id,
        commission: order.commission_amount
      };
    }
  }
}

// ============================================
// 4. 一级销售综合佣金率计算
// ============================================

function calculatePrimaryTotalCommissionRate(primarySalesId, orders) {
  // 筛选该一级销售相关的订单
  const relatedOrders = orders.filter(order => 
    order.primary_sales_id === primarySalesId
  );
  
  // 分类订单
  const directOrders = relatedOrders.filter(o => o.sales_type === 'primary');
  const subordinateOrders = relatedOrders.filter(o => 
    o.sales_type === 'secondary' && o.primary_sales_id
  );
  
  // 计算金额
  const directAmount = directOrders.reduce((sum, o) => sum + o.amount, 0);
  const subordinateAmount = subordinateOrders.reduce((sum, o) => sum + o.amount, 0);
  
  // 计算佣金
  const directCommission = directAmount * 0.4;
  const subordinateCommissions = subordinateOrders.reduce((sum, o) => 
    sum + o.commission_amount, 0
  );
  const managementCommission = subordinateAmount - subordinateCommissions;
  
  // 综合佣金率
  const totalAmount = directAmount + subordinateAmount;
  const totalCommission = directCommission + managementCommission;
  const totalRate = totalAmount > 0 ? totalCommission / totalAmount : 0;
  
  return {
    directAmount,
    subordinateAmount,
    totalAmount,
    directCommission,
    managementCommission,
    totalCommission,
    totalRate: (totalRate * 100).toFixed(2) + '%'
  };
}

// ============================================
// 5. 数据库迁移SQL（修复现有数据）
// ============================================

const migrationSQL = `
-- 添加缺失的字段（如果不存在）
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS primary_sales_id INT,
ADD COLUMN IF NOT EXISTS secondary_sales_id INT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_primary_sales_id ON orders(primary_sales_id);
CREATE INDEX IF NOT EXISTS idx_orders_secondary_sales_id ON orders(secondary_sales_id);

-- 修复现有订单数据（根据sales_code关联销售ID）
UPDATE orders o
SET 
  primary_sales_id = CASE 
    WHEN ps.id IS NOT NULL THEN ps.id
    WHEN ss.primary_sales_id IS NOT NULL THEN ss.primary_sales_id
    ELSE NULL
  END,
  secondary_sales_id = ss.id
FROM 
  orders o2
  LEFT JOIN primary_sales ps ON o2.sales_code = ps.sales_code
  LEFT JOIN secondary_sales ss ON o2.sales_code = ss.sales_code
WHERE 
  o.id = o2.id
  AND (o.primary_sales_id IS NULL OR o.secondary_sales_id IS NULL);
`;

console.log('修复方案已生成！');
console.log('这将解决以下问题：');
console.log('1. ✅ 区分独立二级和一级下属二级');
console.log('2. ✅ 正确计算一级销售的管理佣金');
console.log('3. ✅ 修复统计报表的数据准确性');
