// 🔧 实现显示具体二级销售名字的解决方案
// 在获取订单数据时，同时关联查询二级销售信息

// ========================================
// 方案1：修改 Supabase 查询（推荐）
// ========================================

// 文件：client/src/services/supabase.js
// 修改 getOrdersWithSalesInfo 函数

static async getOrdersWithSalesInfo() {
  try {
    // 获取订单数据，同时关联二级销售信息
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        secondary_sales:secondary_sales_id (
          id,
          wechat_name,
          sales_code
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // 为每个订单添加 secondary_sales_name 字段
    const ordersWithNames = orders.map(order => ({
      ...order,
      secondary_sales_name: order.secondary_sales?.wechat_name || null,
      // 保持向后兼容
      sales_display_name: order.sales_type === 'secondary' 
        ? (order.secondary_sales?.wechat_name || '二级销售')
        : '直接销售'
    }));
    
    return ordersWithNames;
  } catch (error) {
    console.error('获取订单失败:', error);
    throw error;
  }
}

// ========================================
// 方案2：前端组件修改
// ========================================

// 文件：client/src/pages/PrimarySalesSettlementPage.js
// 修改订单表格列定义

const columns = [
  // ... 其他列
  {
    title: '销售人员',
    dataIndex: 'secondary_sales_id',
    key: 'sales_person',
    width: 120,
    render: (secondary_id, record) => {
      if (record.sales_type === 'secondary') {
        // 如果有关联数据
        if (record.secondary_sales?.wechat_name) {
          return <Tag color="blue">{record.secondary_sales.wechat_name}</Tag>;
        }
        // 如果只有ID，需要查询
        return <Tag color="blue">二级销售(ID:{secondary_id})</Tag>;
      }
      return <Tag color="green">直接销售</Tag>;
    }
  },
  // ... 其他列
];

// ========================================
// 方案3：创建数据库视图（最优雅）
// ========================================

// 在 Supabase SQL Editor 中执行
const CREATE_VIEW_SQL = `
-- 创建订单详情视图，自动关联销售名字
CREATE OR REPLACE VIEW orders_with_sales_names AS
SELECT 
  o.*,
  -- 添加二级销售名字
  s.wechat_name as secondary_sales_name,
  s.sales_code as secondary_sales_code,
  -- 添加显示名称
  CASE 
    WHEN o.sales_type = 'secondary' THEN s.wechat_name
    ELSE '直接销售'
  END as sales_display_name,
  -- 添加一级销售信息（如果需要）
  p.wechat_name as primary_sales_name
FROM orders o
LEFT JOIN secondary_sales s ON o.secondary_sales_id = s.id
LEFT JOIN primary_sales p ON o.primary_sales_id = p.id;

-- 授权访问
GRANT SELECT ON orders_with_sales_names TO anon, authenticated;
`;

// 然后在前端使用视图
static async getOrdersWithNames() {
  const { data, error } = await supabase
    .from('orders_with_sales_names')  // 使用视图
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// ========================================
// 方案4：临时前端解决方案
// ========================================

// 在组件中手动关联数据
const PrimarySalesSettlementPage = () => {
  const [orders, setOrders] = useState([]);
  const [secondarySales, setSecondarySales] = useState([]);
  
  useEffect(() => {
    // 获取所有二级销售信息
    const fetchData = async () => {
      // 获取订单
      const ordersData = await getOrders();
      // 获取所有二级销售
      const salesData = await getSecondarySales();
      
      // 手动关联
      const ordersWithNames = ordersData.map(order => {
        if (order.secondary_sales_id) {
          const sale = salesData.find(s => s.id === order.secondary_sales_id);
          return {
            ...order,
            secondary_sales_name: sale?.wechat_name || '未知'
          };
        }
        return order;
      });
      
      setOrders(ordersWithNames);
      setSecondarySales(salesData);
    };
    
    fetchData();
  }, []);
  
  // ... 其余代码
};

// ========================================
// 推荐实施步骤
// ========================================

/*
1. 先使用方案3创建数据库视图（最优雅）
2. 修改前端使用视图获取数据
3. 更新表格显示逻辑

优点：
- 不需要修改大量代码
- 性能好（数据库层面关联）
- 数据一致性好
*/
