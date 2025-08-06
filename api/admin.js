// 全新重建的管理员API - 使用统一的数据架构
const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  },
  timezone: '+08:00'
};

// 统一的响应格式
const createResponse = (success, data = null, message = '', status = 200) => {
  return new Response(JSON.stringify({
    success,
    data,
    message,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};

// 数据库连接错误处理
const createConnection = async () => {
  try {
    return await mysql.createConnection(dbConfig);
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw new Error('数据库连接失败');
  }
};

// 处理管理员订单查询
const handleAdminOrders = async () => {
  const connection = await createConnection();
  
  try {
    // 使用新的统一数据架构查询订单
    const query = `
      SELECT 
        o.id,
        o.amount,
        o.status,
        o.payment_method,
        o.payment_time,
        o.created_at,
        o.sales_code,
        o.sales_type,
        o.primary_sales_id,
        o.secondary_sales_id,
        o.commission_rate,
        o.commission_amount,
        o.screenshot_data,
        -- 一级销售信息
        ps.name as primary_sales_name,
        ps.wechat_name as primary_wechat_name,
        -- 二级销售信息  
        ss.name as secondary_sales_name,
        ss.wechat_name as secondary_wechat_name,
        CASE 
          WHEN o.sales_type = 'primary' THEN ps.name
          WHEN o.sales_type = 'secondary' THEN ss.name
          ELSE '未知销售'
        END as sales_name
      FROM orders o
      LEFT JOIN primary_sales ps ON o.primary_sales_id = ps.id
      LEFT JOIN secondary_sales ss ON o.secondary_sales_id = ss.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `;
    
    const [rows] = await connection.execute(query);
    
    // 数据格式化
    const formattedOrders = rows.map(order => ({
      ...order,
      amount: parseFloat(order.amount),
      commission_rate: parseFloat(order.commission_rate || 0),
      commission_amount: parseFloat(order.commission_amount || 0),
      created_at: new Date(order.created_at).toLocaleString('zh-CN'),
      payment_time: order.payment_time ? new Date(order.payment_time).toLocaleString('zh-CN') : null
    }));
    
    return createResponse(true, formattedOrders, '订单查询成功');
    
  } catch (error) {
    console.error('订单查询失败:', error);
    return createResponse(false, null, '订单查询失败: ' + error.message, 500);
  } finally {
      await connection.end();
    }
};

// 处理管理员客户管理 - 显示所有数据不过滤
const handleAdminCustomers = async () => {
  const connection = await createConnection();
  
  try {
    // 管理员系统例外标注: 不使用config_confirmed过滤，显示所有数据按需求文档要求
    const query = `
      SELECT 
        o.id,
        o.customer_name,
        o.customer_wechat,
        o.amount,
        o.status,
        o.payment_method,
        o.payment_time,
        o.created_at,
        o.sales_code,
        o.sales_type,
        o.config_confirmed,
        -- 销售信息
        CASE 
          WHEN o.sales_type = 'primary' THEN ps.name
          WHEN o.sales_type = 'secondary' THEN ss.name
          ELSE '未知销售'
        END as sales_name,
        CASE 
          WHEN o.sales_type = 'primary' THEN ps.wechat_name
          WHEN o.sales_type = 'secondary' THEN ss.wechat_name
          ELSE ''
        END as sales_wechat_name
      FROM orders o
      LEFT JOIN primary_sales ps ON o.primary_sales_id = ps.id
      LEFT JOIN secondary_sales ss ON o.secondary_sales_id = ss.id
      WHERE o.customer_name IS NOT NULL
      ORDER BY o.created_at DESC
    `;
    
    const [rows] = await connection.execute(query);
    
    const formattedCustomers = rows.map(customer => ({
      ...customer,
      amount: parseFloat(customer.amount),
      created_at: new Date(customer.created_at).toLocaleString('zh-CN'),
      payment_time: customer.payment_time ? new Date(customer.payment_time).toLocaleString('zh-CN') : null,
      config_confirmed: Boolean(customer.config_confirmed)
    }));
    
    return createResponse(true, formattedCustomers, '客户查询成功');
    
  } catch (error) {
    console.error('客户查询失败:', error);
    return createResponse(false, null, '客户查询失败: ' + error.message, 500);
  } finally {
      await connection.end();
    }
};

// 处理管理员数据概览
const handleAdminOverview = async () => {
  const connection = await createConnection();
  
  try {
    // 获取基础统计数据
    const [statsRows] = await connection.execute(`
        SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending_payment' THEN 1 END) as pending_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount END), 0) as total_revenue,
        COUNT(DISTINCT sales_code) as active_sales
      FROM orders
    `);
    
    // 获取一级销售统计
    const [primarySalesRows] = await connection.execute(`
      SELECT COUNT(*) as count FROM primary_sales
    `);
    
    // 获取二级销售统计
    const [secondarySalesRows] = await connection.execute(`
      SELECT COUNT(*) as count FROM secondary_sales
    `);
    
    // 最近7天订单趋势
    const [trendRows] = await connection.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        COALESCE(SUM(amount), 0) as daily_revenue
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    const overview = {
        stats: {
        totalOrders: parseInt(statsRows[0].total_orders),
        completedOrders: parseInt(statsRows[0].completed_orders),
        pendingOrders: parseInt(statsRows[0].pending_orders),
        totalRevenue: parseFloat(statsRows[0].total_revenue),
        activeSales: parseInt(statsRows[0].active_sales),
        primarySalesCount: parseInt(primarySalesRows[0].count),
        secondarySalesCount: parseInt(secondarySalesRows[0].count)
      },
      trends: trendRows.map(row => ({
        date: row.date,
        orderCount: parseInt(row.order_count),
        dailyRevenue: parseFloat(row.daily_revenue)
      }))
    };
    
    return createResponse(true, overview, '数据概览获取成功');
        
      } catch (error) {
    console.error('数据概览获取失败:', error);
    return createResponse(false, null, '数据概览获取失败: ' + error.message, 500);
  } finally {
      await connection.end();
    }
};

// 主处理函数
module.exports = async function handler(req) {
  try {
    // CORS预检请求处理
    if (req.method === 'OPTIONS') {
      return createResponse(true, null, 'CORS OK');
    }
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    // 根据action参数路由到不同的处理函数
    switch (action) {
      case 'orders':
        return await handleAdminOrders();
      case 'customers':
        return await handleAdminCustomers();
      case 'overview':
        return await handleAdminOverview();
      default:
        return createResponse(false, null, '无效的操作类型', 400);
    }
    
  } catch (error) {
    console.error('管理员API处理失败:', error);
    return createResponse(false, null, '服务器内部错误: ' + error.message, 500);
  }
}