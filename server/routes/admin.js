const express = require('express');
const { authenticateAdmin } = require('../middleware/auth');
const { Orders, Links, Sales } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// 所有管理员路由都需要认证
router.use(authenticateAdmin);

// 获取订单统计信息
router.get('/stats', async (req, res) => {
  try {
    const { timeRange, customRange } = req.query;
    
    // 添加调试日志
    console.log('📊 统计API调用参数:', { timeRange, customRange });
    
    // 构建时间范围查询条件
    let timeWhere = {};
    
    if (timeRange === 'custom' && customRange && customRange.length === 2) {
      // 自定义时间范围
      const startDate = new Date(customRange[0]);
      const endDate = new Date(customRange[1]);
      endDate.setHours(23, 59, 59, 999); // 设置为当天结束时间
      timeWhere = {
        submit_time: {
          [Op.between]: [startDate, endDate]
        }
      };
    } else if (timeRange === 'today') {
      // 今天
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      timeWhere = {
        submit_time: {
          [Op.between]: [startOfDay, endOfDay]
        }
      };
    } else if (timeRange === 'week') {
      // 本周
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // 设置为本周第一天（周日）
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      timeWhere = {
        submit_time: {
          [Op.between]: [startOfWeek, endOfWeek]
        }
      };
    } else if (timeRange === 'month') {
      // 本月
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      timeWhere = {
        submit_time: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      };
    } else if (timeRange === 'year') {
      // 本年
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      timeWhere = {
        submit_time: {
          [Op.between]: [startOfYear, endOfYear]
        }
      };
    }
    // 如果没有指定时间范围，则查询所有数据

    const totalOrders = await Orders.count({ where: timeWhere });
    const pendingPaymentOrders = await Orders.count({ 
      where: { 
        ...timeWhere,
        status: 'pending_payment_confirmation' 
      } 
    });
    const pendingConfigOrders = await Orders.count({ 
      where: { 
        ...timeWhere,
        status: 'pending_configuration_confirmation' 
      } 
    });
    const confirmedPaymentOrders = await Orders.count({ 
      where: { 
        ...timeWhere,
        status: 'confirmed_payment' 
      } 
    });
    const confirmedConfigOrders = await Orders.count({ 
      where: { 
        ...timeWhere,
        status: 'confirmed_configuration' 
      } 
    });
    const totalAmount = await Orders.sum('amount', { 
      where: { 
        ...timeWhere,
        status: 'confirmed_configuration' 
      } 
    });
    
    // 计算佣金（根据佣金档次逻辑）
    let totalCommission = 0;
    if (totalAmount > 0) {
      // 获取所有已确认配置的订单
      const confirmedOrders = await Orders.findAll({
        where: {
          ...timeWhere,
          status: 'confirmed_configuration'
        },
        include: [{
          model: Links,
          as: 'links',
          include: [{
            model: Sales,
            as: 'sales'
          }]
        }]
      });
      
      // 按销售人员分组计算佣金
      const salesCommissions = {};
      confirmedOrders.forEach(order => {
        const salesWechat = order.links?.sales?.wechat_name || '未知';
        if (!salesCommissions[salesWechat]) {
          salesCommissions[salesWechat] = {
            totalAmount: 0,
            commissionRate: 0.3 // 默认30%
          };
        }
        salesCommissions[salesWechat].totalAmount += order.amount;
      });
      
      // 计算每个销售人员的佣金（根据档次）
      Object.keys(salesCommissions).forEach(salesWechat => {
        const { totalAmount: salesTotal } = salesCommissions[salesWechat];
        let commissionRate = 0.3; // 默认30%
        
        // 根据累计提成达标金额确定佣金比例
        if (salesTotal >= 200000) {
          commissionRate = 0.40; // 40%
        } else if (salesTotal >= 150000) {
          commissionRate = 0.38; // 38%
        } else if (salesTotal >= 100000) {
          commissionRate = 0.35; // 35%
        } else if (salesTotal >= 50000) {
          commissionRate = 0.32; // 32%
        } else {
          commissionRate = 0.30; // 30%
        }
        
        salesCommissions[salesWechat].commissionRate = commissionRate;
        totalCommission += salesTotal * commissionRate;
      });
    }
    
    // 按订单类型统计（在指定时间范围内）
    const oneMonthOrders = await Orders.count({ 
      where: { 
        ...timeWhere,
        duration: '1个月' 
      } 
    });
    const threeMonthOrders = await Orders.count({ 
      where: { 
        ...timeWhere,
        duration: '3个月' 
      } 
    });
    const sixMonthOrders = await Orders.count({ 
      where: { 
        ...timeWhere,
        duration: '6个月' 
      } 
    });
    const lifetimeOrders = await Orders.count({ 
      where: { 
        ...timeWhere,
        duration: '永久' 
      } 
    });
    
    // 计算百分比
    const oneMonthPercentage = totalOrders > 0 ? (oneMonthOrders / totalOrders) * 100 : 0;
    const threeMonthPercentage = totalOrders > 0 ? (threeMonthOrders / totalOrders) * 100 : 0;
    const sixMonthPercentage = totalOrders > 0 ? (sixMonthOrders / totalOrders) * 100 : 0;
    const lifetimePercentage = totalOrders > 0 ? (lifetimeOrders / totalOrders) * 100 : 0;

    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        pending_payment_orders: pendingPaymentOrders,
        pending_config_orders: pendingConfigOrders,
        confirmed_payment_orders: confirmedPaymentOrders,
        confirmed_config_orders: confirmedConfigOrders,
        total_amount: totalAmount || 0,
        total_commission: totalCommission,
        one_month_orders: oneMonthOrders,
        three_month_orders: threeMonthOrders,
        six_month_orders: sixMonthOrders,
        lifetime_orders: lifetimeOrders,
        one_month_percentage: oneMonthPercentage,
        three_month_percentage: threeMonthPercentage,
        six_month_percentage: sixMonthPercentage,
        lifetime_percentage: lifetimePercentage
      }
    });

  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
});

// 获取订单列表（带分页和筛选）
router.get('/orders', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      link_code,
      payment_method,
      status,
      start_date,
      end_date,
      payment_start_date,
      payment_end_date,
      config_start_date,
      config_end_date
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 构建查询条件
    if (link_code) {
      where['$links.link_code$'] = link_code;
    }
    if (payment_method) {
      where.payment_method = payment_method;
    }
    if (status) {
      where.status = status;
    }
    if (start_date && end_date) {
      where.submit_time = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }
    if (payment_start_date && payment_end_date) {
      where.payment_time = {
        [Op.between]: [new Date(payment_start_date), new Date(payment_end_date)]
      };
    }
    if (config_start_date && config_end_date) {
      where.effective_time = {
        [Op.between]: [new Date(config_start_date), new Date(config_end_date)]
      };
    }

    const { count, rows } = await Orders.findAndCountAll({
      where,
      include: [{
        model: Links,
        as: 'links',
        include: [{
          model: Sales,
          as: 'sales'
        }]
      }],
      order: [['submit_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
});

// 导出订单数据
router.get('/export', async (req, res) => {
  try {
    const {
      link_code,
      payment_method,
      status,
      start_date,
      end_date,
      payment_start_date,
      payment_end_date,
      config_start_date,
      config_end_date
    } = req.query;

    const where = {};

    // 构建查询条件
    if (link_code) {
      where['$links.link_code$'] = link_code;
    }
    if (payment_method) {
      where.payment_method = payment_method;
    }
    if (status) {
      where.status = status;
    }
    if (start_date && end_date) {
      where.submit_time = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }
    if (payment_start_date && payment_end_date) {
      where.payment_time = {
        [Op.between]: [new Date(payment_start_date), new Date(payment_end_date)]
      };
    }
    if (config_start_date && config_end_date) {
      where.effective_time = {
        [Op.between]: [new Date(config_start_date), new Date(config_end_date)]
      };
    }

    const orders = await Orders.findAll({
      where,
      include: [{
        model: Links,
        as: 'links',
        include: [{
          model: Sales,
          as: 'sales'
        }]
      }],
      order: [['submit_time', 'DESC']]
    });

    // 转换为CSV格式
    const csvData = orders.map(order => ({
      '订单ID': order.id,
      '链接代码': order.links.link_code,
      '销售微信名': order.links.sales.wechat_name,
      'TradingView用户名': order.tradingview_username,
      '购买时长': order.duration,
      '金额': order.amount,
      '付款方式': order.payment_method,
      '付款时间': order.payment_time,
      '提交时间': order.submit_time,
      '状态': order.status
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    
    // 生成CSV内容
    const csvHeaders = Object.keys(csvData[0] || {}).join(',');
    const csvRows = csvData.map(row => Object.values(row).join(','));
    const csvContent = [csvHeaders, ...csvRows].join('\n');

    res.send(csvContent);

  } catch (error) {
    console.error('导出订单数据错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败'
    });
  }
});

// 获取销售链接列表（带搜索功能）
router.get('/links', async (req, res) => {
  try {
    const {
      sales_wechat,
      link_code,
      payment_method,
      commission_rate,
      pending_commission,
      paid_commission_data,
      start_date,
      end_date,
      order_start_date,
      order_end_date
    } = req.query;

    const where = {};
    const salesWhere = {};

    // 构建查询条件
    if (sales_wechat) {
      salesWhere.wechat_name = { [Op.like]: `%${sales_wechat}%` };
    }
    if (link_code) {
      where.link_code = { [Op.like]: `%${link_code}%` };
    }
    if (payment_method) {
      salesWhere.payment_method = payment_method;
    }
    if (commission_rate) {
      // 这里需要根据佣金比率筛选，暂时先跳过，等数据库字段添加后再实现
      console.log('佣金比率筛选:', commission_rate);
    }
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    // 订单时间筛选条件
    let orderWhere = {};
    if (order_start_date && order_end_date) {
      orderWhere = {
        status: 'confirmed_configuration',
        effective_time: {
          [Op.between]: [new Date(order_start_date), new Date(order_end_date)]
        }
      };
    }

    let links = await Links.findAll({
      where,
      include: [{
        model: Sales,
        as: 'sales',
        where: Object.keys(salesWhere).length > 0 ? salesWhere : undefined
      }, {
        model: Orders,
        as: 'orders',
        where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined
      }],
      order: [['created_at', 'DESC']]
    });

    // 处理待返佣筛选
    if (pending_commission) {
      // 解析已返佣金额数据
      let paidCommissionData = {};
      if (paid_commission_data) {
        try {
          paidCommissionData = JSON.parse(paid_commission_data);
        } catch (error) {
          console.error('解析已返佣金额数据失败:', error);
        }
      }
      
      links = links.filter(link => {
        const validOrders = link.orders?.filter(order => order.status === 'confirmed_configuration') || [];
        const totalAmount = validOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
        
        // 计算自动佣金比率
        let commissionRate = 0.3; // 默认30%
        if (totalAmount >= 200000) {
          commissionRate = 0.40; // 40%
        } else if (totalAmount >= 150000) {
          commissionRate = 0.38; // 38%
        } else if (totalAmount >= 100000) {
          commissionRate = 0.35; // 35%
        } else if (totalAmount >= 50000) {
          commissionRate = 0.32; // 32%
        } else {
          commissionRate = 0.30; // 30%
        }
        
        const commissionAmount = totalAmount * commissionRate;
        const salesId = link.sales?.id;
        const paidAmount = paidCommissionData[salesId] || 0;
        
        if (pending_commission === 'yes') {
          // 待返佣=是：应返佣金额与已返佣金额不相等
          return commissionAmount > 0 && Math.abs(commissionAmount - paidAmount) > 0.01; // 允许0.01的误差
        } else if (pending_commission === 'no') {
          // 待返佣=否：应返佣金额与已返佣金额相等
          return commissionAmount === 0 || Math.abs(commissionAmount - paidAmount) <= 0.01; // 允许0.01的误差
        }
        
        return true;
      });
    }

    res.json({
      success: true,
      data: links
    });

  } catch (error) {
    console.error('获取销售链接列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取销售链接列表失败'
    });
  }
});

// 获取佣金比率选项
router.get('/commission-rates', async (req, res) => {
  try {
    // 获取所有销售的佣金比率（去重）
    const sales = await Sales.findAll({
      attributes: ['commission_rate'],
      where: {
        commission_rate: {
          [Op.not]: null
        }
      }
    });
    
    // 去重并排序
    const rates = [...new Set(sales.map(s => s.commission_rate))].sort((a, b) => a - b);
    
    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    console.error('获取佣金比率选项错误:', error);
    res.status(500).json({
      success: false,
      message: '获取佣金比率选项失败'
    });
  }
});

// 获取客户列表（带搜索功能）
router.get('/customers', async (req, res) => {
  try {
    const {
      customer_wechat,
      sales_wechat,
      remind_status,
      start_date,
      end_date
    } = req.query;

    const where = {};
    const salesWhere = {};

    // 构建查询条件
    if (customer_wechat) {
      where.tradingview_username = { [Op.like]: `%${customer_wechat}%` };
    }
    if (sales_wechat) {
      salesWhere.wechat_name = { [Op.like]: `%${sales_wechat}%` };
    }
    if (remind_status) {
      where.remind_status = remind_status;
    }
    if (start_date && end_date) {
      where.expiry_time = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    // 获取所有订单，按客户分组
    const orders = await Orders.findAll({
      where,
      include: [{
        model: Links,
        as: 'links',
        include: [{
          model: Sales,
          as: 'sales',
          where: Object.keys(salesWhere).length > 0 ? salesWhere : undefined
        }]
      }],
      order: [['submit_time', 'DESC']]
    });

    // 按客户分组统计
    const customerMap = new Map();
    
    orders.forEach(order => {
      const customerKey = order.tradingview_username;
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: customerKey,
          customer_wechat: order.tradingview_username, // 这里假设TradingView用户名就是客户微信
          tradingview_username: order.tradingview_username,
          sales_wechat: order.links?.sales?.wechat_name || '未知',
          total_orders: 0,
          total_amount: 0,
          commission_amount: 0,
          last_order_date: null,
          expiry_date: null,
          remind_status: 'pending' // 默认状态
        });
      }
      
      const customer = customerMap.get(customerKey);
      customer.total_orders += 1;
      customer.total_amount += order.amount || 0;
      
      // 计算佣金（根据佣金档次逻辑）
      const salesWechat = order.links?.sales?.wechat_name || '未知';
      let commissionRate = 0.3; // 默认30%
      
      // 根据累计提成达标金额确定佣金比例
      if (customer.total_amount >= 200000) {
        commissionRate = 0.40; // 40%
      } else if (customer.total_amount >= 150000) {
        commissionRate = 0.38; // 38%
      } else if (customer.total_amount >= 100000) {
        commissionRate = 0.35; // 35%
      } else if (customer.total_amount >= 50000) {
        commissionRate = 0.32; // 32%
      } else {
        commissionRate = 0.30; // 30%
      }
      
      customer.commission_amount += (order.amount || 0) * commissionRate;
      
      if (!customer.last_order_date || new Date(order.submit_time) > new Date(customer.last_order_date)) {
        customer.last_order_date = order.submit_time;
      }
      
      if (!customer.expiry_date || new Date(order.expiry_time) > new Date(customer.expiry_date)) {
        customer.expiry_date = order.expiry_time;
      }
    });

    const customers = Array.from(customerMap.values());

    res.json({
      success: true,
      data: customers
    });

  } catch (error) {
    console.error('获取客户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取客户列表失败'
    });
  }
});

// 更新销售佣金比率
router.put('/sales/:salesId/commission-rate', async (req, res) => {
  try {
    const { salesId } = req.params;
    const { commission_rate } = req.body;

    if (!commission_rate || commission_rate < 0 || commission_rate > 100) {
      return res.status(400).json({
        success: false,
        message: '佣金比率必须在0-100之间'
      });
    }

    const sales = await Sales.findByPk(salesId);
    if (!sales) {
      return res.status(404).json({
        success: false,
        message: '销售记录不存在'
      });
    }

    await sales.update({ commission_rate });

    res.json({
      success: true,
      message: '佣金比率更新成功',
      data: { salesId: sales.id, commission_rate: sales.commission_rate }
    });

  } catch (error) {
    console.error('更新佣金比率错误:', error);
    res.status(500).json({
      success: false,
      message: '更新佣金比率失败'
    });
  }
});

// 更新订单状态
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending_payment_confirmation', 'confirmed_payment', 'pending_configuration_confirmation', 'confirmed_configuration', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    const order = await Orders.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    await order.update({ status });

    res.json({
      success: true,
      message: '订单状态更新成功',
      data: { orderId: order.id, status: order.status }
    });

  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新订单状态失败'
    });
  }
});

module.exports = router; 