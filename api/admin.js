// Vercel Serverless Function - 管理员API
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// 内联销售链接生成函数，避免导入路径问题
function generateFullLink(code, type, baseUrl = process.env.FRONTEND_URL || 'https://zhixing-seven.vercel.app') {
  if (type === 'sales_register') {
    return `${baseUrl}/#/sales/register/${code}`;
  } else if (type === 'user_purchase') {
    return `${baseUrl}/#/purchase/${code}`;
  } else {
    throw new Error(`不支持的链接类型: ${type}`);
  }
}

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

// 权限验证中间件
async function verifyAdminAuth(req, res) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, status: 401, message: '未提供有效的认证Token' };
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // 验证管理员是否存在
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT id, username, role FROM admins WHERE id = ?',
      [decoded.id]
    );
    await connection.end();
    
    if (rows.length === 0) {
      return { success: false, status: 401, message: '管理员账户不存在' };
    }
    
    return { success: true, admin: rows[0] };
  } catch (error) {
    return { success: false, status: 401, message: 'Token无效或已过期' };
  }
}

export default async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 验证管理员权限（除了数据库结构调整）
    const { path } = req.query;
    const bodyPath = req.body?.path;
    
    if (!(req.method === 'POST' && (path === 'update-schema' || bodyPath === 'update-schema'))) {
      const authResult = await verifyAdminAuth(req, res);
      if (!authResult.success) {
        return res.status(authResult.status).json({
          success: false,
          message: authResult.message
        });
      }
    }

    // 处理数据库结构调整
    if (req.method === 'POST' && (path === 'update-schema' || bodyPath === 'update-schema')) {
      await handleUpdateSchema(req, res);
      return;
    }

    // 处理统计信息
    if (req.method === 'GET' && (path === 'stats' || !path)) {
      await handleStats(req, res);
      return;
    }

    // 处理概览数据
    if (req.method === 'GET' && path === 'overview') {
      await handleOverview(req, res);
      return;
    }

    // 处理订单管理
    if (req.method === 'GET' && path === 'orders') {
      await handleOrders(req, res);
      return;
    }

    // 处理销售管理
    if (req.method === 'GET' && path === 'sales') {
      await handleSales(req, res);
      return;
    }

    // 处理客户管理
    if (req.method === 'GET' && path === 'customers') {
      await handleCustomers(req, res);
      return;
    }

    // 处理数据导出
    if (req.method === 'GET' && path === 'export') {
      await handleDataExport(req, res);
      return;
    }

    // 处理催单功能
    if (req.method === 'POST' && path === 'remind') {
      await handleRemindCustomer(req, res);
      return;
    }

    // 处理订单状态更新
    if (req.method === 'PUT' && path === 'update-order') {
      await handleUpdateOrderStatus(req, res);
      return;
    }

    // 处理佣金率更新
    if (req.method === 'PUT' && path === 'update-commission') {
      await handleUpdateCommissionRate(req, res);
      return;
    }

    // 处理销售管理更新佣金
    if (req.method === 'POST' && path === 'update-sales-commission') {
      await handleUpdateSalesCommission(req, res);
      return;
    }

    // 处理清空测试数据
    if (req.method === 'DELETE' && path === 'clear-test-data') {
      await handleClearTestData(req, res);
      return;
    }

    // 处理修复缺失数据库字段
    if (req.method === 'POST' && path === 'fix-missing-fields') {
      await handleFixMissingFields(req, res);
      return;
    }

    // 如果没有匹配的路径，返回404
    res.status(404).json({
      success: false,
      message: `路径不存在: ${req.method} ${path || bodyPath || 'default'}`
    });

  } catch (error) {
    console.error('管理员API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
}

// 概览数据功能
async function handleOverview(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取总订单数
    const [orderCount] = await connection.execute(`
      SELECT COUNT(*) as total_orders FROM orders
    `);
    
    // 获取总销售额
    const [revenueData] = await connection.execute(`
      SELECT SUM(amount) as total_revenue FROM orders WHERE status = 'paid'
    `);
    
    // 获取总佣金
    const [commissionData] = await connection.execute(`
      SELECT SUM(commission_amount) as total_commission FROM orders WHERE status = 'paid'
    `);
    
    // 获取销售统计
    const [salesStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_sales,
        COUNT(CASE WHEN sales_type = 'primary' THEN 1 END) as primary_sales,
        COUNT(CASE WHEN sales_type = 'secondary' THEN 1 END) as secondary_sales
      FROM sales
    `);
    
    const overview = {
      total_orders: orderCount[0]?.total_orders || 0,
      total_revenue: revenueData[0]?.total_revenue || 0,
      total_commission: commissionData[0]?.total_commission || 0,
      total_sales: salesStats[0]?.total_sales || 0,
      primary_sales: salesStats[0]?.primary_sales || 0,
      secondary_sales: salesStats[0]?.secondary_sales || 0
    };
    
    res.status(200).json({
      success: true,
      data: overview
    });
    
  } catch (error) {
    console.error('概览数据获取错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取概览数据失败'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 订单管理功能 - 重构版支持新的数据库结构
async function handleOrders(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search,
      sales_wechat,
      tradingview_username,
      start_date,
      end_date,
      payment_start_date,
      payment_end_date,
      config_start_date,
      config_end_date,
      expiry_start_date,
      expiry_end_date,
      amount_min,
      amount_max,
      purchase_type,
      payment_method
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // 构建WHERE条件
    let whereConditions = [];
    const params = [];
    
    if (status) {
      whereConditions.push('o.status = ?');
      params.push(status);
    }
    
    if (search) {
      whereConditions.push('(o.tradingview_username LIKE ? OR o.customer_wechat LIKE ? OR o.sales_code LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (sales_wechat) {
      whereConditions.push('(ps.wechat_name LIKE ? OR ss.wechat_name LIKE ? OR s.wechat_name LIKE ?)');
      params.push(`%${sales_wechat}%`, `%${sales_wechat}%`, `%${sales_wechat}%`);
    }
    
    if (tradingview_username) {
      whereConditions.push('o.tradingview_username LIKE ?');
      params.push(`%${tradingview_username}%`);
    }
    
    if (start_date && end_date) {
      whereConditions.push('DATE(o.created_at) BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }
    
    if (payment_start_date && payment_end_date) {
      whereConditions.push('DATE(o.payment_time) BETWEEN ? AND ?');
      params.push(payment_start_date, payment_end_date);
    }
    
    if (config_start_date && config_end_date) {
      whereConditions.push('DATE(o.updated_at) BETWEEN ? AND ?');
      params.push(config_start_date, config_end_date);
    }
    
    if (expiry_start_date && expiry_end_date) {
      whereConditions.push('DATE(o.expiry_time) BETWEEN ? AND ?');
      params.push(expiry_start_date, expiry_end_date);
    }
    
    if (amount_min && amount_max) {
      whereConditions.push('o.amount BETWEEN ? AND ?');
      params.push(parseFloat(amount_min), parseFloat(amount_max));
    }
    
    if (purchase_type) {
      whereConditions.push('o.purchase_type = ?');
      params.push(purchase_type);
    }
    
    if (payment_method) {
      whereConditions.push('o.payment_method = ?');
      params.push(payment_method);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 🔍 调试日志 - 查看WHERE条件构建
    console.log('🔍 [DEBUG] Orders API WHERE条件调试:');
    console.log('   whereConditions数组:', whereConditions);
    console.log('   whereClause:', whereClause);
    console.log('   params数组:', params);
    console.log('   查询参数:', req.query);
    
    // 获取订单列表 - 支持新的多表关联
    const ordersSQL = `
      SELECT 
        o.id,
        o.sales_code,
        o.sales_type,
        o.tradingview_username,
        o.customer_wechat,
        o.duration,
        o.purchase_type,
        o.effective_time,
        o.expiry_time,
        o.amount,
        o.payment_method,
        o.alipay_amount,
        o.crypto_amount,
        o.status,
        o.created_at,
        o.payment_time,
        o.commission_amount,
        o.commission_rate,
        o.screenshot_path,
        o.config_confirmed,
        o.primary_sales_id,
        o.secondary_sales_id,
        
        -- 销售微信号（优先级：一级销售 > 二级销售 > 遗留销售）
        COALESCE(ps.wechat_name, ss.wechat_name, s.wechat_name) as sales_wechat_name,
        
        -- 销售信息
        ps.wechat_name as primary_sales_wechat,
        ss.wechat_name as secondary_sales_wechat,
        s.wechat_name as legacy_sales_wechat,
        
        -- 销售类型信息
        CASE 
          WHEN ps.id IS NOT NULL THEN '一级销售'
          WHEN ss.id IS NOT NULL THEN '二级销售'
          WHEN s.id IS NOT NULL THEN '遗留销售'
          ELSE '未知类型'
        END as sales_type_display,
        
        -- 佣金相关
        COALESCE(ps.commission_rate, ss.commission_rate, s.commission_rate, 0.30) as current_commission_rate
      
      FROM orders o
      
      -- 关联一级销售表
      LEFT JOIN primary_sales ps ON (
        (o.sales_type = 'primary' AND o.primary_sales_id = ps.id) OR
        (o.sales_code = ps.sales_code)
      )
      
      -- 关联二级销售表
      LEFT JOIN secondary_sales ss ON (
        (o.sales_type = 'secondary' AND o.secondary_sales_id = ss.id) OR
        (o.sales_code = ss.sales_code)
      )
      
      -- 兼容遗留销售表
      LEFT JOIN sales s ON (
        o.sales_id = s.id OR 
        o.sales_code = s.sales_code OR
        o.link_code = s.link_code
      )
      
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const finalParams = [...params, parseInt(limit), offset];
    
    console.log('🔍 [DEBUG] 完整SQL查询:');
    console.log('   SQL:', ordersSQL);
    console.log('   最终参数:', finalParams);
    
    const [orders] = await connection.execute(ordersSQL, finalParams);
    
    // 获取总数
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM orders o
      LEFT JOIN primary_sales ps ON (
        (o.sales_type = 'primary' AND o.primary_sales_id = ps.id) OR
        (o.sales_code = ps.sales_code)
      )
      LEFT JOIN secondary_sales ss ON (
        (o.sales_type = 'secondary' AND o.secondary_sales_id = ss.id) OR
        (o.sales_code = ss.sales_code)
      )
      LEFT JOIN sales s ON (
        o.sales_id = s.id OR 
        o.sales_code = s.sales_code OR
        o.link_code = s.link_code
      )
      ${whereClause}
    `, params);
    
    const total = countResult[0]?.total || 0;
    
    // 数据后处理 - 确保所有字段都有值
    const processedOrders = orders.map(order => ({
      ...order,
      sales_wechat_name: order.sales_wechat_name || '-',
      customer_wechat: order.customer_wechat || '-',
      commission_amount: parseFloat(order.commission_amount || 0),
      commission_rate: parseFloat(order.commission_rate || 0.30),
      status: order.status || 'pending_payment',
      purchase_type: order.purchase_type || 'immediate',
      payment_method: order.payment_method || 'alipay'
    }));
    
    console.log(`📊 订单查询完成: 共${total}条记录，当前页${page}，每页${limit}条`);
    
    res.status(200).json({
      success: true,
      data: {
        orders: processedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 订单管理错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取订单数据失败'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 销售管理功能 - 重构版支持新的数据库结构
async function handleSales(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const { 
      page = 1, 
      limit = 20, 
      sales_type = 'all', 
      search,
      wechat_name,
      commission_rate_filter,
      payment_method,
      start_date,
      end_date
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // 构建WHERE条件
    let whereConditions = [];
    const params = [];
    
    // 销售类型筛选
    if (sales_type && sales_type !== 'all') {
      if (sales_type === 'primary') {
        whereConditions.push("sales_type = 'primary'");
      } else if (sales_type === 'secondary') {
        whereConditions.push("sales_type = 'secondary'");
      }
    }
    
    // 搜索条件
    if (search) {
      whereConditions.push('(wechat_name LIKE ? OR sales_code LIKE ? OR payment_address LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (wechat_name) {
      whereConditions.push('wechat_name LIKE ?');
      params.push(`%${wechat_name}%`);
    }
    
    if (commission_rate_filter) {
      whereConditions.push('commission_rate = ?');
      params.push(parseFloat(commission_rate_filter));
    }
    
    if (payment_method) {
      whereConditions.push('payment_method = ?');
      params.push(payment_method);
    }
    
    if (start_date && end_date) {
      whereConditions.push('DATE(created_at) BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 获取统一销售列表（一级 + 二级 + 遗留）
    const [allSales] = await connection.execute(`
      SELECT 
        id,
        wechat_name,
        sales_code,
        secondary_registration_code,
        payment_method,
        payment_address,
        chain_name,
        alipay_surname,
        commission_rate,
        'primary' as sales_type,
        created_at,
        updated_at
      FROM primary_sales
      
      UNION ALL
      
      SELECT 
        id,
        wechat_name,
        sales_code,
        primary_registration_code as secondary_registration_code,
        payment_method,
        payment_address,
        chain_name,
        alipay_surname,
        commission_rate,
        'secondary' as sales_type,
        created_at,
        updated_at
      FROM secondary_sales
      
      UNION ALL
      
      SELECT 
        id,
        wechat_name,
        COALESCE(sales_code, CONCAT('legacy_', id)) as sales_code,
        '' as secondary_registration_code,
        payment_method,
        payment_address,
        chain_name,
        alipay_surname,
        commission_rate,
        COALESCE(sales_type, 'legacy') as sales_type,
        created_at,
        updated_at
      FROM sales
      
      ORDER BY created_at DESC
    `);
    
    // 应用筛选条件
    let filteredSales = allSales;
    
    if (sales_type && sales_type !== 'all') {
      filteredSales = allSales.filter(sale => sale.sales_type === sales_type);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSales = filteredSales.filter(sale => 
        sale.wechat_name?.toLowerCase().includes(searchLower) ||
        sale.sales_code?.toLowerCase().includes(searchLower) ||
        sale.payment_address?.toLowerCase().includes(searchLower)
      );
    }
    
    if (wechat_name) {
      const wechatLower = wechat_name.toLowerCase();
      filteredSales = filteredSales.filter(sale => 
        sale.wechat_name?.toLowerCase().includes(wechatLower)
      );
    }
    
    if (commission_rate_filter) {
      const targetRate = parseFloat(commission_rate_filter);
      filteredSales = filteredSales.filter(sale => 
        Math.abs(parseFloat(sale.commission_rate || 0) - targetRate) < 0.01
      );
    }
    
    if (payment_method) {
      filteredSales = filteredSales.filter(sale => sale.payment_method === payment_method);
    }
    
    // 分页处理
    const total = filteredSales.length;
    const paginatedSales = filteredSales.slice(offset, offset + parseInt(limit));
    
    // 为每个销售获取订单统计
    const salesWithStats = await Promise.all(
      paginatedSales.map(async (sale) => {
        try {
          // 根据销售类型查询订单
          let orderQuery;
          let orderParams = [];
          
          // 查询完整的订单数据而不是统计数据
          if (sale.sales_type === 'primary') {
            orderQuery = `
              SELECT id, amount, status, commission_amount, commission_rate, 
                     duration, created_at, payment_time, tradingview_username,
                     secondary_sales_id, 
                     (CASE WHEN secondary_sales_id IS NOT NULL THEN 'secondary_sales' ELSE NULL END) as secondary_sales_name
              FROM orders 
              WHERE (primary_sales_id = ? OR (sales_code IS NOT NULL AND sales_code = ?))
              ORDER BY created_at DESC
            `;
            orderParams = [sale.id, sale.sales_code || ''];
          } else if (sale.sales_type === 'secondary') {
            orderQuery = `
              SELECT id, amount, status, commission_amount, commission_rate,
                     duration, created_at, payment_time, tradingview_username,
                     NULL as secondary_sales_id,
                     NULL as secondary_sales_name
              FROM orders 
              WHERE (secondary_sales_id = ? OR (sales_code IS NOT NULL AND sales_code = ?))
              ORDER BY created_at DESC
            `;
            orderParams = [sale.id, sale.sales_code || ''];
          } else {
            // 遗留销售
            orderQuery = `
              SELECT id, amount, status, commission_amount, commission_rate,
                     duration, created_at, payment_time, tradingview_username,
                     NULL as secondary_sales_id,
                     NULL as secondary_sales_name
              FROM orders 
              WHERE (sales_id = ? OR sales_code = ?)
              ORDER BY created_at DESC
            `;
            orderParams = [sale.id, sale.sales_code];
          }
          
          const [orders] = await connection.execute(orderQuery, orderParams);
          
          // 计算统计数据
          const stats = {
            order_count: orders.length,
            total_amount: orders.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0),
            total_commission: orders.reduce((sum, order) => sum + (parseFloat(order.commission_amount) || 0), 0)
          };
          
          return {
            ...sale,
            order_count: stats.order_count || 0,
            total_amount: parseFloat(stats.total_amount || 0),
            total_commission: parseFloat(stats.total_commission || 0),
            commission_rate: parseFloat(sale.commission_rate || 0.30),
            // 添加完整的订单数据供前端使用
            orders: orders || [],
            // 生成销售链接
            user_sales_link: sale.sales_code ? `/purchase?sales_code=${sale.sales_code}` : '',
            secondary_registration_link: (sale.sales_type === 'primary' && sale.secondary_registration_code) ? 
              `/secondary-sales?sales_code=${sale.secondary_registration_code}` : '',
            // 销售类型显示
            sales_type_display: {
              'primary': '一级销售',
              'secondary': '二级销售',
              'legacy': '遗留销售'
            }[sale.sales_type] || '未知类型'
          };
        } catch (error) {
          console.error(`获取销售${sale.id}统计失败:`, error);
          return {
            ...sale,
            order_count: 0,
            total_amount: 0,
            total_commission: 0,
            commission_rate: parseFloat(sale.commission_rate || 0.30),
            orders: [] // 添加空的订单数组
          };
        }
      })
    );
    
    console.log(`📊 销售管理查询完成: 共${total}条记录，当前页${page}，每页${limit}条`);
    
    res.status(200).json({
      success: true,
      data: {
        sales: salesWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          total_sales: total,
          primary_sales: allSales.filter(s => s.sales_type === 'primary').length,
          secondary_sales: allSales.filter(s => s.sales_type === 'secondary').length,
          legacy_sales: allSales.filter(s => s.sales_type === 'legacy').length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 销售管理错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取销售数据失败'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 数据导出功能
async function handleDataExport(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取销售数据
    const [salesData] = await connection.execute(`
      SELECT 
        s.id,
        s.wechat_name,
        s.payment_method,
        s.sales_type,
        s.commission_rate,
        s.created_at,
        s.updated_at
      FROM sales s
      ORDER BY s.created_at DESC
    `);
    
    // 获取订单数据
    const [ordersData] = await connection.execute(`
      SELECT 
        o.id,
        o.tradingview_username,
        o.customer_wechat,
        o.amount,
        o.status,
        o.commission_amount,
        o.created_at,
        o.payment_time
      FROM orders o
      ORDER BY o.created_at DESC
    `);
    
    // 获取一级销售数据
    const [primarySalesData] = await connection.execute(`
      SELECT 
        ps.id,
        ps.wechat_name,
        ps.commission_rate,
        ps.created_at
      FROM primary_sales ps
      ORDER BY ps.created_at DESC
    `);
    
    // 获取二级销售数据
    const [secondarySalesData] = await connection.execute(`
      SELECT 
        ss.id,
        ss.wechat_name,
        ss.commission_rate,
        ss.primary_sales_id,
        ss.created_at
      FROM secondary_sales ss
      ORDER BY ss.created_at DESC
    `);
    
    const exportData = {
      export_time: new Date().toISOString(),
      sales_count: salesData.length,
      orders_count: ordersData.length,
      primary_sales_count: primarySalesData.length,
      secondary_sales_count: secondarySalesData.length,
      sales: salesData,
      orders: ordersData,
      primary_sales: primarySalesData,
      secondary_sales: secondarySalesData
    };
    
    res.status(200).json({
      success: true,
      message: '数据导出成功',
      data: exportData
    });
    
  } catch (error) {
    console.error('数据导出错误:', error);
    res.status(500).json({
      success: false,
      message: '数据导出失败',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 数据库结构调整
async function handleUpdateSchema(req, res) {
  let connection;
  
  try {
    console.log('🔧 开始销售分佣系统数据库结构调整...');
    
    connection = await mysql.createConnection(dbConfig);
    
    const tablesCreated = [];
    const tablesUpdated = [];
    const viewsCreated = [];
    const errors = [];
    
    // 1. 创建一级销售表
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS primary_sales (
          id INT AUTO_INCREMENT PRIMARY KEY,
          wechat_name VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(100),
          payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' COMMENT '收款方式：alipay=支付宝，crypto=线上地址码',
          payment_address TEXT COMMENT '收款地址',
          alipay_surname VARCHAR(50) COMMENT '支付宝收款人姓氏',
          chain_name VARCHAR(50) COMMENT '线上地址码链名',
          sales_code VARCHAR(32) UNIQUE COMMENT '用户购买链接代码 - ⚠️重要：代码生成不能超过此长度！',
          secondary_registration_code VARCHAR(32) UNIQUE COMMENT '二级销售注册代码 - ⚠️重要：代码生成不能超过此长度！',
          bank_info TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      tablesCreated.push('primary_sales');
      console.log('✅ 一级销售表创建成功');
    } catch (error) {
      errors.push(`创建一级销售表失败: ${error.message}`);
    }
    
    // 2. 创建二级销售表
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS secondary_sales (
          id INT AUTO_INCREMENT PRIMARY KEY,
          wechat_name VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(100),
          primary_sales_id INT NULL COMMENT '一级销售ID，独立注册时为NULL',
          commission_rate DECIMAL(5,2) DEFAULT 30.00,
          payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' COMMENT '收款方式：alipay=支付宝，crypto=线上地址码',
          payment_address TEXT COMMENT '收款地址',
          alipay_surname VARCHAR(50) COMMENT '支付宝收款人姓氏',
          chain_name VARCHAR(50) COMMENT '线上地址码链名',
          sales_code VARCHAR(32) UNIQUE COMMENT '用户购买链接代码 - ⚠️重要：代码生成不能超过此长度！',
          status ENUM('active', 'inactive') DEFAULT 'active',
          bank_info TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      tablesCreated.push('secondary_sales');
      console.log('✅ 二级销售表创建成功');
    } catch (error) {
      errors.push(`创建二级销售表失败: ${error.message}`);
    }
    
    // 3. 创建销售层级关系表
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sales_hierarchy (
          id INT AUTO_INCREMENT PRIMARY KEY,
          primary_sales_id INT NOT NULL,
          secondary_sales_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_hierarchy (primary_sales_id, secondary_sales_id)
        )
      `);
      tablesCreated.push('sales_hierarchy');
      console.log('✅ 销售层级关系表创建成功');
    } catch (error) {
      errors.push(`创建销售层级关系表失败: ${error.message}`);
    }
    
    // 4. 更新现有销售表结构
    try {
      // 检查sales_type列是否存在
      const [salesColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'sales_type'
      `, [process.env.DB_NAME]);
      
      if (salesColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE sales 
          ADD COLUMN sales_type ENUM('primary', 'secondary') DEFAULT 'secondary'
        `);
        console.log('✅ 添加sales_type列成功');
      }
      
      // 检查primary_sales_id列是否存在
      const [primarySalesColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'primary_sales_id'
      `, [process.env.DB_NAME]);
      
      if (primarySalesColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE sales 
          ADD COLUMN primary_sales_id INT NULL
        `);
        console.log('✅ 添加primary_sales_id列成功');
      }
      
      // 检查commission_rate列是否存在
      const [commissionColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'commission_rate'
      `, [process.env.DB_NAME]);
      
      if (commissionColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE sales 
          ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 30.00
        `);
        console.log('✅ 添加commission_rate列成功');
      }
      
      tablesUpdated.push('sales');
      console.log('✅ 销售表结构更新成功');
    } catch (error) {
      errors.push(`更新销售表结构失败: ${error.message}`);
    }
    
    // 5. 更新订单表结构
    try {
      // 检查sales_id列是否存在
      const [orderSalesColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'sales_id'
      `, [process.env.DB_NAME]);
      
      if (orderSalesColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN sales_id INT NULL
        `);
        console.log('✅ 添加orders.sales_id列成功');
      }
      
      // 检查primary_sales_id列是否存在
      const [orderPrimaryColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'primary_sales_id'
      `, [process.env.DB_NAME]);
      
      if (orderPrimaryColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN primary_sales_id INT NULL
        `);
        console.log('✅ 添加orders.primary_sales_id列成功');
      }
      
      // 检查secondary_sales_id列是否存在
      const [orderSecondaryColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'secondary_sales_id'
      `, [process.env.DB_NAME]);
      
      if (orderSecondaryColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN secondary_sales_id INT NULL
        `);
        console.log('✅ 添加orders.secondary_sales_id列成功');
      }
      
      // 检查primary_commission列是否存在
      const [primaryCommissionColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'primary_commission'
      `, [process.env.DB_NAME]);
      
      if (primaryCommissionColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN primary_commission DECIMAL(10,2) DEFAULT 0.00
        `);
        console.log('✅ 添加primary_commission列成功');
      }
      
      // 检查secondary_commission列是否存在
      const [secondaryCommissionColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'secondary_commission'
      `, [process.env.DB_NAME]);
      
      if (secondaryCommissionColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN secondary_commission DECIMAL(10,2) DEFAULT 0.00
        `);
        console.log('✅ 添加secondary_commission列成功');
      }
      
      tablesUpdated.push('orders');
      console.log('✅ 订单表结构更新成功');
    } catch (error) {
      errors.push(`更新订单表结构失败: ${error.message}`);
    }
    
    // 6. 创建销售层级视图
    try {
      await connection.execute(`
        CREATE OR REPLACE VIEW sales_hierarchy_view AS
        SELECT 
          ps.id as primary_sales_id,
          ps.wechat_name as primary_wechat_name,
          ss.id as secondary_sales_id,
          ss.wechat_name as secondary_wechat_name,
          ss.commission_rate,
          sh.created_at as hierarchy_created_at
        FROM primary_sales ps
        LEFT JOIN sales_hierarchy sh ON ps.id = sh.primary_sales_id
        LEFT JOIN secondary_sales ss ON sh.secondary_sales_id = ss.id
      `);
      viewsCreated.push('sales_hierarchy_view');
      console.log('✅ 销售层级视图创建成功');
    } catch (error) {
      errors.push(`创建销售层级视图失败: ${error.message}`);
    }
    
    // 7. 创建销售业绩视图
    try {
      await connection.execute(`
        CREATE OR REPLACE VIEW sales_performance_view AS
        SELECT 
          ps.id as primary_sales_id,
          ps.wechat_name as primary_wechat_name,
          COUNT(DISTINCT ss.id) as secondary_sales_count,
          COUNT(o.id) as total_orders,
          SUM(o.amount) as total_amount,
          SUM(o.primary_commission) as total_primary_commission,
          SUM(o.secondary_commission) as total_secondary_commission
        FROM primary_sales ps
        LEFT JOIN sales_hierarchy sh ON ps.id = sh.primary_sales_id
        LEFT JOIN secondary_sales ss ON sh.secondary_sales_id = ss.id
        LEFT JOIN orders o ON (ps.id = o.primary_sales_id OR ss.id = o.secondary_sales_id)
        GROUP BY ps.id, ps.wechat_name
      `);
      viewsCreated.push('sales_performance_view');
      console.log('✅ 销售业绩视图创建成功');
    } catch (error) {
      errors.push(`创建销售业绩视图失败: ${error.message}`);
    }
    
    // 8. 添加缺失的关键字段
    const fieldAddLogs = []; // 收集详细日志
    try {
      // 添加primary_sales.phone字段
      const [primaryPhoneColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'primary_sales' AND COLUMN_NAME = 'phone'
      `, [process.env.DB_NAME]);
      
      if (primaryPhoneColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE primary_sales 
          ADD COLUMN phone VARCHAR(20) NULL
        `);
        console.log('✅ 添加primary_sales.phone字段成功');
      }
      
      // 添加primary_sales.email字段
      const [primaryEmailColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'primary_sales' AND COLUMN_NAME = 'email'
      `, [process.env.DB_NAME]);
      
      if (primaryEmailColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE primary_sales 
          ADD COLUMN email VARCHAR(100) NULL
        `);
        console.log('✅ 添加primary_sales.email字段成功');
      }
      
      // 添加primary_sales.sales_code字段（核心字段）
      fieldAddLogs.push('🔍 检查primary_sales.sales_code字段是否存在...');
      const [primarySalesCodeColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'primary_sales' AND COLUMN_NAME = 'sales_code'
      `, [process.env.DB_NAME]);
      
      fieldAddLogs.push(`🔍 primary_sales.sales_code字段检查结果: ${primarySalesCodeColumns.length}`);
      
      if (primarySalesCodeColumns.length === 0) {
        fieldAddLogs.push('⚡ 开始执行 ALTER TABLE primary_sales ADD COLUMN sales_code...');
        try {
          await connection.execute(`
            ALTER TABLE primary_sales 
            ADD COLUMN sales_code VARCHAR(50) UNIQUE NULL
          `);
          fieldAddLogs.push('✅ 添加primary_sales.sales_code字段成功');
        } catch (alterError) {
          fieldAddLogs.push(`❌ ALTER TABLE primary_sales失败: ${alterError.message}`);
          errors.push(`添加primary_sales.sales_code失败: ${alterError.message}`);
        }
      } else {
        fieldAddLogs.push('ℹ️ primary_sales.sales_code字段已存在，跳过添加');
      }
      
      // 添加secondary_sales.sales_code字段（核心字段）
      fieldAddLogs.push('🔍 检查secondary_sales.sales_code字段是否存在...');
      const [secondarySalesCodeColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'secondary_sales' AND COLUMN_NAME = 'sales_code'
      `, [process.env.DB_NAME]);
      
      fieldAddLogs.push(`🔍 secondary_sales.sales_code字段检查结果: ${secondarySalesCodeColumns.length}`);
      
      if (secondarySalesCodeColumns.length === 0) {
        fieldAddLogs.push('⚡ 开始执行 ALTER TABLE secondary_sales ADD COLUMN sales_code...');
        try {
          await connection.execute(`
            ALTER TABLE secondary_sales 
            ADD COLUMN sales_code VARCHAR(50) UNIQUE NULL
          `);
          fieldAddLogs.push('✅ 添加secondary_sales.sales_code字段成功');
        } catch (alterError) {
          fieldAddLogs.push(`❌ ALTER TABLE secondary_sales失败: ${alterError.message}`);
          errors.push(`添加secondary_sales.sales_code失败: ${alterError.message}`);
        }
      } else {
        fieldAddLogs.push('ℹ️ secondary_sales.sales_code字段已存在，跳过添加');
      }
      
      // 添加secondary_sales.payment_address字段
      const [paymentAddressColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'secondary_sales' AND COLUMN_NAME = 'payment_address'
      `, [process.env.DB_NAME]);
      
      if (paymentAddressColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE secondary_sales 
          ADD COLUMN payment_address TEXT NULL
        `);
        console.log('✅ 添加secondary_sales.payment_address字段成功');
      }
      
      // 修复payment_method字段枚举值（关键修复）
      fieldAddLogs.push('🔧 开始修复payment_method枚举值...');
      
      try {
        // 修复primary_sales.payment_method
        await connection.execute(`
          ALTER TABLE primary_sales 
          MODIFY COLUMN payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' 
          COMMENT '收款方式：alipay=支付宝，crypto=线上地址码'
        `);
        fieldAddLogs.push('✅ primary_sales.payment_method枚举值修复成功');
      } catch (primaryPaymentError) {
        fieldAddLogs.push(`❌ primary_sales.payment_method修复失败: ${primaryPaymentError.message}`);
        // 如果字段不存在，添加它
        try {
          await connection.execute(`
            ALTER TABLE primary_sales 
            ADD COLUMN payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' 
            COMMENT '收款方式：alipay=支付宝，crypto=线上地址码'
          `);
          fieldAddLogs.push('✅ primary_sales.payment_method字段添加成功');
        } catch (addError) {
          fieldAddLogs.push(`❌ primary_sales.payment_method字段添加失败: ${addError.message}`);
        }
      }
      
      try {
        // 修复secondary_sales.payment_method
        await connection.execute(`
          ALTER TABLE secondary_sales 
          MODIFY COLUMN payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' 
          COMMENT '收款方式：alipay=支付宝，crypto=线上地址码'
        `);
        fieldAddLogs.push('✅ secondary_sales.payment_method枚举值修复成功');
      } catch (secondaryPaymentError) {
        fieldAddLogs.push(`❌ secondary_sales.payment_method修复失败: ${secondaryPaymentError.message}`);
        // 如果字段不存在，添加它
        try {
          await connection.execute(`
            ALTER TABLE secondary_sales 
            ADD COLUMN payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' 
            COMMENT '收款方式：alipay=支付宝，crypto=线上地址码'
          `);
          fieldAddLogs.push('✅ secondary_sales.payment_method字段添加成功');
        } catch (addError) {
          fieldAddLogs.push(`❌ secondary_sales.payment_method字段添加失败: ${addError.message}`);
        }
      }
      
      fieldAddLogs.push('🎉 payment_method枚举值修复完成');
      
      // 修复secondary_sales.primary_sales_id字段允许NULL（独立注册支持）
      fieldAddLogs.push('🔧 开始修复secondary_sales.primary_sales_id字段...');
      
      try {
        // 修改字段为允许NULL，支持独立二级销售注册
        await connection.execute(`
          ALTER TABLE secondary_sales 
          MODIFY COLUMN primary_sales_id INT NULL 
          COMMENT '一级销售ID，独立注册时为NULL'
        `);
        fieldAddLogs.push('✅ secondary_sales.primary_sales_id修复成功 - 现在支持独立注册');
      } catch (primaryIdError) {
        fieldAddLogs.push(`❌ secondary_sales.primary_sales_id修复失败: ${primaryIdError.message}`);
        errors.push(`修复primary_sales_id字段失败: ${primaryIdError.message}`);
      }
      
      fieldAddLogs.push('🎉 所有字段修复完成');
      
    } catch (error) {
      errors.push(`添加关键字段失败: ${error.message}`);
      fieldAddLogs.push(`❌ 整体错误: ${error.message}`);
    }
    
    // 9. 创建索引优化
    try {
      // 检查并创建索引
      const [indexes] = await connection.execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'primary_sales' AND INDEX_NAME = 'idx_primary_sales_wechat'
      `, [process.env.DB_NAME]);
      
      if (indexes.length === 0) {
        await connection.execute(`CREATE INDEX idx_primary_sales_wechat ON primary_sales(wechat_name)`);
        console.log('✅ 创建primary_sales索引成功');
      }
      
      const [secondaryIndexes] = await connection.execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'secondary_sales' AND INDEX_NAME = 'idx_secondary_sales_wechat'
      `, [process.env.DB_NAME]);
      
      if (secondaryIndexes.length === 0) {
        await connection.execute(`CREATE INDEX idx_secondary_sales_wechat ON secondary_sales(wechat_name)`);
        console.log('✅ 创建secondary_sales索引成功');
      }
      
      const [ordersPrimaryIndexes] = await connection.execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_primary_sales'
      `, [process.env.DB_NAME]);
      
      if (ordersPrimaryIndexes.length === 0) {
        await connection.execute(`CREATE INDEX idx_orders_primary_sales ON orders(primary_sales_id)`);
        console.log('✅ 创建orders primary_sales索引成功');
      }
      
      const [ordersSecondaryIndexes] = await connection.execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_secondary_sales'
      `, [process.env.DB_NAME]);
      
      if (ordersSecondaryIndexes.length === 0) {
        await connection.execute(`CREATE INDEX idx_orders_secondary_sales ON orders(secondary_sales_id)`);
        console.log('✅ 创建orders secondary_sales索引成功');
      }
      
      console.log('✅ 索引创建完成');
    } catch (error) {
      errors.push(`创建索引失败: ${error.message}`);
    }
    
    // 获取所有表名
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
    `, [process.env.DB_NAME]);
    
    const tableNames = tables.map(table => table.TABLE_NAME);
    const totalTables = tableNames.length;
    
    await connection.end();
    
    console.log('🎉 销售分佣系统数据库结构调整完成');
    
    res.json({
      success: true,
      message: '销售分佣系统数据库结构调整成功',
      data: {
        tables_created: tablesCreated,
        tables_updated: tablesUpdated,
        views_created: viewsCreated,
        total_tables: totalTables,
        table_names: tableNames,
        errors: errors,
        field_add_logs: fieldAddLogs || [] // 添加详细的字段添加日志
      }
    });
    
  } catch (error) {
    console.error('❌ 销售分佣系统数据库结构调整失败:', error);
    
    if (connection) {
      await connection.end();
    }
    
    res.status(500).json({
      success: false,
      message: '数据库结构调整失败',
      error: error.message
    });
  }
}

// 统计信息（按订单管理数据统计，不使用config_confirmed过滤）
async function handleStats(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取时间范围参数
    const { timeRange = 'all', customRange } = req.query; // 默认改为'all'显示所有数据
    let dateFilter = '';
    let dateParams = [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    console.log(`📊 数据概览请求 - 时间范围: ${timeRange}`);
    
    switch (timeRange) {
      case 'today':
        dateFilter = 'AND o.created_at >= ?';
        dateParams = [today];
        console.log(`📅 今天过滤: >= ${today.toISOString()}`);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = 'AND o.created_at >= ?';
        dateParams = [weekAgo];
        console.log(`📅 本周过滤: >= ${weekAgo.toISOString()}`);
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = 'AND o.created_at >= ?';
        dateParams = [monthStart];
        console.log(`📅 本月过滤: >= ${monthStart.toISOString()}`);
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        dateFilter = 'AND o.created_at >= ?';
        dateParams = [yearStart];
        console.log(`📅 本年过滤: >= ${yearStart.toISOString()}`);
        break;
      case 'custom':
        if (customRange && customRange.length === 2) {
          dateFilter = 'AND o.created_at BETWEEN ? AND ?';
          dateParams = [new Date(customRange[0]), new Date(customRange[1])];
          console.log(`📅 自定义范围过滤: ${customRange[0]} 到 ${customRange[1]}`);
        }
        break;
      case 'all':
      default:
        // 不添加任何日期过滤，显示所有数据
        console.log(`📅 显示所有数据，无时间过滤`);
        break;
    }
    
    // 基础订单统计（所有订单，不过滤config_confirmed）
    const [orderStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(o.amount), 0) as total_amount,
        COALESCE(SUM(o.commission_amount), 0) as total_commission,
        COUNT(CASE WHEN o.status = 'pending_payment' THEN 1 END) as pending_payment_orders,
        COUNT(CASE WHEN o.status = 'confirmed_payment' THEN 1 END) as confirmed_payment_orders,
        COUNT(CASE WHEN o.status = 'pending_config' THEN 1 END) as pending_config_orders,
        COUNT(CASE WHEN o.status = 'confirmed_configuration' THEN 1 END) as confirmed_config_orders,
        COUNT(CASE WHEN o.duration = '1month' THEN 1 END) as one_month_orders,
        COUNT(CASE WHEN o.duration = '3months' THEN 1 END) as three_month_orders,
        COUNT(CASE WHEN o.duration = '6months' THEN 1 END) as six_month_orders,
        COUNT(CASE WHEN o.duration = '1year' THEN 1 END) as lifetime_orders,
        COUNT(CASE WHEN o.duration = '7days' THEN 1 END) as free_orders
      FROM orders o
      WHERE 1=1 ${dateFilter}
    `, dateParams);
    
    const stats = orderStats[0];
    // 简化日志避免500错误
    console.log('📊 订单统计:', stats.total_orders, '订单, $', stats.total_amount);
    
    // 销售统计
    const [salesStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN sales_type = 'primary' OR table_name = 'primary_sales' THEN 1 END) as primary_sales_count,
        COUNT(CASE WHEN sales_type = 'secondary' OR table_name = 'secondary_sales' THEN 1 END) as secondary_sales_count
      FROM (
        SELECT sales_type, 'primary_sales' as table_name FROM primary_sales
        UNION ALL
        SELECT sales_type, 'secondary_sales' as table_name FROM secondary_sales
        UNION ALL
        SELECT sales_type, 'sales' as table_name FROM sales
      ) all_sales
    `);
    
    // 客户统计（按不同用户名计算）
    const [customerStats] = await connection.execute(`
      SELECT COUNT(DISTINCT o.tradingview_username) as total_customers
      FROM orders o
      WHERE 1=1 ${dateFilter}
    `, dateParams);
    
    const stats = orderStats[0];
    const sales = salesStats[0];
    const customers = customerStats[0];
    
    // 计算百分比
    const totalOrders = stats.total_orders || 1; // 避免除零
    const orderData = {
      total_orders: stats.total_orders || 0,
      pending_payment_orders: stats.pending_payment_orders || 0,
      confirmed_payment_orders: stats.confirmed_payment_orders || 0,
      pending_config_orders: stats.pending_config_orders || 0,
      confirmed_config_orders: stats.confirmed_config_orders || 0,
      total_amount: parseFloat(stats.total_amount) || 0,
      total_commission: parseFloat(stats.total_commission) || 0,
      total_customers: customers.total_customers || 0,
      primary_sales_count: sales.primary_sales_count || 0,
      secondary_sales_count: sales.secondary_sales_count || 0,
      
      // 订单分类统计
      one_month_orders: stats.one_month_orders || 0,
      three_month_orders: stats.three_month_orders || 0,
      six_month_orders: stats.six_month_orders || 0,
      lifetime_orders: stats.lifetime_orders || 0,
      free_orders: stats.free_orders || 0,
      
      // 百分比计算 - 返回数字供前端格式化
      one_month_percentage: ((stats.one_month_orders || 0) / totalOrders * 100),
      three_month_percentage: ((stats.three_month_orders || 0) / totalOrders * 100),
      six_month_percentage: ((stats.six_month_orders || 0) / totalOrders * 100),
      lifetime_percentage: ((stats.lifetime_orders || 0) / totalOrders * 100),
      free_percentage: ((stats.free_orders || 0) / totalOrders * 100),
      
      // 层级关系统计（保留除活跃层级关系外的统计）
      avg_secondary_per_primary: sales.primary_sales_count > 0 ? 
        (sales.secondary_sales_count / sales.primary_sales_count) : 0,
      max_secondary_per_primary: 0 // 需要更复杂的查询来计算
    };

    res.json({
      success: true,
      data: orderData
    });
    
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  } finally {
    if (connection) await connection.end();
  }
}

// 客户管理功能 - 重构版支持新的数据库结构
async function handleCustomers(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取搜索参数
    const { 
      customer_wechat, 
      sales_wechat, 
      tradingview_username,
      is_reminded, 
      start_date, 
      end_date,
      duration_filter,
      reminder_status,
      page = 1,
      limit = 50
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // 构建WHERE条件 - 移除config_confirmed过滤，显示所有订单
    let whereConditions = []; // 显示所有订单，不再过滤配置状态
    let queryParams = [];
    
    if (customer_wechat) {
      whereConditions.push('o.customer_wechat LIKE ?');
      queryParams.push(`%${customer_wechat}%`);
    }
    
    if (tradingview_username) {
      whereConditions.push('o.tradingview_username LIKE ?');
      queryParams.push(`%${tradingview_username}%`);
    }
    
    if (sales_wechat) {
      whereConditions.push('(ps.wechat_name LIKE ? OR ss.wechat_name LIKE ? OR s.wechat_name LIKE ?)');
      queryParams.push(`%${sales_wechat}%`, `%${sales_wechat}%`, `%${sales_wechat}%`);
    }
    
    if (is_reminded !== undefined) {
      whereConditions.push('o.is_reminded = ?');
      queryParams.push(is_reminded === 'true');
    }
    
    if (reminder_status) {
      if (reminder_status === 'reminded') {
        whereConditions.push('o.is_reminded = true');
      } else if (reminder_status === 'not_reminded') {
        whereConditions.push('(o.is_reminded = false OR o.is_reminded IS NULL)');
      }
    }
    
    if (duration_filter) {
      whereConditions.push('o.duration = ?');
      queryParams.push(duration_filter);
    }
    
    if (start_date && end_date) {
      whereConditions.push('DATE(o.expiry_time) BETWEEN ? AND ?');
      queryParams.push(start_date, end_date);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 客户数据查询 - 支持新的多表关联
    const [customers] = await connection.execute(`
      SELECT 
        o.customer_wechat,
        o.tradingview_username,
        o.duration,
        
        -- 销售微信号（优先级：一级 > 二级 > 遗留）
        COALESCE(ps.wechat_name, ss.wechat_name, s.wechat_name) as sales_wechat,
        
        -- 销售类型
        CASE 
          WHEN ps.id IS NOT NULL THEN '一级销售'
          WHEN ss.id IS NOT NULL THEN '二级销售'
          WHEN s.id IS NOT NULL THEN '遗留销售'
          ELSE '未知类型'
        END as sales_type,
        
        -- 订单统计
        COUNT(o.id) as total_orders,
        SUM(o.amount) as total_amount,
        SUM(o.commission_amount) as commission_amount,
        
        -- 时间信息
        MAX(o.expiry_time) as expiry_date,
        MIN(o.created_at) as first_order_date,
        MAX(o.created_at) as last_order_date,
        
        -- 催单信息
        MAX(o.is_reminded) as is_reminded,
        MAX(o.reminder_date) as reminder_date,
        
        -- 订单状态统计
        COUNT(CASE WHEN o.status = 'confirmed_configuration' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN o.status = 'pending_config' THEN 1 END) as pending_orders,
        
        -- 到期状态
        CASE 
          WHEN MAX(o.expiry_time) < NOW() THEN '已过期'
          WHEN MAX(o.expiry_time) < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN '即将过期'
          ELSE '正常'
        END as expiry_status
        
      FROM orders o
      
      -- 关联一级销售表
      LEFT JOIN primary_sales ps ON (
        (o.sales_type = 'primary' AND o.primary_sales_id = ps.id) OR
        (o.sales_code = ps.sales_code)
      )
      
      -- 关联二级销售表
      LEFT JOIN secondary_sales ss ON (
        (o.sales_type = 'secondary' AND o.secondary_sales_id = ss.id) OR
        (o.sales_code = ss.sales_code)
      )
      
      -- 兼容遗留销售表
      LEFT JOIN sales s ON (
        o.sales_id = s.id OR 
        o.sales_code = s.sales_code OR
        o.link_code = s.link_code
      )
      
      ${whereClause}
      GROUP BY o.customer_wechat, o.tradingview_username, o.duration,
               COALESCE(ps.wechat_name, ss.wechat_name, s.wechat_name),
               ps.id, ss.id, s.id
      ORDER BY 
        CASE 
          WHEN MAX(o.expiry_time) < NOW() THEN 1          -- 已过期的最先
          WHEN MAX(o.expiry_time) < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 2  -- 即将过期的其次
          ELSE 3                                          -- 正常的最后
        END,
        MAX(o.expiry_time) ASC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);
    
    // 获取总数
    const [countResult] = await connection.execute(`
      SELECT COUNT(DISTINCT CONCAT(o.customer_wechat, '_', o.tradingview_username)) as total
      FROM orders o
      LEFT JOIN primary_sales ps ON (
        (o.sales_type = 'primary' AND o.primary_sales_id = ps.id) OR
        (o.sales_code = ps.sales_code)
      )
      LEFT JOIN secondary_sales ss ON (
        (o.sales_type = 'secondary' AND o.secondary_sales_id = ss.id) OR
        (o.sales_code = ss.sales_code)
      )
      LEFT JOIN sales s ON (
        o.sales_id = s.id OR 
        o.sales_code = s.sales_code OR
        o.link_code = s.link_code
      )
      ${whereClause}
    `, queryParams);
    
    const total = countResult[0]?.total || 0;
    
    // 数据后处理
    const processedCustomers = customers.map(customer => ({
      ...customer,
      customer_wechat: customer.customer_wechat || '-',
      sales_wechat: customer.sales_wechat || '-',
      total_amount: parseFloat(customer.total_amount || 0),
      commission_amount: parseFloat(customer.commission_amount || 0),
      is_reminded: Boolean(customer.is_reminded),
      duration_display: {
        '7days': '7天免费',
        '1month': '1个月',
        '3months': '3个月',
        '6months': '6个月',
        'lifetime': '终身'
      }[customer.duration] || customer.duration
    }));
    
    console.log(`📊 客户管理查询完成: 共${total}条记录，当前页${page}，每页${limit}条`);
    
    res.status(200).json({
      success: true,
      data: { 
        customers: processedCustomers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          total_customers: total,
          expired_customers: processedCustomers.filter(c => c.expiry_status === '已过期').length,
          expiring_soon: processedCustomers.filter(c => c.expiry_status === '即将过期').length,
          reminded_customers: processedCustomers.filter(c => c.is_reminded).length
        }
      }
    });
  } catch (error) {
    console.error('❌ 客户管理查询错误:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) await connection.end();
  }
}

// 催单功能
async function handleRemindCustomer(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { customer_wechat, tradingview_username } = req.body;
    
    if (!customer_wechat || !tradingview_username) {
      return res.status(400).json({
        success: false,
        message: "客户微信和TradingView用户名不能为空"
      });
    }
    
    const [result] = await connection.execute(`
      UPDATE orders 
      SET is_reminded = TRUE, reminder_date = NOW()
      WHERE customer_wechat = ? AND tradingview_username = ?
    `, [customer_wechat, tradingview_username]);
    
    res.status(200).json({
      success: true,
      message: "催单成功",
      data: { affected_rows: result.affectedRows }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) await connection.end();
  }
}

// 更新订单状态功能
async function handleUpdateOrderStatus(req, res) {
  let connection;
  try {
    console.log('🔄 订单状态更新请求:', {
      query: req.query,
      body: req.body,
      method: req.method,
      url: req.url
    });
    
    connection = await mysql.createConnection(dbConfig);
    const { id } = req.query;
    const { status } = req.body;
    
    console.log(`📋 更新订单 ${id} 状态为: ${status}`);
    
    if (!id || !status) {
      console.log('❌ 参数验证失败: ID或状态为空');
      return res.status(400).json({
        success: false,
        message: "订单ID和状态不能为空",
        debug: { id, status }
      });
    }
    
    // 验证状态值
    const validStatuses = [
      'pending_payment', 
      'confirmed_payment', 
      'pending_config', 
      'confirmed_configuration', 
      'active', 
      'expired', 
      'cancelled', 
      'rejected'
    ];
    
    if (!validStatuses.includes(status)) {
      console.log(`❌ 状态验证失败: ${status} 不在有效状态列表中`);
      return res.status(400).json({
        success: false,
        message: `无效的状态值: ${status}`,
        validStatuses
      });
    }
    
    // 获取订单信息
    console.log(`🔍 查询订单 ${id} 的信息...`);
    const [orders] = await connection.execute(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );
    
    if (orders.length === 0) {
      console.log(`❌ 订单 ${id} 不存在`);
      return res.status(404).json({
        success: false,
        message: '订单不存在',
        orderId: id
      });
    }
    
    const order = orders[0];
    console.log(`📋 找到订单: ID=${order.id}, 当前状态=${order.status}, 即将更新为=${status}`);
    
    // 更新订单状态（简化版，只更新status字段）
    const updateQuery = 'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?';
    const updateParams = [status, id];
    
    console.log(`🔄 执行更新SQL: ${updateQuery}`, updateParams);
    const [result] = await connection.execute(updateQuery, updateParams);
    
    if (result.affectedRows === 0) {
      console.log(`❌ 更新失败: 没有行被影响`);
      return res.status(400).json({
        success: false,
        message: '更新失败',
        debug: { updateQuery, updateParams, result }
      });
    }
    
    console.log(`✅ 订单${id}状态更新为: ${status}`);
    
    res.status(200).json({
      success: true,
      message: '订单状态更新成功',
      data: { 
        orderId: parseInt(id), 
        status: status,
        affected_rows: result.affectedRows 
      }
    });
    
  } catch (error) {
    console.error('❌ 更新订单状态错误:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sql: error.sql
    });
    res.status(500).json({ 
      success: false, 
      message: error.message,
      debug: {
        code: error.code,
        errno: error.errno
      }
    });
  } finally {
    if (connection) await connection.end();
  }
}

// 更新佣金率功能
async function handleUpdateCommissionRate(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { sales_id, sales_type } = req.query;
    const { commission_rate } = req.body;
    
    if (!sales_id || !commission_rate || !sales_type) {
      return res.status(400).json({
        success: false,
        message: "销售ID、佣金率和销售类型不能为空"
      });
    }
    
    const rate = parseFloat(commission_rate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({
        success: false,
        message: "佣金率必须为0-100之间的数字"
      });
    }
    
    // 根据销售类型更新不同的表
    let updateQuery;
    let tableName;
    
    switch (sales_type) {
      case 'primary':
        tableName = 'primary_sales';
        updateQuery = 'UPDATE primary_sales SET commission_rate = ?, updated_at = NOW() WHERE id = ?';
        break;
      case 'secondary':
        tableName = 'secondary_sales';
        updateQuery = 'UPDATE secondary_sales SET commission_rate = ?, updated_at = NOW() WHERE id = ?';
        break;
      case 'legacy':
      default:
        tableName = 'sales';
        updateQuery = 'UPDATE sales SET commission_rate = ?, updated_at = NOW() WHERE id = ?';
        break;
    }
    
    const [result] = await connection.execute(updateQuery, [rate, sales_id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '销售不存在或更新失败'
      });
    }
    
    console.log(`✅ ${tableName}表中销售${sales_id}的佣金率更新为: ${rate}%`);
    
    res.status(200).json({
      success: true,
      message: '佣金率更新成功',
      data: {
        sales_id,
        sales_type,
        new_commission_rate: rate,
        affected_rows: result.affectedRows
      }
    });
    
  } catch (error) {
    console.error('❌ 更新佣金率错误:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) await connection.end();
  }
}

// 销售管理更新佣金功能
async function handleUpdateSalesCommission(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { salesId, commissionRate, salesType } = req.body;
    
    if (!salesId || commissionRate === undefined || !salesType) {
      return res.status(400).json({
        success: false,
        message: "销售ID、佣金率和销售类型不能为空"
      });
    }
    
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({
        success: false,
        message: "佣金率必须为0-100之间的数字"
      });
    }
    
    // 根据销售类型更新不同的表
    let updateQuery;
    let tableName;
    
    switch (salesType) {
      case 'primary':
        tableName = 'primary_sales';
        updateQuery = 'UPDATE primary_sales SET commission_rate = ?, updated_at = NOW() WHERE id = ?';
        break;
      case 'secondary':
        tableName = 'secondary_sales';
        updateQuery = 'UPDATE secondary_sales SET commission_rate = ?, updated_at = NOW() WHERE id = ?';
        break;
      case 'legacy':
      default:
        tableName = 'sales';
        updateQuery = 'UPDATE sales SET commission_rate = ?, updated_at = NOW() WHERE id = ?';
        break;
    }
    
    const [result] = await connection.execute(updateQuery, [rate, salesId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '销售不存在或更新失败'
      });
    }
    
    console.log(`✅ 销售管理更新: ${tableName}表中销售${salesId}的佣金率更新为: ${rate}%`);
    
    res.status(200).json({
      success: true,
      message: '佣金率更新成功',
      data: {
        salesId,
        salesType,
        newCommissionRate: rate,
        affectedRows: result.affectedRows
      }
    });
    
  } catch (error) {
    console.error('❌ 销售管理更新佣金率错误:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) await connection.end();
  }
}

// 修复缺失的数据库字段
async function handleFixMissingFields(req, res) {
  let connection;
  
  try {
    console.log('🔧 开始修复缺失的数据库字段...');
    
    connection = await mysql.createConnection(dbConfig);
    
    const fieldsAdded = [];
    const fieldsSkipped = [];
    const errors = [];
    
    // 定义需要添加的字段
    const missingFields = [
      {
        table: 'orders',
        field: 'sales_code',
        definition: 'VARCHAR(50) COMMENT "销售代码"'
      },
      {
        table: 'orders', 
        field: 'sales_type',
        definition: 'ENUM("primary", "secondary") COMMENT "销售类型"'
      },
      {
        table: 'orders',
        field: 'customer_wechat', 
        definition: 'VARCHAR(100) COMMENT "客户微信号"'
      },
      {
        table: 'orders',
        field: 'purchase_type',
        definition: 'ENUM("immediate", "advance") DEFAULT "immediate" COMMENT "购买方式"'
      },
      {
        table: 'orders',
        field: 'effective_time',
        definition: 'DATETIME COMMENT "生效时间"'
      },
      {
        table: 'orders',
        field: 'expiry_time', 
        definition: 'DATETIME COMMENT "到期时间"'
      },
      {
        table: 'orders',
        field: 'alipay_amount',
        definition: 'DECIMAL(10,2) COMMENT "支付宝付款金额"'
      },
      {
        table: 'orders',
        field: 'crypto_amount',
        definition: 'DECIMAL(10,2) COMMENT "加密货币付款金额"'
      },
      {
        table: 'orders',
        field: 'commission_rate',
        definition: 'DECIMAL(5,4) DEFAULT 0.3000 COMMENT "佣金比率"'
      },
      {
        table: 'orders',
        field: 'commission_amount',
        definition: 'DECIMAL(10,2) DEFAULT 0.00 COMMENT "佣金金额"'
      },
      {
        table: 'orders',
        field: 'primary_sales_id',
        definition: 'INT COMMENT "一级销售ID"'
      },
      {
        table: 'orders',
        field: 'secondary_sales_id',
        definition: 'INT COMMENT "二级销售ID"'
      },
      {
        table: 'orders',
        field: 'config_confirmed',
        definition: 'BOOLEAN DEFAULT FALSE COMMENT "配置确认状态"'
      },
      {
        table: 'orders',
        field: 'is_reminded',
        definition: 'BOOLEAN DEFAULT FALSE COMMENT "是否已催单"'
      },
      {
        table: 'orders',
        field: 'reminder_date',
        definition: 'DATETIME COMMENT "催单时间"'
      },
      {
        table: 'secondary_sales',
        field: 'sales_code',
        definition: 'VARCHAR(50) COMMENT "销售代码"'
      },
      {
        table: 'secondary_sales', 
        field: 'primary_sales_id',
        definition: 'INT COMMENT "关联的一级销售ID"'
      },
      {
        table: 'secondary_sales',
        field: 'primary_registration_code',
        definition: 'VARCHAR(50) COMMENT "注册时使用的一级销售代码"'
      },
      {
        table: 'secondary_sales',
        field: 'commission_rate',
        definition: 'DECIMAL(5,2) DEFAULT 30.00 COMMENT "佣金比率"'
      },
      {
        table: 'secondary_sales',
        field: 'status',
        definition: 'ENUM("active", "removed") DEFAULT "active" COMMENT "状态"'
      },
      {
        table: 'secondary_sales',
        field: 'sales_type',
        definition: 'ENUM("primary", "secondary") DEFAULT "secondary" COMMENT "销售类型"'
      },
      {
        table: 'primary_sales',
        field: 'sales_code',
        definition: 'VARCHAR(50) COMMENT "用户购买销售代码"'
      },
      {
        table: 'primary_sales',
        field: 'secondary_registration_code',
        definition: 'VARCHAR(50) COMMENT "二级销售注册代码"'
      },
      {
        table: 'primary_sales',
        field: 'commission_rate',
        definition: 'DECIMAL(5,2) DEFAULT 40.00 COMMENT "佣金比率"'
      },
      {
        table: 'primary_sales',
        field: 'sales_type',
        definition: 'ENUM("primary", "secondary") DEFAULT "primary" COMMENT "销售类型"'
      },
      {
        table: 'sales',
        field: 'sales_code',
        definition: 'VARCHAR(50) COMMENT "销售代码"'
      },
      {
        table: 'sales',
        field: 'sales_type',
        definition: 'ENUM("primary", "secondary", "legacy") DEFAULT "legacy" COMMENT "销售类型"'
      }
    ];
    
    // 检查并添加每个字段
    for (const fieldInfo of missingFields) {
      try {
        // 检查字段是否已存在
        const [columns] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
        `, [process.env.DB_NAME, fieldInfo.table, fieldInfo.field]);
        
        if (columns.length === 0) {
          // 字段不存在，添加它
          const alterSQL = `ALTER TABLE ${fieldInfo.table} ADD COLUMN ${fieldInfo.field} ${fieldInfo.definition}`;
          await connection.execute(alterSQL);
          
          fieldsAdded.push(`${fieldInfo.table}.${fieldInfo.field}`);
          console.log(`✅ 添加字段: ${fieldInfo.table}.${fieldInfo.field}`);
        } else {
          // 字段已存在
          fieldsSkipped.push(`${fieldInfo.table}.${fieldInfo.field}`);
          console.log(`⏭️  字段已存在: ${fieldInfo.table}.${fieldInfo.field}`);
        }
        
      } catch (error) {
        const errorMsg = `添加字段 ${fieldInfo.table}.${fieldInfo.field} 失败: ${error.message}`;
        errors.push(errorMsg);
        console.log(`❌ ${errorMsg}`);
      }
    }
    
    // 创建必要的索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_orders_sales_code ON orders(sales_code)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_config_confirmed ON orders(config_confirmed)',
      'CREATE INDEX IF NOT EXISTS idx_orders_is_reminded ON orders(is_reminded)',
      'CREATE INDEX IF NOT EXISTS idx_secondary_sales_code ON secondary_sales(sales_code)',
      'CREATE INDEX IF NOT EXISTS idx_primary_sales_code ON primary_sales(sales_code)'
    ];
    
    const indexesCreated = [];
    
    for (const indexSQL of indexes) {
      try {
        await connection.execute(indexSQL);
        const indexName = indexSQL.match(/idx_[a-zA-Z_]+/)[0];
        indexesCreated.push(indexName);
        console.log(`✅ 创建索引: ${indexName}`);
      } catch (error) {
        console.log(`⚠️  索引创建跳过: ${error.message}`);
      }
    }
    
    console.log('🎉 数据库字段修复完成！');
    
    res.json({
      success: true,
      message: '数据库字段修复成功',
      data: {
        fieldsAdded: fieldsAdded.length,
        fieldsSkipped: fieldsSkipped.length,
        indexesCreated: indexesCreated.length,
        errors: errors.length,
        details: {
          fieldsAdded,
          fieldsSkipped,
          indexesCreated,
          errors
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 修复数据库字段错误:', error);
    res.status(500).json({
      success: false,
      message: '修复数据库字段失败',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 清空测试数据功能
async function handleClearTestData(req, res) {
  let connection;
  
  try {
    console.log('🧹 开始清空测试数据...');
    connection = await mysql.createConnection(dbConfig);
    
    const clearedTables = [];
    
    // 清空订单表
    console.log('清空 orders 表...');
    const [ordersResult] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const ordersCount = ordersResult[0].count;
    await connection.execute('DELETE FROM orders');
    clearedTables.push({ name: 'orders', count: ordersCount });
    
    // 清空一级销售表
    console.log('清空 primary_sales 表...');
    const [primaryResult] = await connection.execute('SELECT COUNT(*) as count FROM primary_sales');
    const primaryCount = primaryResult[0].count;
    await connection.execute('DELETE FROM primary_sales');
    clearedTables.push({ name: 'primary_sales', count: primaryCount });
    
    // 清空二级销售表
    console.log('清空 secondary_sales 表...');
    const [secondaryResult] = await connection.execute('SELECT COUNT(*) as count FROM secondary_sales');
    const secondaryCount = secondaryResult[0].count;
    await connection.execute('DELETE FROM secondary_sales');
    clearedTables.push({ name: 'secondary_sales', count: secondaryCount });
    
    // 清空sales表（如果存在）
    try {
      console.log('清空 sales 表...');
      const [salesResult] = await connection.execute('SELECT COUNT(*) as count FROM sales');
      const salesCount = salesResult[0].count;
      await connection.execute('DELETE FROM sales');
      clearedTables.push({ name: 'sales', count: salesCount });
    } catch (error) {
      console.log('sales 表不存在或已清空');
    }
    
    // 清空links表（如果存在）
    try {
      console.log('清空 links 表...');
      const [linksResult] = await connection.execute('SELECT COUNT(*) as count FROM links');
      const linksCount = linksResult[0].count;
      await connection.execute('DELETE FROM links');
      clearedTables.push({ name: 'links', count: linksCount });
    } catch (error) {
      console.log('links 表不存在或已清空');
    }
    
    // 重置自增ID
    console.log('重置自增ID...');
    await connection.execute('ALTER TABLE orders AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE primary_sales AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE secondary_sales AUTO_INCREMENT = 1');
    
    try {
      await connection.execute('ALTER TABLE sales AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE links AUTO_INCREMENT = 1');
    } catch (error) {
      // 表不存在时忽略错误
    }
    
    console.log('✅ 测试数据清空完成');
    
    res.json({
      success: true,
      message: '所有测试数据已成功清空',
      data: {
        clearedTables,
        totalRecords: clearedTables.reduce((sum, table) => sum + table.count, 0)
      }
    });
    
  } catch (error) {
    console.error('❌ 清空测试数据错误:', error);
    res.status(500).json({
      success: false,
      message: '清空测试数据失败',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('❌ 关闭连接失败:', e);
      }
    }
  }
}
