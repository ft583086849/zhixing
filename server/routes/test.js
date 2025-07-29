const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 内存存储，用于保存创建的销售数据
let salesData = [
  {
    id: 1,
    link_code: 'abc12345',
    created_at: '2025-01-27T09:00:00.000Z',
    commission_rate: 30,
    sales: {
      id: 1,
      wechat_name: '测试销售',
      payment_method: 'alipay',
      payment_address: 'test@test.com',
      alipay_surname: '张',
      chain_name: null
    }
  },
  {
    id: 8,
    link_code: 'zhang88888',
    created_at: '2025-01-27T05:30:00.000Z',
    commission_rate: 30,
    sales: {
      id: 8,
      wechat_name: '张子俊',
      payment_method: 'alipay',
      payment_address: 'zhangzijun@qq.com',
      alipay_surname: '张',
      chain_name: null
    }
  },
  {
    id: 2,
    link_code: 'def67890',
    created_at: '2025-01-27T08:30:00.000Z',
    commission_rate: 30,
    sales: {
      id: 2,
      wechat_name: '销售张三',
      payment_method: 'crypto',
      payment_address: 'TRC20地址示例',
      alipay_surname: null,
      chain_name: 'TRC10/TRC20'
    }
  },
  {
    id: 3,
    link_code: 'ghi11111',
    created_at: '2025-01-27T08:00:00.000Z',
    commission_rate: 30,
    sales: {
      id: 3,
      wechat_name: '销售李四',
      payment_method: 'alipay',
      payment_address: 'wang@alipay.com',
      alipay_surname: '王',
      chain_name: null
    }
  },
  {
    id: 4,
    link_code: 'jkl22222',
    created_at: '2025-01-27T07:30:00.000Z',
    commission_rate: 30,
    sales: {
      id: 4,
      wechat_name: '销售王五',
      payment_method: 'crypto',
      payment_address: 'crypto地址示例',
      alipay_surname: null,
      chain_name: 'TRC10/TRC20'
    }
  },
  {
    id: 5,
    link_code: 'mno33333',
    created_at: '2025-01-27T07:00:00.000Z',
    commission_rate: 30,
    sales: {
      id: 5,
      wechat_name: '销售赵六',
      payment_method: 'alipay',
      payment_address: 'zhao@alipay.com',
      alipay_surname: '赵',
      chain_name: null
    }
  },
  {
    id: 6,
    link_code: 'pqr44444',
    created_at: '2025-01-27T06:30:00.000Z',
    commission_rate: 30,
    sales: {
      id: 6,
      wechat_name: '销售钱七',
      payment_method: 'crypto',
      payment_address: 'qian@crypto.com',
      alipay_surname: null,
      chain_name: 'TRC10/TRC20'
    }
  },
  {
    id: 7,
    link_code: 'stu55555',
    created_at: '2025-01-27T06:00:00.000Z',
    commission_rate: 30,
    sales: {
      id: 7,
      wechat_name: '销售孙八',
      payment_method: 'alipay',
      payment_address: 'sun@alipay.com',
      alipay_surname: '孙',
      chain_name: null
    }
  }
];

let nextId = 8;

// 模拟创建销售收款信息
router.post('/sales/create', (req, res) => {
  try {
    const { wechat_name, payment_method, payment_address, alipay_surname, chain_name } = req.body;
    const linkCode = uuidv4().substring(0, 8);
    const fullLink = `http://localhost:3000/purchase/${linkCode}`;
    const now = new Date().toISOString();
    
    // 创建新的销售数据
    const newSalesData = {
      id: nextId,
      link_code: linkCode,
      created_at: now,
      commission_rate: 30,
      sales: {
        id: nextId,
        wechat_name,
        payment_method,
        payment_address,
        alipay_surname,
        chain_name
      }
    };
    
    // 添加到内存存储
    salesData.push(newSalesData);
    nextId++;
    
    res.json({
      success: true,
      message: '销售收款信息创建成功',
      data: {
        sales_id: newSalesData.id,
        link_code: linkCode,
        full_link: fullLink,
        created_at: now
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建失败',
      error: error.message
    });
  }
});

// 模拟获取销售信息
router.get('/sales/link/:linkCode', (req, res) => {
  try {
    const { linkCode } = req.params;
    
    // 根据链接代码查找对应的销售信息
    const salesInfo = salesData.find(sale => sale.link_code === linkCode);
    
    if (!salesInfo) {
      return res.status(404).json({
        success: false,
        message: '销售链接不存在',
        error: 'Link not found'
      });
    }
    
    res.json({
      success: true,
      message: '获取销售信息成功',
      data: {
        sales: salesInfo.sales,
        link: {
          id: salesInfo.id,
          link_code: salesInfo.link_code,
          created_at: salesInfo.created_at
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取失败',
      error: error.message
    });
  }
});

// 模拟创建订单
router.post('/orders/create', (req, res) => {
  try {
    const {
      link_code,
      tradingview_username,
      customer_wechat,
      duration,
      payment_method,
      payment_time,
      purchase_type = 'immediate',
      effective_time,
      alipay_amount,
      screenshot
    } = req.body;

    // 计算到期时间
    const calculateExpiryTime = (duration, effectiveTime) => {
      const baseTime = new Date(effectiveTime || Date.now());
      switch (duration) {
        case '7days':
          return new Date(baseTime.getTime() + 8 * 24 * 60 * 60 * 1000);
        case '1month':
          return new Date(baseTime.getTime() + 32 * 24 * 60 * 60 * 1000);
        case '3months':
          return new Date(baseTime.getTime() + 92 * 24 * 60 * 60 * 1000);
        case '6months':
          return new Date(baseTime.getTime() + 183 * 24 * 60 * 60 * 1000);
        case '1year':
          return new Date(baseTime.getTime() + 366 * 24 * 60 * 60 * 1000);
        case 'lifetime':
          return new Date(baseTime.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);
        default:
          return new Date(baseTime.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    };

    // 模拟订单创建成功
    const mockOrder = {
      order_id: Math.floor(Math.random() * 10000) + 1,
      amount: duration === '7days' ? 0 : (duration === '1month' ? 188 : duration === '3months' ? 488 : duration === '6months' ? 688 : duration === '1year' ? 1588 : 1888),
      status: 'pending',
      tradingview_username,
      customer_wechat,
      duration,
      payment_method,
      payment_time,
      purchase_type,
      effective_time: effective_time || new Date().toISOString(),
      expiry_time: calculateExpiryTime(duration, effective_time || Date.now()).toISOString(),
      alipay_amount: alipay_amount || null,
      screenshot_path: screenshot ? `/uploads/screenshots/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg` : null
    };

    res.json({
      success: true,
      message: '订单创建成功',
      data: mockOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '订单创建失败',
      error: error.message
    });
  }
});

// 模拟管理员登录
router.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 支持两种登录方式
    if ((username === 'admin' && password === 'admin123') || 
        (username === '知行' && password === 'Zhixing Universal Trading Signal')) {
      res.json({
        success: true,
        message: '登录成功',
        data: {
          token: 'mock_jwt_token_' + Date.now(),
          admin: {
            id: 1,
            username: username
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

// 模拟验证token
router.get('/auth/verify', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token验证成功',
      data: {
        admin: {
          id: 1,
          username: '知行'
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token验证失败'
    });
  }
});

// 模拟获取统计信息
router.get('/admin/stats', (req, res) => {
  try {
    const { timeRange, customRange } = req.query;
    
    // 根据时间范围调整数据
    let multiplier = 1;
    if (timeRange === 'today') {
      multiplier = 0.1; // 今日数据较少
    } else if (timeRange === 'week') {
      multiplier = 0.3; // 一周数据
    } else if (timeRange === 'month') {
      multiplier = 0.7; // 一月数据
    } else if (timeRange === 'custom' && customRange) {
      multiplier = 0.5; // 自定义范围数据
    }
    
    res.json({
      success: true,
      message: '获取统计信息成功',
      data: {
        total_orders: Math.floor(156 * multiplier),
        pending_payment_orders: Math.floor(23 * multiplier),
        pending_config_orders: Math.floor(15 * multiplier),
        confirmed_payment_orders: Math.floor(89 * multiplier),
        confirmed_config_orders: Math.floor(67 * multiplier),
        total_amount: Math.floor(45678 * multiplier),
        total_commission: Math.floor(12345 * multiplier),
        // 订单分类统计
        one_month_orders: Math.floor(45 * multiplier),
        one_month_percentage: 28.8,
        three_month_orders: Math.floor(38 * multiplier),
        three_month_percentage: 24.4,
        six_month_orders: Math.floor(29 * multiplier),
        six_month_percentage: 18.6,
        lifetime_orders: Math.floor(44 * multiplier),
        lifetime_percentage: 28.2
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

// 模拟获取订单列表
router.get('/admin/orders', (req, res) => {
  try {
    const { 
      link_code, 
      sales_wechat, 
      tradingview_username, 
      payment_method, 
      purchase_type, 
      status,
      start_date,
      end_date,
      payment_start_date,
      payment_end_date,
      expiry_start_date,
      expiry_end_date
    } = req.query;

    // 模拟订单数据 - 支持状态更新
    let mockOrders = [
      {
        id: 1,
        tradingview_username: 'testuser1',
        duration: '1month',
        amount: 188.00,
        payment_method: 'alipay',
        purchase_type: 'immediate',
        payment_time: '2025-01-27T10:00:00.000Z',
        effective_time: '2025-01-27T10:00:00.000Z',
        expiry_time: '2025-02-28T10:00:00.000Z',
        submit_time: '2025-01-27T09:55:00.000Z',
        status: globalOrderStatus[1] || 'pending_payment_confirmation',
        screenshot_path: null,
        links: {
          link_code: 'abc12345',
          sales: {
            wechat_name: '测试销售'
          }
        }
      },
      {
        id: 2,
        tradingview_username: 'testuser2',
        duration: '3months',
        amount: 488.00,
        payment_method: 'crypto',
        purchase_type: 'advance',
        payment_time: '2025-01-26T15:30:00.000Z',
        effective_time: '2025-02-01T00:00:00.000Z',
        expiry_time: '2025-05-02T00:00:00.000Z',
        submit_time: '2025-01-26T15:25:00.000Z',
        status: globalOrderStatus[2] || 'pending_configuration_confirmation',
        screenshot_path: null,
        links: {
          link_code: 'def67890',
          sales: {
            wechat_name: '销售张三'
          }
        }
      },
      {
        id: 3,
        tradingview_username: 'testuser3',
        duration: '6months',
        amount: 688.00,
        payment_method: 'alipay',
        purchase_type: 'immediate',
        payment_time: '2025-01-25T14:20:00.000Z',
        effective_time: '2025-01-25T14:20:00.000Z',
        expiry_time: '2025-07-26T14:20:00.000Z',
        submit_time: '2025-01-25T14:15:00.000Z',
        status: globalOrderStatus[3] || 'confirmed_configuration',
        screenshot_path: null,
        links: {
          link_code: 'ghi11111',
          sales: {
            wechat_name: '销售李四'
          }
        }
      },
      {
        id: 4,
        tradingview_username: 'testuser4',
        duration: 'lifetime',
        amount: 1888.00,
        payment_method: 'crypto',
        purchase_type: 'immediate',
        payment_time: '2025-01-24T11:45:00.000Z',
        effective_time: '2025-01-24T11:45:00.000Z',
        expiry_time: '2125-01-24T11:45:00.000Z',
        submit_time: '2025-01-24T11:40:00.000Z',
        status: globalOrderStatus[4] || 'confirmed_configuration',
        screenshot_path: null,
        links: {
          link_code: 'jkl22222',
          sales: {
            wechat_name: '销售王五'
          }
        }
      },
      {
        id: 5,
        tradingview_username: 'testuser5',
        duration: '1year',
        amount: 1588.00,
        payment_method: 'alipay',
        purchase_type: 'advance',
        payment_time: '2025-01-23T09:30:00.000Z',
        effective_time: '2025-02-01T00:00:00.000Z',
        expiry_time: '2026-02-02T00:00:00.000Z',
        submit_time: '2025-01-23T09:25:00.000Z',
        status: globalOrderStatus[5] || 'confirmed_configuration',
        screenshot_path: null,
        links: {
          link_code: 'mno33333',
          sales: {
            wechat_name: '销售赵六'
          }
        }
      },
      {
        id: 6,
        tradingview_username: 'testuser6',
        duration: '3months',
        amount: 488.00,
        payment_method: 'crypto',
        purchase_type: 'immediate',
        payment_time: '2025-01-22T16:45:00.000Z',
        effective_time: '2025-01-22T16:45:00.000Z',
        expiry_time: '2025-04-23T16:45:00.000Z',
        submit_time: '2025-01-22T16:40:00.000Z',
        status: globalOrderStatus[6] || 'pending_payment_confirmation',
        screenshot_path: null,
        links: {
          link_code: 'pqr44444',
          sales: {
            wechat_name: '销售钱七'
          }
        }
      },
      {
        id: 7,
        tradingview_username: 'testuser7',
        duration: '6months',
        amount: 688.00,
        payment_method: 'alipay',
        purchase_type: 'advance',
        payment_time: '2025-01-21T14:20:00.000Z',
        effective_time: '2025-02-01T00:00:00.000Z',
        expiry_time: '2025-08-02T00:00:00.000Z',
        submit_time: '2025-01-21T14:15:00.000Z',
        status: globalOrderStatus[7] || 'pending_configuration_confirmation',
        screenshot_path: null,
        links: {
          link_code: 'stu55555',
          sales: {
            wechat_name: '销售孙八'
          }
        }
      }
    ];

    // 模拟搜索过滤
    if (link_code) {
      mockOrders = mockOrders.filter(order => 
        order.links.link_code.toLowerCase().includes(link_code.toLowerCase())
      );
    }
    
    if (sales_wechat) {
      mockOrders = mockOrders.filter(order => 
        order.links.sales.wechat_name.toLowerCase().includes(sales_wechat.toLowerCase())
      );
    }
    
    if (tradingview_username) {
      mockOrders = mockOrders.filter(order => 
        order.tradingview_username.toLowerCase().includes(tradingview_username.toLowerCase())
      );
    }
    
    if (payment_method) {
      mockOrders = mockOrders.filter(order => order.payment_method === payment_method);
    }
    
    if (purchase_type) {
      mockOrders = mockOrders.filter(order => order.purchase_type === purchase_type);
    }
    
    if (status) {
      mockOrders = mockOrders.filter(order => order.status === status);
    }
    
    // 日期范围过滤
    if (payment_start_date && payment_end_date) {
      const startDate = new Date(payment_start_date);
      const endDate = new Date(payment_end_date);
      mockOrders = mockOrders.filter(order => {
        const paymentDate = new Date(order.payment_time);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }
    
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      mockOrders = mockOrders.filter(order => {
        const submitDate = new Date(order.submit_time);
        return submitDate >= startDate && submitDate <= endDate;
      });
    }
    
    if (expiry_start_date && expiry_end_date) {
      const startDate = new Date(expiry_start_date);
      const endDate = new Date(expiry_end_date);
      mockOrders = mockOrders.filter(order => {
        const expiryDate = new Date(order.expiry_time);
        return expiryDate >= startDate && expiryDate <= endDate;
      });
    }

    res.json({
      success: true,
      message: '获取订单列表成功',
      data: {
        orders: mockOrders,
        pagination: {
          total: mockOrders.length,
          page: 1,
          limit: 20,
          total_pages: 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message
    });
  }
});

// 模拟获取销售链接列表
router.get('/admin/links', (req, res) => {
  try {
    const { sales_wechat, link_code, payment_method, commission_rate, pending_commission, paid_commission_data, start_date, end_date, order_start_date, order_end_date } = req.query;
    
    let filteredSalesData = [...salesData];
    
    // 模拟搜索过滤
    if (sales_wechat) {
      filteredSalesData = filteredSalesData.filter(sale => 
        sale.sales.wechat_name.toLowerCase().includes(sales_wechat.toLowerCase())
      );
    }
    
    if (link_code) {
      filteredSalesData = filteredSalesData.filter(sale => 
        sale.link_code.toLowerCase().includes(link_code.toLowerCase())
      );
    }
    
    if (payment_method) {
      filteredSalesData = filteredSalesData.filter(sale => 
        sale.sales.payment_method === payment_method
      );
    }
    
    if (commission_rate) {
      filteredSalesData = filteredSalesData.filter(sale => 
        sale.commission_rate === parseInt(commission_rate)
      );
    }
    
    // 日期范围过滤
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      filteredSalesData = filteredSalesData.filter(sale => {
        const createdDate = new Date(sale.created_at);
        return createdDate >= startDate && createdDate <= endDate;
      });
    }
    
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
      
      filteredSalesData = filteredSalesData.filter(sale => {
        // 模拟订单数据
        const mockOrders = [
          { status: 'confirmed_configuration', amount: 188 },
          { status: 'confirmed_configuration', amount: 388 },
          { status: 'pending_payment_confirmation', amount: 588 }
        ];
        
        const validOrders = mockOrders.filter(order => order.status === 'confirmed_configuration');
        const totalAmount = validOrders.reduce((sum, order) => sum + order.amount, 0);
        
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
        const salesId = sale.sales.id;
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
    
    // 为每个销售添加订单数据
    const salesWithOrders = filteredSalesData.map(sale => ({
      ...sale,
      orders: [
        { status: 'confirmed_configuration', amount: 188 },
        { status: 'confirmed_configuration', amount: 388 },
        { status: 'pending_payment_confirmation', amount: 588 }
      ]
    }));
    
    res.json({
      success: true,
      message: '获取销售链接列表成功',
      data: salesWithOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取销售链接列表失败',
      error: error.message
    });
  }
});

// 模拟获取收款配置
router.get('/admin/payment-config', (req, res) => {
  try {
    res.json({
      success: true,
      message: '获取收款配置成功',
      data: {
        alipay_account: '752304285@qq.com',
        alipay_surname: '梁',
        alipay_qr_code: null,
        crypto_chain_name: 'TRC10/TRC20',
        crypto_address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
        crypto_qr_code: null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取收款配置失败',
      error: error.message
    });
  }
});

// 模拟更新销售佣金比率
router.put('/admin/sales/:salesId/commission-rate', (req, res) => {
  try {
    const { salesId } = req.params;
    const { commission_rate } = req.body;

    if (!commission_rate || commission_rate < 0 || commission_rate > 100) {
      return res.status(400).json({
        success: false,
        message: '佣金比率必须在0-100之间'
      });
    }

    // 查找并更新销售记录
    const saleIndex = salesData.findIndex(sale => sale.sales.id === parseInt(salesId));
    if (saleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '销售记录不存在'
      });
    }

    // 更新佣金比率
    salesData[saleIndex].commission_rate = commission_rate;
    salesData[saleIndex].sales.commission_rate = commission_rate;

    res.json({
      success: true,
      message: '佣金比率更新成功',
      data: { salesId: parseInt(salesId), commission_rate: commission_rate }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新佣金比率失败',
      error: error.message
    });
  }
});

// 模拟获取佣金比率选项
router.get('/admin/commission-rates', (req, res) => {
  try {
    // 获取所有销售的佣金比率（去重）
    const rates = [...new Set(salesData.map(sale => sale.commission_rate))].sort((a, b) => a - b);
    
    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取佣金比率选项失败',
      error: error.message
    });
  }
});

// 模拟保存收款配置
router.post('/admin/payment-config', (req, res) => {
  try {
    const { alipay_account, alipay_surname, crypto_chain_name, crypto_address, alipay_qr_code, crypto_qr_code } = req.body;
    
    console.log('保存收款配置:', { alipay_account, alipay_surname, crypto_chain_name, crypto_address });
    
    // 模拟保存配置
    res.json({
      success: true,
      message: '保存收款配置成功',
      data: {
        alipay_account,
        alipay_surname,
        crypto_chain_name,
        crypto_address,
        alipay_qr_code,
        crypto_qr_code
      }
    });
  } catch (error) {
    console.error('保存收款配置失败:', error);
    res.status(500).json({
      success: false,
      message: '保存收款配置失败',
      error: error.message
    });
  }
});

// 模拟永久授权限量API
router.get('/lifetime-limit/info', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        total_limit: 100,
        sold_count: 45,
        remaining_count: 55,
        is_available: true,
        is_active: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取限量信息失败',
      error: error.message
    });
  }
});

// 模拟更新永久授权限量配置
router.put('/lifetime-limit/config', (req, res) => {
  try {
    const { total_limit, is_active } = req.body;
    
    res.json({
      success: true,
      message: '永久授权限量配置更新成功',
      data: {
        total_limit: total_limit || 100,
        sold_count: 45,
        remaining_count: (total_limit || 100) - 45,
        is_active: is_active !== undefined ? is_active : true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新配置失败',
      error: error.message
    });
  }
});

// 全局订单状态存储
let globalOrderStatus = {
  1: 'pending_payment_confirmation',
  2: 'pending_configuration_confirmation',
  3: 'confirmed_configuration',
  4: 'confirmed_configuration',
  5: 'confirmed_configuration',
  6: 'pending_payment_confirmation',
  7: 'pending_configuration_confirmation'
};

// 模拟订单状态更新API
router.put('/admin/orders/:orderId/status', (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    // 更新全局状态
    globalOrderStatus[orderId] = status;
    console.log(`订单 ${orderId} 状态更新为: ${status}`);
    
    res.json({
      success: true,
      message: '订单状态更新成功',
      data: {
        order_id: orderId,
        status: status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '订单状态更新失败',
      error: error.message
    });
  }
});

// 模拟客户管理API
router.get('/admin/customers', (req, res) => {
  try {
    const { tradingview_username, sales_wechat, remind_status, start_date, end_date, last_order_start_date, last_order_end_date } = req.query;
    
    // 模拟客户数据 - 基于订单数据生成，显示最新到期时间
    const mockOrders = [
      {
        id: 1,
        tradingview_username: 'testuser1',
        customer_wechat: 'customer001',
        status: 'confirmed_configuration',
        expiry_time: '2025-02-28T10:00:00.000Z',
        amount: 188.00,
        sales: { wechat_name: '测试销售' }
      },
      {
        id: 2,
        tradingview_username: 'testuser1',
        customer_wechat: 'customer001',
        status: 'confirmed_configuration',
        expiry_time: '2025-05-02T00:00:00.000Z',
        amount: 488.00,
        sales: { wechat_name: '测试销售' }
      },
      {
        id: 3,
        tradingview_username: 'testuser1',
        customer_wechat: 'customer001',
        status: 'confirmed_configuration',
        expiry_time: '2025-07-26T14:20:00.000Z',
        amount: 688.00,
        sales: { wechat_name: '测试销售' }
      },
      {
        id: 4,
        tradingview_username: 'testuser2',
        customer_wechat: 'customer002',
        status: 'confirmed_configuration',
        expiry_time: '2025-04-26T23:30:00.000Z',
        amount: 488.00,
        sales: { wechat_name: '销售张三' }
      },
      {
        id: 5,
        tradingview_username: 'testuser3',
        customer_wechat: 'customer003',
        status: 'confirmed_configuration',
        expiry_time: '2025-07-26T14:20:00.000Z',
        amount: 688.00,
        sales: { wechat_name: '销售李四' }
      },
      {
        id: 6,
        tradingview_username: 'testuser4',
        customer_wechat: 'customer004',
        status: 'confirmed_configuration',
        expiry_time: '2125-01-24T11:45:00.000Z',
        amount: 1888.00,
        sales: { wechat_name: '销售王五' }
      },
      {
        id: 7,
        tradingview_username: 'testuser5',
        customer_wechat: 'customer005',
        status: 'confirmed_configuration',
        expiry_time: '2026-02-02T00:00:00.000Z',
        amount: 1588.00,
        sales: { wechat_name: '销售赵六' }
      }
    ];

    // 按用户分组，计算总金额和最新到期时间
    const customerMap = new Map();
    
    mockOrders.forEach(order => {
      if (order.status === 'confirmed_configuration') {
        const username = order.tradingview_username;
        if (!customerMap.has(username)) {
                  customerMap.set(username, {
          id: customerMap.size + 1,
          customer_wechat: order.customer_wechat || username, // 使用真实的用户微信
          tradingview_username: username,
          sales_wechat: order.sales.wechat_name, // 添加销售微信字段
          total_orders: 0,
          total_amount: 0,
          commission_amount: 0, // 添加返佣金额字段
          last_order_date: order.expiry_time, // 修改为到期时间
          expiry_date: order.expiry_time,
          remind_status: 'pending', // 添加催单状态
          status: 'active',
          sales: order.sales
        });
        }
        
        const customer = customerMap.get(username);
        customer.total_orders += 1;
        customer.total_amount += order.amount;
        
        // 计算返佣金额（根据佣金档次逻辑）
        let commissionRate = 0.3; // 默认30%
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
        customer.commission_amount += order.amount * commissionRate;
        
        // 更新为最新的到期时间
        if (new Date(order.expiry_time) > new Date(customer.expiry_date)) {
          customer.expiry_date = order.expiry_time;
          customer.last_order_date = order.expiry_time; // 修改为到期时间
        }
      }
    });
    
    let mockCustomers = Array.from(customerMap.values());
    
    // 模拟搜索过滤
    if (tradingview_username) {
      mockCustomers = mockCustomers.filter(customer => 
        customer.tradingview_username.toLowerCase().includes(tradingview_username.toLowerCase())
      );
    }
    
    if (sales_wechat) {
      mockCustomers = mockCustomers.filter(customer => 
        customer.sales.wechat_name.toLowerCase().includes(sales_wechat.toLowerCase())
      );
    }
    
    if (remind_status) {
      mockCustomers = mockCustomers.filter(customer => 
        customer.remind_status === remind_status
      );
    }
    
    // 日期范围过滤
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      mockCustomers = mockCustomers.filter(customer => {
        const expiryDate = new Date(customer.expiry_date);
        return expiryDate >= startDate && expiryDate <= endDate;
      });
    }
    

    
    res.json({
      success: true,
      message: '获取客户列表成功',
      data: {
        customers: mockCustomers,
        pagination: {
          total: mockCustomers.length,
          page: 1,
          limit: 20,
          total_pages: 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取客户列表失败',
      error: error.message
    });
  }
});

module.exports = router; 