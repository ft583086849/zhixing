#!/usr/bin/env node

/**
 * 项目完整数据架构分析
 * 小D模式 - 直接执行全面分析
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './client/.env.local' });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ========== 1. 数据库表结构分析 ==========
async function analyzeDatabase() {
  console.log('📊 分析数据库表结构...\n');
  
  const tables = {
    'orders_optimized': {
      name: '订单表（优化版）',
      fields: {
        order_id: '订单ID (主键)',
        customer_wechat: '客户微信号',
        sales_wechat: '销售微信号',
        sales_code: '销售代码',
        amount: '订单金额',
        duration: '购买时长',
        status: '订单状态',
        payment_proof: '支付凭证',
        reminder_sent: '催单标记',
        is_reminded: '是否已催单',
        reminder_time: '催单时间',
        created_at: '创建时间',
        updated_at: '更新时间',
        expiry_time: '到期时间',
        payment_time: '支付时间',
        config_time: '配置时间',
        commission_paid: '佣金是否已支付',
        commission_rate: '佣金率',
        commission_amount: '佣金金额',
        chain_name: '区块链名称',
        wallet_address: '钱包地址'
      },
      calculation: '佣金 = amount * commission_rate',
      cycle: '到期时间 = created_at + duration天'
    },
    
    'sales_optimized': {
      name: '销售员表（优化版）',
      fields: {
        id: '主键ID',
        sales_code: '销售代码 (唯一)',
        wechat_name: '微信名称',
        sales_type: '销售类型 (primary/secondary/independent)',
        parent_sales_code: '上级销售代码',
        primary_sales_code: '一级销售代码',
        commission_rate: '佣金率',
        pending_commission: '待返佣金',
        total_commission: '总佣金',
        payment_method: '收款方式',
        payment_account: '收款账号',
        chain_name: '区块链名称',
        wallet_address: '钱包地址',
        created_at: '创建时间',
        updated_at: '更新时间'
      },
      calculation: '待返佣金 = 未支付订单的佣金总和',
      cycle: '实时更新'
    },
    
    'customers_optimized': {
      name: '客户表（优化版）',
      fields: {
        id: '主键ID',
        customer_wechat: '客户微信 (唯一)',
        sales_wechat: '销售微信',
        sales_code: '销售代码',
        total_orders: '总订单数',
        total_amount: '总金额',
        created_at: '创建时间',
        updated_at: '更新时间',
        is_reminded: '是否已催单',
        reminder_time: '催单时间'
      },
      calculation: '总金额 = SUM(orders.amount)',
      cycle: '触发器自动更新'
    },
    
    'admins': {
      name: '管理员表',
      fields: {
        id: '主键ID',
        username: '用户名',
        password: '密码(加密)',
        role: '角色',
        created_at: '创建时间'
      }
    },
    
    'commission_history': {
      name: '佣金历史表',
      fields: {
        id: '主键ID',
        sales_code: '销售代码',
        wechat_name: '微信名称',
        commission_rate: '佣金率',
        changed_from: '原佣金率',
        changed_to: '新佣金率',
        changed_by: '修改人',
        changed_at: '修改时间',
        reason: '修改原因'
      }
    },
    
    'system_config': {
      name: '系统配置表',
      fields: {
        id: '主键ID',
        config_key: '配置键',
        config_value: '配置值',
        description: '描述',
        updated_at: '更新时间'
      }
    },
    
    'overview_stats': {
      name: '统计概览表',
      fields: {
        id: '主键ID',
        stat_date: '统计日期',
        total_orders: '总订单数',
        total_revenue: '总收入',
        total_commission: '总佣金',
        pending_commission: '待返佣金',
        new_customers: '新客户数',
        active_sales: '活跃销售数',
        updated_at: '更新时间'
      },
      calculation: '每日凌晨统计前一天数据',
      cycle: '每日更新'
    },
    
    'excluded_sales_config': {
      name: '排除销售配置表',
      fields: {
        id: '主键ID',
        wechat_name: '销售微信',
        sales_code: '销售代码',
        sales_type: '销售类型',
        reason: '排除原因',
        excluded_by: '操作人',
        excluded_at: '排除时间',
        is_active: '是否激活'
      }
    }
  };
  
  return tables;
}

// ========== 2. 页面路由分析 ==========
function analyzePages() {
  console.log('📱 分析页面结构...\n');
  
  const pages = {
    '/': {
      name: '首页',
      component: 'HomePage',
      description: '系统入口，跳转到各功能模块'
    },
    
    '/sales': {
      name: '销售管理',
      component: 'SalesPage',
      tables: ['sales_optimized'],
      api: ['salesAPI.register', 'salesAPI.getSalesByWechat'],
      fields: {
        wechat_name: '微信名称',
        sales_type: '销售类型',
        commission_rate: '佣金率',
        payment_method: '收款方式',
        payment_account: '收款账号'
      }
    },
    
    '/purchase': {
      name: '购买页面',
      component: 'PurchasePage',
      tables: ['orders_optimized', 'sales_optimized'],
      api: ['ordersAPI.createOrder'],
      fields: {
        customer_wechat: '客户微信',
        amount: '订单金额',
        duration: '购买时长',
        payment_proof: '支付凭证'
      },
      params: 'sales_code (推广链接参数)'
    },
    
    '/admin': {
      name: '管理员登录',
      component: 'AdminLoginPage',
      tables: ['admins'],
      api: ['authAPI.login']
    },
    
    '/admin/dashboard': {
      name: '管理后台首页',
      component: 'AdminDashboardPage',
      description: '管理后台导航页'
    },
    
    '/admin/orders': {
      name: '订单管理',
      component: 'AdminOrders',
      tables: ['orders_optimized'],
      api: ['AdminAPI.getOrders', 'AdminAPI.updateOrderStatus'],
      fields: {
        order_id: '订单号',
        customer_wechat: '客户微信',
        sales_wechat: '销售微信',
        amount: '金额',
        status: '状态',
        duration: '时长',
        expiry_time: '到期时间'
      },
      filters: {
        status: '订单状态筛选',
        amount: '金额筛选',
        date_range: '时间范围'
      }
    },
    
    '/admin/sales': {
      name: '销售管理',
      component: 'AdminSales',
      tables: ['sales_optimized', 'commission_history'],
      api: ['AdminAPI.getSales', 'AdminAPI.updateCommissionRate'],
      fields: {
        sales_code: '销售代码',
        wechat_name: '微信名称',
        sales_type: '销售类型',
        commission_rate: '佣金率',
        total_commission: '总佣金',
        pending_commission: '待返佣金'
      }
    },
    
    '/admin/finance': {
      name: '财务管理',
      component: 'AdminFinance',
      tables: ['orders_optimized', 'sales_optimized'],
      api: ['AdminAPI.getFinanceStats', 'AdminAPI.markCommissionPaid'],
      fields: {
        total_revenue: '总收入',
        total_commission: '总佣金',
        pending_commission: '待返佣金',
        paid_commission: '已支付佣金'
      },
      calculation: {
        revenue: 'SUM(orders.amount WHERE status=confirmed)',
        commission: 'SUM(orders.commission_amount)',
        pending: 'SUM(commission WHERE NOT paid)'
      }
    },
    
    '/admin/customers': {
      name: '客户管理',
      component: 'AdminCustomers',
      tables: ['customers_optimized', 'orders_optimized'],
      api: ['AdminAPI.getCustomers', 'AdminAPI.markReminder'],
      fields: {
        customer_wechat: '客户微信',
        total_orders: '订单数',
        total_amount: '总金额',
        is_reminded: '催单状态',
        reminder_suggestion: '催单建议'
      },
      features: {
        reminder: '催单功能（7天内到期）',
        export: '导出Excel'
      }
    },
    
    '/admin/overview': {
      name: '数据概览',
      component: 'AdminOverview',
      tables: ['overview_stats', 'orders_optimized', 'sales_optimized'],
      api: ['AdminAPI.getStats', 'AdminAPI.getConversionStats'],
      fields: {
        total_orders: '总订单数',
        total_revenue: '总收入',
        total_commission: '总佣金',
        conversion_rate: '转化率',
        active_sales: '活跃销售'
      },
      charts: {
        trend: '趋势图（7天/30天）',
        conversion: '转化率统计表'
      }
    },
    
    '/sales/commission': {
      name: '一级销售对账',
      component: 'PrimarySalesSettlementPage',
      tables: ['sales_optimized', 'orders_optimized'],
      api: ['AdminAPI.getPrimarySalesStats'],
      fields: {
        today_commission: '今日佣金',
        total_commission: '总佣金',
        direct_commission: '直销佣金',
        team_commission: '团队佣金'
      },
      calculation: '一级销售总佣金 = 直销 + 所有下级'
    },
    
    '/sales/secondary': {
      name: '二级销售对账',
      component: 'SecondarySalesPage',
      tables: ['sales_optimized', 'orders_optimized'],
      api: ['salesAPI.getSecondaryStats'],
      fields: {
        sales_wechat: '销售微信',
        order_count: '订单数',
        commission: '佣金',
        reminder_list: '催单列表'
      }
    }
  };
  
  return pages;
}

// ========== 3. API接口分析 ==========
function analyzeAPIs() {
  console.log('🔌 分析API接口...\n');
  
  const apis = {
    // 管理员API
    'AdminAPI.getStats': {
      method: 'POST',
      tables: ['orders_optimized', 'sales_optimized'],
      params: ['timeRange', 'startDate', 'endDate'],
      returns: {
        total_orders: '总订单数',
        total_revenue: '总收入',
        total_commission: '总佣金',
        pending_commission: '待返佣金'
      },
      usedBy: ['AdminOverview', 'AdminFinance']
    },
    
    'AdminAPI.getOrders': {
      method: 'GET',
      tables: ['orders_optimized'],
      params: ['status', 'amount', 'date_range'],
      returns: '订单列表',
      usedBy: ['AdminOrders']
    },
    
    'AdminAPI.updateOrderStatus': {
      method: 'PUT',
      tables: ['orders_optimized'],
      params: ['order_id', 'status', 'config_time'],
      action: '更新订单状态',
      trigger: '触发佣金计算',
      usedBy: ['AdminOrders']
    },
    
    'AdminAPI.getSales': {
      method: 'GET',
      tables: ['sales_optimized'],
      params: ['sales_type', 'wechat_name'],
      returns: '销售员列表',
      usedBy: ['AdminSales']
    },
    
    'AdminAPI.getCustomers': {
      method: 'GET',
      tables: ['customers_optimized', 'orders_optimized'],
      params: ['customer_wechat', 'is_reminded'],
      returns: '客户列表及催单状态',
      usedBy: ['AdminCustomers']
    },
    
    'AdminAPI.markReminder': {
      method: 'PUT',
      tables: ['customers_optimized', 'orders_optimized'],
      params: ['customer_wechat'],
      action: '标记已催单',
      usedBy: ['AdminCustomers']
    },
    
    'AdminAPI.getPrimarySalesStats': {
      method: 'POST',
      tables: ['sales_optimized', 'orders_optimized'],
      params: ['sales_code'],
      returns: {
        sales_info: '销售信息',
        today_commission: '今日佣金',
        total_commission: '总佣金',
        orders: '订单列表'
      },
      calculation: '包含下级销售佣金汇总',
      usedBy: ['PrimarySalesSettlementPage']
    },
    
    'AdminAPI.getConversionStats': {
      method: 'GET',
      tables: ['orders_optimized', 'excluded_sales_config'],
      params: ['timeRange', 'salesTypeFilter'],
      returns: '转化率统计',
      calculation: '转化率 = 付费订单 / 总订单',
      usedBy: ['AdminOverview', 'ConversionRateTable']
    },
    
    // 销售API
    'salesAPI.register': {
      method: 'POST',
      tables: ['sales_optimized'],
      params: ['wechat_name', 'sales_type', 'parent_code'],
      action: '注册销售员',
      usedBy: ['SalesPage']
    },
    
    'salesAPI.getSalesByWechat': {
      method: 'GET',
      tables: ['sales_optimized'],
      params: ['wechat_name'],
      returns: '销售员信息',
      usedBy: ['SalesPage']
    },
    
    // 订单API
    'ordersAPI.createOrder': {
      method: 'POST',
      tables: ['orders_optimized', 'customers_optimized'],
      params: ['customer_wechat', 'amount', 'duration', 'sales_code'],
      action: '创建订单',
      trigger: '更新客户表',
      usedBy: ['PurchasePage']
    },
    
    // 认证API
    'authAPI.login': {
      method: 'POST',
      tables: ['admins'],
      params: ['username', 'password'],
      returns: 'JWT token',
      usedBy: ['AdminLoginPage']
    }
  };
  
  return apis;
}

// ========== 4. 数据流分析 ==========
function analyzeDataFlow() {
  console.log('🔄 分析数据流...\n');
  
  const dataFlow = {
    '订单创建流程': {
      steps: [
        '1. 客户通过销售链接访问 /purchase?sales_code=XXX',
        '2. 填写信息，调用 ordersAPI.createOrder',
        '3. 写入 orders_optimized 表',
        '4. 触发器自动更新 customers_optimized 表',
        '5. 状态为 pending，等待审核'
      ],
      tables: ['orders_optimized', 'customers_optimized']
    },
    
    '订单审核流程': {
      steps: [
        '1. 管理员在 /admin/orders 查看待审核订单',
        '2. 确认支付后，调用 updateOrderStatus',
        '3. 状态改为 confirmed_config',
        '4. 触发器计算佣金，更新 sales_optimized.pending_commission',
        '5. 记录 config_time 配置时间'
      ],
      tables: ['orders_optimized', 'sales_optimized']
    },
    
    '佣金计算流程': {
      steps: [
        '1. 订单状态变为 confirmed_config 触发',
        '2. 根据 sales_code 查找销售员',
        '3. 计算佣金 = amount * commission_rate',
        '4. 更新 orders.commission_amount',
        '5. 累加到 sales.pending_commission',
        '6. 如有上级，递归计算团队佣金'
      ],
      calculation: {
        直销佣金: 'amount * sales.commission_rate',
        团队佣金: 'amount * (parent.rate - sales.rate)'
      }
    },
    
    '催单流程': {
      steps: [
        '1. 系统判断订单即将到期（7天内）',
        '2. 在客户管理页显示催单建议',
        '3. 点击催单，调用 markReminder',
        '4. 更新 customers.is_reminded = true',
        '5. 记录 reminder_time'
      ],
      rules: {
        付费订单: '到期前7天内催单',
        免费订单: '到期前3天内催单'
      }
    },
    
    '统计更新流程': {
      steps: [
        '1. 实时统计通过聚合查询计算',
        '2. overview_stats 表每日凌晨更新',
        '3. 转化率实时计算，可排除特定销售',
        '4. 使用中国时区 (UTC+8)'
      ],
      timeRange: {
        today: '北京时间 00:00-23:59',
        week: '最近7天',
        month: '最近30天',
        all: '全部时间'
      }
    }
  };
  
  return dataFlow;
}

// ========== 5. 生成完整报告 ==========
async function generateCompleteReport() {
  console.log('📊 生成项目完整数据架构报告...\n');
  console.log('='.repeat(80));
  
  const tables = await analyzeDatabase();
  const pages = analyzePages();
  const apis = analyzeAPIs();
  const dataFlow = analyzeDataFlow();
  
  const report = {
    生成时间: new Date().toLocaleString('zh-CN'),
    项目名称: '知行财库系统',
    
    一_数据库架构: tables,
    二_页面路由: pages,
    三_API接口: apis,
    四_数据流程: dataFlow,
    
    五_关键计算逻辑: {
      佣金计算: {
        直销: 'orders.amount * sales.commission_rate',
        团队: 'orders.amount * (parent_rate - self_rate)',
        待返: 'SUM(未支付订单的commission_amount)',
        已付: 'SUM(已支付订单的commission_amount)'
      },
      
      转化率计算: {
        公式: '(付费订单数 / 总订单数) * 100%',
        排除: '可排除特定销售的订单',
        时间: '支持今天/本周/本月/全部'
      },
      
      到期时间计算: {
        免费: 'created_at + 7天',
        一个月: 'created_at + 30天',
        三个月: 'created_at + 90天',
        六个月: 'created_at + 180天',
        一年: 'created_at + 365天'
      }
    },
    
    六_时间周期: {
      统计周期: '使用中国标准时间 UTC+8',
      今日: '北京时间 00:00 到 23:59',
      实时更新: ['订单状态', '佣金计算', '客户信息'],
      定时更新: ['overview_stats (每日凌晨)'],
      触发更新: ['customers_optimized (订单变化时)']
    },
    
    七_权限体系: {
      管理员: '全部功能访问权限',
      一级销售: '查看自己和团队数据',
      二级销售: '查看自己的数据',
      独立销售: '查看自己的数据',
      客户: '只能提交订单'
    },
    
    八_关键业务规则: {
      订单状态流转: 'pending → confirmed_payment → confirmed_config → active → expired',
      佣金支付: '订单配置生效后计入待返佣金',
      催单规则: '付费7天内/免费3天内到期',
      销售层级: '最多支持二级分销',
      排除功能: '可排除特定销售不计入统计'
    }
  };
  
  // 保存为JSON文件
  fs.writeFileSync(
    path.join(__dirname, 'project-data-architecture.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );
  
  console.log('✅ 报告已生成: project-data-architecture.json');
  console.log('\n📊 项目数据架构概览：');
  console.log(`- 数据表: ${Object.keys(tables).length} 个`);
  console.log(`- 页面路由: ${Object.keys(pages).length} 个`);
  console.log(`- API接口: ${Object.keys(apis).length} 个`);
  console.log(`- 核心流程: ${Object.keys(dataFlow).length} 个`);
  
  return report;
}

// 执行分析
generateCompleteReport().catch(console.error);