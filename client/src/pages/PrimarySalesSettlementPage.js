import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, Select, message, Tag, Space, Tooltip, Typography, InputNumber, DatePicker } from 'antd';
import { DollarOutlined, UserOutlined, ShoppingCartOutlined, TeamOutlined, ExclamationCircleOutlined, SearchOutlined, ReloadOutlined, BellOutlined } from '@ant-design/icons';
import { supabase } from '../services/supabase';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPrimarySalesStats, fetchPrimarySalesOrders, updateSecondarySalesCommission, removeSecondarySales, getPrimarySalesSettlement } from '../store/slices/salesSlice';
import { 
  formatCommissionRate,
  percentToDecimal,
  decimalToPercent,
  calculatePrimaryCommissionRate
} from '../utils/commissionUtils';
import ReminderSection from '../components/admin/ReminderSection';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title } = Typography;

const PrimarySalesSettlementPage = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.sales);
  
  // 页面状态管理
  const [salesData, setSalesData] = useState(null);
  const [primarySalesStats, setPrimarySalesStats] = useState(null);
  const [primarySalesOrders, setPrimarySalesOrders] = useState(null);
  const [searchForm] = Form.useForm();
  const [commissionModalVisible, setCommissionModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [selectedSecondarySales, setSelectedSecondarySales] = useState(null);
  const [filteredSecondarySales, setFilteredSecondarySales] = useState(null); // 过滤后的二级销售数据
  const [commissionForm] = Form.useForm();
  const [removeForm] = Form.useForm();
  const [secondarySalesSearchForm] = Form.useForm();
  const [ordersSearchForm] = Form.useForm();
  const [reminderSearchForm] = Form.useForm(); // 添加待催单搜索表单
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 保存上次查询参数
  const lastSearchParams = useRef(null);
  
  // 自动刷新（每30秒）
  useEffect(() => {
    // 移除自动刷新，避免数据闪烁
    // 用户可以手动点击刷新按钮
    // if (salesData && lastSearchParams.current) {
    //   const interval = setInterval(() => {
    //     handleRefresh();
    //   }, 30000); // 30秒自动刷新
    //   
    //   return () => clearInterval(interval);
    // }
  }, [salesData]);

  // 刷新数据
  const handleRefresh = async () => {
    if (!lastSearchParams.current) return;
    
    setIsRefreshing(true);
    try {
      const response = await dispatch(getPrimarySalesSettlement(lastSearchParams.current)).unwrap();
      
      if (response && response.sales) {
        const { sales, orders, secondarySales, reminderOrders, stats } = response;
        
        const ordersData = {
          data: orders || [],
          total: orders ? orders.length : 0,
          page: 1
        };
        
        const statsData = {
          // 销售基本信息（重要！用于判断销售人员）
          sales_code: sales?.sales_code,
          wechat_name: sales?.wechat_name,
          totalCommission: stats?.totalCommission || 0,
          monthlyCommission: stats?.totalCommission || 0,
          totalOrders: stats?.totalOrders || 0,
          monthlyOrders: stats?.totalOrders || 0,
          secondarySales: secondarySales || [],
          pendingReminderCount: stats?.pendingReminderCount || 0,
          monthlyReminderCount: stats?.pendingReminderCount || 0,
          reminderSuccessRate: 85.0,
          avgResponseTime: 2.5,
          pendingReminderOrders: reminderOrders || []
        };
        
        setSalesData(sales);
        setPrimarySalesStats(statsData);
        setPrimarySalesOrders(ordersData);
        
        message.success('数据已刷新');
      }
    } catch (error) {
      console.error('刷新失败:', error);
      message.error('数据刷新失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 搜索处理函数
  const handleSearch = async (values) => {
    if (!values.wechat_name && !values.sales_code) {
      message.error('请输入微信号或销售代码');
      return;
    }

    // 不需要手动设置loading，Redux会管理
    try {
      // 调用真实API - 一级销售对账查询
      const params = {};
      if (values.wechat_name) params.wechat_name = values.wechat_name;
      if (values.sales_code) params.sales_code = values.sales_code;
      
      // 保存查询参数供刷新使用
      lastSearchParams.current = params;
      
      const response = await dispatch(getPrimarySalesSettlement(params)).unwrap();
      
      if (!response || !response.sales) {
        message.error('未找到匹配的一级销售数据');
        return;
      }
      
      const { sales, orders, secondarySales, reminderOrders, stats } = response;

      // 使用真实API数据，确保所有订单都是config_confirmed=true的
      const ordersData = {
        data: orders || [],
        total: orders ? orders.length : 0,
        page: 1
      };

      // 构建统计数据（复用销售管理页面的数据结构）
      const statsData = {
        // 销售基本信息（重要！用于判断销售人员）
        sales_code: sales?.sales_code,
        wechat_name: sales?.wechat_name,
        // 总佣金收入
        totalCommission: stats?.totalCommission || sales?.total_commission || 0,
        // 本月佣金
        monthlyCommission: stats?.monthCommission || stats?.month_commission || 0,
        // 当日佣金
        todayCommission: stats?.todayCommission || stats?.today_commission || 0,
        // 订单数据
        totalOrders: stats?.totalOrders || 0,
        monthlyOrders: stats?.monthOrders || stats?.month_orders || 0,
        todayOrders: stats?.todayOrders || stats?.today_orders || 0,
        // 佣金明细（复用销售管理页面字段）
        direct_commission: sales?.direct_commission || stats?.direct_commission || 0, // 直销佣金
        secondary_avg_rate: sales?.secondary_avg_rate || stats?.secondary_avg_rate || 0, // 平均二级佣金率
        secondary_share_commission: sales?.secondary_share_commission || stats?.secondary_share_commission || 0, // 二级佣金收益
        secondary_orders_amount: sales?.secondary_orders_amount || stats?.secondary_orders_amount || 0, // 二级销售订单总额
        // 其他数据
        secondarySales: secondarySales || [],
        pendingReminderCount: stats?.pendingReminderCount || 0,
        monthlyReminderCount: stats?.pendingReminderCount || 0,
        reminderSuccessRate: 85.0, // 默认值
        avgResponseTime: 2.5, // 默认值
        pendingReminderOrders: reminderOrders || [],
        currentCommissionRate: stats?.currentCommissionRate || sales?.commission_rate || 0.4
      };

      setSalesData(sales);
      setPrimarySalesStats(statsData);
      setPrimarySalesOrders(ordersData);
      
      message.success('查询成功');
    } catch (error) {
      console.error('查询失败详情:', error);
      const errorMsg = error.message || error || '查询失败';
      message.error(`查询失败: ${errorMsg}`);
    }
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSalesData(null);
    setPrimarySalesStats(null);
    setPrimarySalesOrders(null);
    message.info('已重置查询条件');
  };

  // 佣金统计卡片
  const renderStatsCards = () => (
    <div style={{ marginBottom: 24 }}>
      {/* 第一行：核心佣金数据 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable
            style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: '#fff', fontSize: '14px' }}>总佣金收入</span>}
              value={Math.abs(primarySalesStats?.totalCommission || 0)}
              precision={2}
              valueStyle={{ color: '#fff', fontSize: '28px', fontWeight: 'bold' }}
              prefix={<DollarOutlined style={{ fontSize: '20px' }} />}
              suffix={<span style={{ fontSize: '16px' }}>元</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable
            style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: '#fff', fontSize: '14px' }}>本月佣金</span>}
              value={Math.abs(primarySalesStats?.monthlyCommission || 0)}
              precision={2}
              valueStyle={{ color: '#fff', fontSize: '28px', fontWeight: 'bold' }}
              prefix={<DollarOutlined style={{ fontSize: '20px' }} />}
              suffix={<span style={{ fontSize: '16px' }}>元</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable
            style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: '#fff', fontSize: '14px' }}>当日佣金</span>}
              value={Math.abs(primarySalesStats?.todayCommission || 0)}
              precision={2}
              valueStyle={{ color: '#fff', fontSize: '28px', fontWeight: 'bold' }}
              prefix={<DollarOutlined style={{ fontSize: '20px' }} />}
              suffix={<span style={{ fontSize: '16px' }}>元</span>}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 第二行：佣金明细 - v2.0新增 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              height: '100%',
              borderLeft: '4px solid #1890ff'
            }}
          >
            <Statistic
              title="一级销售佣金额"
              value={primarySalesStats?.direct_commission || 0}
              precision={2}
              valueStyle={{ color: '#1890ff', fontSize: '22px', fontWeight: 'bold' }}
              prefix="$"
              suffix={<span style={{ fontSize: '12px', color: '#999' }}>(直销×40%)</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              height: '100%',
              borderLeft: '4px solid #722ed1'
            }}
          >
            <Statistic
              title="平均二级佣金率"
              value={(() => {
                const rate = primarySalesStats?.secondary_avg_rate || 0;
                return (rate * 100).toFixed(1);
              })()}
              valueStyle={{ color: '#722ed1', fontSize: '22px', fontWeight: 'bold' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              height: '100%',
              borderLeft: '4px solid #13c2c2'
            }}
          >
            <Statistic
              title="二级佣金收益额"
              value={primarySalesStats?.secondary_share_commission || 0}
              precision={2}
              valueStyle={{ color: '#13c2c2', fontSize: '22px', fontWeight: 'bold' }}
              prefix="$"
              suffix={<span style={{ fontSize: '12px', color: '#999' }}>(分销收益)</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              height: '100%',
              borderLeft: '4px solid #eb2f96'
            }}
          >
            <Statistic
              title="二级销售订单总额"
              value={primarySalesStats?.secondary_orders_amount || 0}
              precision={2}
              valueStyle={{ color: '#eb2f96', fontSize: '22px', fontWeight: 'bold' }}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>
      
      {/* 第三行：业务指标 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={12}>
          <Card 
            hoverable
            style={{ 
              height: '100%',
              borderLeft: '4px solid #722ed1'
            }}
          >
            <Statistic
              title="二级销售"
              value={primarySalesStats?.secondarySales?.length || 0}
              valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: 'bold' }}
              prefix={<TeamOutlined style={{ fontSize: '18px' }} />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Card 
            hoverable
            style={{ 
              height: '100%',
              borderLeft: '4px solid #1890ff'
            }}
          >
            <Statistic
              title="一二级总订单数"
              value={primarySalesStats?.totalOrders || 0}
              valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
              prefix={<ShoppingCartOutlined style={{ fontSize: '18px' }} />}
              suffix="单"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // 订单列表表格列定义
  const orderColumns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '客户微信',
      dataIndex: 'customer_wechat',
      key: 'customer_wechat',
      width: 120,
    },
    {
      title: 'TradingView用户名',
      dataIndex: 'tradingview_username',
      key: 'tradingview_username',
      width: 150,
    },
    {
      title: '套餐类型',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration) => {
        const durationMap = {
          '1month': '1个月',
          '3months': '3个月',
          '1year': '1年'
        };
        return durationMap[duration] || duration;
      }
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => {
        const value = parseFloat(amount || 0);
        return `$${value.toFixed(2)}`;
      }
    },
    {
      title: '佣金金额',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      width: 100,
      render: (commission) => {
        const value = parseFloat(commission || 0);
        return `$${value.toFixed(2)}`;
      }
    },
    {
      title: '销售人员',
      dataIndex: 'sales_code',
      key: 'sales_person',
      width: 120,
      render: (salesCode, record) => {
        // 参考订单管理页面的逻辑
        // 如果销售代码等于一级销售的代码，显示一级销售的微信名称
        if (salesCode === primarySalesStats?.sales_code) {
          return <Tag color="green">{primarySalesStats?.wechat_name || '一级自营'}</Tag>;
        }
        // 查找对应的二级销售信息
        const secondarySale = primarySalesStats?.secondarySales?.find(s => s.sales_code === salesCode);
        if (secondarySale) {
          return <Tag color="blue">{secondarySale.wechat_name || '二级销售'}</Tag>;
        }
        // 默认显示
        return <Tag color="default">{salesCode || '-'}</Tag>;
      }
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          'pending_review': { text: '待审核', color: 'orange' },
          'pending_payment': { text: '待付款确认', color: 'orange' },
          'confirmed_payment': { text: '已付款确认', color: 'blue' },
          'pending_config': { text: '待配置确认', color: 'purple' },
          'confirmed_config': { text: '已配置确认', color: 'green' },
          'confirmed': { text: '已确认', color: 'green' },
          'approved': { text: '已通过', color: 'green' },
          'rejected': { text: '已拒绝', color: 'red' },
          'completed': { text: '已完成', color: 'blue' },
          'active': { text: '已生效', color: 'green' },
          'expired': { text: '已过期', color: 'gray' },
          'cancelled': { text: '已取消', color: 'red' }
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => {
        if (!date) return '-';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '-';
        return dateObj.toLocaleString('zh-CN');
      }
    }
    // 🔧 修复：移除操作列（用户要求）
  ];

  // 处理二级销售数据，将有金额的订单拆分显示
  const processSecondaryData = (secondarySalesData) => {
    const processedData = [];
    
    secondarySalesData?.forEach(sale => {
      // 判断是否有付费订单（总金额 > 0）
      const hasPaidOrders = (sale.total_amount || 0) > 0;
      
      if (hasPaidOrders) {
        // 有付费订单，拆分成两条记录
        
        // 第一条：二级销售的佣金收益
        processedData.push({
          ...sale,
          id: `${sale.id}_secondary`,
          display_type: 'secondary',
          display_name: sale.wechat_name,
          commission_type: '二级销售佣金',
          commission_amount: (sale.total_amount || 0) * (sale.commission_rate || 0.25),
          commission_rate_display: sale.commission_rate || 0.25
        });
        
        // 第二条：一级销售从该二级获得的佣金
        processedData.push({
          ...sale,
          id: `${sale.id}_primary`,
          display_type: 'primary',
          display_name: primarySalesStats?.wechat_name || '一级销售',
          commission_type: '一级分销收益',
          commission_amount: (sale.total_amount || 0) * 0.15, // 固定15%
          commission_rate_display: 0.15
        });
      } else {
        // 免费订单，只显示一条记录
        processedData.push({
          ...sale,
          id: `${sale.id}_single`,
          display_type: 'single',
          display_name: sale.wechat_name,
          commission_type: '免费订单',
          commission_amount: 0,
          commission_rate_display: sale.commission_rate || 0
        });
      }
    });
    
    return processedData;
  };

  // 二级销售列表表格列定义（新设计）
  const secondarySalesColumns = [
    {
      title: '销售类型',
      key: 'sales_type',
      width: 100,
      render: (_, record) => {
        if (record.display_type === 'secondary') {
          return <Tag color="green">二级销售</Tag>;
        } else if (record.display_type === 'primary') {
          return <Tag color="blue">一级收益</Tag>;
        } else {
          return <Tag color="gray">免费订单</Tag>;
        }
      }
    },
    {
      title: '销售人员',
      key: 'sales_person',
      width: 120,
      render: (_, record) => {
        return record.display_name || '-';
      }
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (amount) => {
        const value = parseFloat(amount || 0);
        return `$${value.toFixed(2)}`;
      }
    },
    {
      title: '佣金类型',
      dataIndex: 'commission_type',
      key: 'commission_type',
      width: 120,
    },
    {
      title: '佣金率',
      key: 'commission_rate',
      width: 100,
      render: (_, record) => {
        const rate = record.commission_rate_display;
        if (rate === null || rate === undefined) {
          return '-';
        }
        const numRate = parseFloat(rate);
        if (numRate > 1) {
          return `${numRate.toFixed(1)}%`;
        } else {
          return `${(numRate * 100).toFixed(1)}%`;
        }
      }
    },
    {
      title: '佣金金额',
      key: 'commission_amount',
      width: 120,
      render: (_, record) => {
        const amount = record.commission_amount || 0;
        const color = record.display_type === 'secondary' ? '#52c41a' : 
                      record.display_type === 'primary' ? '#1890ff' : '#999';
        return <span style={{ color, fontWeight: 'bold' }}>${amount.toFixed(2)}</span>;
      }
    },
    {
      title: '订单数量',
      dataIndex: 'total_orders',
      key: 'total_orders',
      width: 80,
      render: (count, record) => {
        // 只在第一条记录显示订单数
        if (record.display_type === 'secondary' || record.display_type === 'single') {
          return count || 0;
        }
        return '-';
      }
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date, record) => {
        // 只在第一条记录显示注册时间
        if (record.display_type === 'secondary' || record.display_type === 'single') {
          if (!date) return '-';
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) return '-';
          return dateObj.toLocaleString('zh-CN');
        }
        return '-';
      }
    },
    {
      title: '购买链接',
      key: 'purchase_link',
      width: 150,
      render: (_, record) => {
        // 生成该二级销售的购买链接
        const baseUrl = window.location.origin;
        const purchaseLink = `${baseUrl}/purchase?sales_code=${record.sales_code}`;
        
        return (
          <Button 
            type="link"
            size="small"
            onClick={() => {
              // 复制链接到剪贴板
              navigator.clipboard.writeText(purchaseLink).then(() => {
                message.success('链接已复制到剪贴板');
              }).catch(() => {
                message.error('复制失败，请手动复制');
              });
            }}
          >
            复制链接
          </Button>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleUpdateCommission(record)}
          >
            设置佣金
          </Button>
          <Button 
            type="default" 
            size="small"
            danger
            onClick={() => handleRemoveSecondarySales(record)}
          >
            移除
          </Button>
        </Space>
      )
    }
  ];

  // 处理更新佣金率
  const handleUpdateCommission = (secondarySales) => {
    setSelectedSecondarySales(secondarySales);
    // 🔧 修复：正确处理佣金率，包括0值
    const currentRate = secondarySales.commission_rate;
    commissionForm.setFieldsValue({
      // 如果是undefined或null则设置默认值，但0是有效值
      // 🔧 修复：二级销售默认佣金率改为25%
      commission_rate: (currentRate !== null && currentRate !== undefined) ? currentRate * 100 : 25
    });
    setCommissionModalVisible(true);
  };

  // 提交佣金率更新
  const handleCommissionSubmit = async () => {
    try {
      const values = await commissionForm.validateFields();
      const commissionRate = values.commission_rate / 100;
      
      // 🔧 修复：调用API更新数据库中的佣金率
      await dispatch(updateSecondarySalesCommission({
        secondarySalesId: selectedSecondarySales.id,
        commissionRate: commissionRate
      })).unwrap();
      
      // 更新本地数据
      if (primarySalesStats && primarySalesStats.secondarySales) {
        const updatedSecondarySales = primarySalesStats.secondarySales.map(sales => {
          if (sales.id === selectedSecondarySales.id) {
            return {
              ...sales,
              commission_rate: commissionRate
            };
          }
          return sales;
        });
        
        setPrimarySalesStats({
          ...primarySalesStats,
          secondarySales: updatedSecondarySales
        });
      }
      
      message.success('佣金率更新成功');
      setCommissionModalVisible(false);
      commissionForm.resetFields();
      
      // 🔧 修复：重新获取数据以确保同步
      if (salesData) {
        const searchValues = searchForm.getFieldsValue();
        handleSearch(searchValues);
      }
    } catch (error) {
      message.error('佣金率更新失败: ' + (error.message || error));
    }
  };

  // 处理移除二级销售
  const handleRemoveSecondarySales = (secondarySales) => {
    setSelectedSecondarySales(secondarySales);
    setRemoveModalVisible(true);
  };

  // 确认移除二级销售
  const handleRemoveConfirm = async () => {
    try {
      await dispatch(removeSecondarySales({
        secondarySalesId: selectedSecondarySales.id,
        reason: '一级销售主动移除'
      })).unwrap();
      message.success('二级销售移除成功');
      setRemoveModalVisible(false);
      
      // 刷新数据
      if (salesData) {
        handleSearch();
      }
    } catch (error) {
      message.error('移除失败: ' + (error.message || error));
    }
  };

  // 处理催单（记录线下已联系用户）
  const handleUrgeOrder = (order) => {
    Modal.confirm({
      title: '确认催单',
      content: `确定已线下联系客户 ${order.customer_wechat} 了吗？`,
      onOk: async () => {
        try {
          // 记录催单操作
          console.log('催单记录:', {
            orderId: order.id,
            customer: order.customer_wechat,
            tradingview: order.tradingview_username,
            expiryTime: order.expiry_time,
            urgedAt: new Date().toISOString()
          });
          
          // 调用API记录催单状态（只更新存在的字段）
          const { data, error } = await supabase
            .from('orders_optimized')
            .update({ 
              is_reminded: true,
              reminded_at: new Date().toISOString()
            })
            .eq('id', order.id)
            .select();
          
          if (error) {
            console.error('催单更新失败:', error);
            throw error;
          }
          
          // 更新本地状态 - 从催单列表中移除该订单
          if (primarySalesStats && primarySalesStats.pendingReminderOrders) {
            const updatedReminderOrders = primarySalesStats.pendingReminderOrders.filter(
              o => o.id !== order.id
            );
            setPrimarySalesStats({
              ...primarySalesStats,
              pendingReminderOrders: updatedReminderOrders,
              pendingReminderCount: updatedReminderOrders.length
            });
          }
          
          // 同时更新订单列表中的状态
          if (primarySalesOrders && primarySalesOrders.data) {
            const updatedOrders = primarySalesOrders.data.map(o => {
              if (o.id === order.id) {
                return { ...o, is_reminded: true };
              }
              return o;
            });
            setPrimarySalesOrders({
              ...primarySalesOrders,
              data: updatedOrders
            });
          }
          
          message.success(`已记录：已线下联系客户 ${order.customer_wechat}`);
        } catch (error) {
          message.error('记录催单操作失败');
        }
      }
    });
  };

  // 二级销售搜索处理
  const handleSecondarySalesSearch = (values) => {
    if (!primarySalesStats || !primarySalesStats.secondarySales) {
      return;
    }
    
    let filteredData = [...(primarySalesStats.secondarySales || [])];
    
    // 按订单总金额过滤（前端过滤）
    if (values.amount && values.amount.length > 0) {
      const selectedAmounts = values.amount.map(a => parseFloat(a));
      filteredData = filteredData.filter(sale => {
        const totalAmount = parseFloat(sale.total_amount || 0);
        return selectedAmounts.includes(totalAmount);
      });
      
      message.success(`找到 ${filteredData.length} 个符合条件的二级销售`);
    }
    
    // 使用单独的过滤状态
    setFilteredSecondarySales(filteredData);
  };

  // 订单搜索处理
  const handleOrdersSearch = async (values) => {
    if (!salesData) {
      message.warning('请先查询销售信息');
      return;
    }
    
    try {
      // 构建搜索参数
      const searchParams = {
        ...lastSearchParams.current,
        order_status: values.status,
        amount_list: values.amount, // 多选金额
        sales_code: values.sales_wechat // 销售代码
      };
      
      // 调用API获取筛选后的数据
      const response = await dispatch(getPrimarySalesSettlement(searchParams)).unwrap();
      
      if (response && response.orders) {
        let filteredOrders = response.orders;
        
        // 前端过滤（如果后端没有完全实现）
        if (values.status) {
          filteredOrders = filteredOrders.filter(order => order.status === values.status);
        }
        
        // 按金额列表过滤 - 使用精确匹配
        if (values.amount && values.amount.length > 0) {
          filteredOrders = filteredOrders.filter(order => {
            // 优先使用total_amount，如果没有则使用amount
            const orderAmount = parseFloat(order.total_amount || order.amount || 0);
            // 将选中的金额转换为数字进行精确比较
            const selectedAmounts = values.amount.map(a => parseFloat(a));
            return selectedAmounts.includes(orderAmount);
          });
        }
        
        // 按销售代码过滤
        if (values.sales_wechat) {
          filteredOrders = filteredOrders.filter(order => order.sales_code === values.sales_wechat);
        }
        
        // 更新订单列表
        setPrimarySalesOrders({
          data: filteredOrders,
          total: filteredOrders.length,
          page: 1
        });
        
        message.success(`找到 ${filteredOrders.length} 个符合条件的订单`);
      }
    } catch (error) {
      message.error('搜索失败，请重试');
    }
  };

  return (
    <div style={{ padding: '24px 24px', maxWidth: '100%' }}>
      <Title level={2} style={{ marginBottom: 24, textAlign: 'center' }}>一级销售分销管理和对账</Title>
      
      {/* 搜索查询功能 */}
      <Card title="查询一级销售信息" style={{ marginBottom: 24 }}>
        <Form 
          form={searchForm} 
          layout="horizontal" 
          onFinish={handleSearch}
          style={{ maxWidth: '100%' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="wechat_name" label="微信号" style={{ marginBottom: 8 }}>
                <Input 
                  placeholder="请输入微信号" 
                  allowClear
                  prefix={<UserOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="sales_code" label="销售代码" style={{ marginBottom: 8 }}>
                <Input 
                  placeholder="请输入销售代码" 
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Form.Item style={{ marginBottom: 8 }}>
                <Space wrap>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    icon={<SearchOutlined />}
                    loading={loading}
                  >
                    查询
                  </Button>
                  <Button onClick={handleReset}>
                    重置
                  </Button>
                  {salesData && (
                    <Button 
                      icon={<ReloadOutlined />}
                      loading={isRefreshing}
                      onClick={handleRefresh}
                    >
                      刷新
                    </Button>
                  )}
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        
        <div style={{ marginTop: 16, color: '#666', fontSize: '14px' }}>
          💡 提示：输入一级销售的微信号或销售代码，查看该销售的分销数据和佣金对账信息
        </div>
      </Card>
      
      {/* 查询前提示 */}
      {!salesData && (
        <Card style={{ marginBottom: 24, textAlign: 'center', background: '#f8f9fa' }}>
          <div style={{ padding: '40px 20px' }}>
            <UserOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
            <h3 style={{ color: '#666', marginBottom: 8 }}>请先查询一级销售信息</h3>
            <p style={{ color: '#999', margin: 0 }}>
              输入一级销售的微信号或销售代码，即可查看分销数据、佣金对账和催单信息
            </p>
          </div>
        </Card>
      )}

      {/* 只有搜索到数据后才显示以下内容 */}
      {salesData && (
        <>
          {/* 销售链接展示 */}
          <Card 
            style={{ 
              marginBottom: 24,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div style={{ 
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{ color: '#fff', marginBottom: 12, fontSize: '16px' }}>
                    <ShoppingCartOutlined style={{ marginRight: 8 }} />
                    用户购买链接
                  </h3>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '6px',
                    wordBreak: 'break-all'
                  }}>
                    <code style={{ fontSize: '13px', color: '#764ba2' }}>
                      {window.location.origin}/purchase?sales_code={salesData.sales_code}
                    </code>
                  </div>
                  <Button 
                    type="ghost"
                    size="small"
                    style={{ 
                      marginTop: 12,
                      color: '#fff',
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    }}
                    onClick={() => {
                      const link = `${window.location.origin}/purchase?sales_code=${salesData.sales_code}`;
                      navigator.clipboard.writeText(link);
                      message.success('购买链接已复制到剪贴板');
                    }}
                  >
                    复制链接
                  </Button>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ 
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{ color: '#fff', marginBottom: 12, fontSize: '16px' }}>
                    <TeamOutlined style={{ marginRight: 8 }} />
                    二级销售注册链接
                  </h3>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '6px',
                    wordBreak: 'break-all'
                  }}>
                    <code style={{ fontSize: '13px', color: '#764ba2' }}>
                      {window.location.origin}/secondary-sales?registration_code={salesData.secondary_registration_code || salesData.sales_code}
                    </code>
                  </div>
                  <Button 
                    type="ghost"
                    size="small"
                    style={{ 
                      marginTop: 12,
                      color: '#fff',
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    }}
                    onClick={() => {
                      const link = `${window.location.origin}/secondary-sales?registration_code=${salesData.secondary_registration_code || salesData.sales_code}`;
                      navigator.clipboard.writeText(link);
                      message.success('注册链接已复制到剪贴板');
                    }}
                  >
                    复制链接
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>
          
          {/* 统计卡片 */}
          {renderStatsCards()}

          {/* 二级销售管理 */}
          <Card title="二级销售管理" style={{ marginBottom: 24 }}>
            {/* 二级销售搜索 */}
            <div style={{ marginBottom: 16, padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
              <Form form={secondarySalesSearchForm} layout="horizontal" onFinish={handleSecondarySalesSearch}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item 
                      name="amount" 
                      label="订单总金额" 
                      style={{ marginBottom: 0 }}
                      tooltip="按销售人员的订单总金额筛选（所有订单求和），可多选"
                    >
                      <Select 
                        mode="multiple"
                        placeholder="选择订单总金额（可多选）" 
                        allowClear 
                        style={{ width: '100%' }}
                        showSearch
                        optionFilterProp="children"
                      >
                        {/* 动态生成金额选项 */}
                        {(() => {
                          const amountSet = new Set();
                          primarySalesStats?.secondarySales?.forEach(sale => {
                            const amount = parseFloat(sale.total_amount || 0);
                            if (amount >= 0) {
                              amountSet.add(amount);
                            }
                          });
                          return Array.from(amountSet).sort((a, b) => a - b).map(amount => (
                            <Option key={amount} value={amount.toString()}>
                              ${amount === 0 ? '0（免费）' : amount.toFixed(2)}
                            </Option>
                          ));
                        })()}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={24} md={16}>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                      <Space wrap>
                        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                          搜索
                        </Button>
                        <Button onClick={() => {
                          secondarySalesSearchForm.resetFields();
                          // 清除过滤状态，恢复到原始数据
                          setFilteredSecondarySales(null);
                          message.success('已重置搜索条件');
                        }}>
                          重置
                        </Button>
                      </Space>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </div>
        <Table
          columns={secondarySalesColumns}
          dataSource={processSecondaryData(filteredSecondarySales || primarySalesStats?.secondarySales || [])}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            responsive: true
          }}
        />
      </Card>

      {/* 订单列表 */}
      <Card title="我的订单列表" style={{ marginBottom: 24 }}>
        {/* 订单搜索 */}
        <div style={{ marginBottom: 16, padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
          <Form form={ordersSearchForm} layout="horizontal" onFinish={handleOrdersSearch}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="status" label="订单状态" style={{ marginBottom: 0 }}>
                  <Select placeholder="请选择订单状态" allowClear>
                    <Option value="pending_payment">待付款确认</Option>
                    <Option value="confirmed_payment">已付款确认</Option>
                    <Option value="pending_config">待配置确认</Option>
                    <Option value="confirmed_config">已配置确认</Option>
                    <Option value="rejected">已拒绝</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item 
                  name="amount" 
                  label="订单金额" 
                  style={{ marginBottom: 0 }}
                  tooltip="按订单套餐价格筛选，可多选"
                >
                  <Select 
                    mode="multiple"
                    placeholder="选择订单金额（可多选）" 
                    allowClear 
                    style={{ width: '100%' }}
                  >
                    <Option value="0">免费体验（$0）</Option>
                    <Option value="188">$188</Option>
                    <Option value="488">$488</Option>
                    <Option value="888">$888</Option>
                    <Option value="1588">$1588</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item 
                  name="sales_wechat" 
                  label="销售微信" 
                  style={{ marginBottom: 0 }}
                >
                  <Select 
                    placeholder="选择销售微信" 
                    allowClear 
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                  >
                    {/* 动态生成销售微信选项 */}
                    {primarySalesStats?.wechat_name && (
                      <Option value={primarySalesStats.sales_code}>{primarySalesStats.wechat_name} (直销)</Option>
                    )}
                    {primarySalesStats?.secondarySales?.map(sales => (
                      <Option key={sales.sales_code} value={sales.sales_code}>
                        {sales.wechat_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={6}>
                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  <Space wrap>
                    <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                      搜索
                    </Button>
                    <Button onClick={() => {
                      ordersSearchForm.resetFields();
                      handleOrdersSearch({});
                    }}>
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
        <Table
          columns={orderColumns}
          dataSource={primarySalesOrders?.data || []}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
            responsive: true,
            // 让 Antd Table 自动处理客户端分页
            // 移除 current 和 total 配置，让组件自动计算
          }}
        />
      </Card>

      {/* 催单功能版块 */}
      <Card title="催单数据统计" style={{ marginBottom: 24 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="待催单客户数"
                value={primarySalesStats?.pendingReminderCount || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        {/* 待催单订单搜索 */}
        <div style={{ marginBottom: 16, padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
          <Form 
            form={reminderSearchForm}
            layout="inline" 
            onFinish={(values) => {
            // 筛选待催单订单
            if (!primarySalesStats?.pendingReminderOrders) return;
            
            let filteredOrders = [...primarySalesStats.pendingReminderOrders];
            
            // 按金额筛选
            if (values.amount && values.amount.length > 0) {
              const selectedAmounts = values.amount.map(a => parseFloat(a));
              filteredOrders = filteredOrders.filter(order => {
                const orderAmount = parseFloat(order.total_amount || order.amount || 0);
                return selectedAmounts.includes(orderAmount);
              });
            }
            
            // 更新显示的催单订单
            setPrimarySalesStats({
              ...primarySalesStats,
              filteredReminderOrders: filteredOrders
            });
            
            message.success(`找到 ${filteredOrders.length} 个符合条件的待催单订单`);
          }}>
            <Form.Item 
              name="amount" 
              label="订单金额"
              tooltip="按订单套餐价格筛选，可多选"
            >
              <Select 
                mode="multiple"
                placeholder="选择订单金额（可多选）" 
                allowClear 
                style={{ width: 300 }}
              >
                <Option value="0">免费体验（$0）</Option>
                <Option value="188">$188</Option>
                <Option value="488">$488</Option>
                <Option value="888">$888</Option>
                <Option value="1588">$1588</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={() => {
                  // 重置表单
                  reminderSearchForm.resetFields();
                  // 重置筛选，显示所有待催单订单
                  setPrimarySalesStats({
                    ...primarySalesStats,
                    filteredReminderOrders: null
                  });
                  message.success('已重置搜索条件');
                }}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>

        {/* 待催单客户列表 */}
        <Table
          title={() => "待催单订单列表"}
          columns={[
            {
              title: '订单ID',
              dataIndex: 'id',
              key: 'id',
              width: 80,
            },
            {
              title: '客户信息',
              key: 'customer_info',
              width: 200,
              render: (_, record) => (
                <div>
                  <div>微信: {record.customer_wechat || '-'}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    TR用户名: {record.tradingview_username || '-'}
                  </div>
                </div>
              ),
            },
            {
              title: '所属销售',
              key: 'sales_info',
              width: 150,
              render: (_, record) => {
                // 根据sales_code查找销售名称
                if (record.sales_code === primarySalesStats?.sales_code) {
                  // 是一级销售自己的订单
                  return (
                    <div>
                      <Tag color="blue" size="small">一级直销</Tag>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {primarySalesStats?.wechat_name || '一级销售'}
                      </div>
                    </div>
                  );
                } else {
                  // 查找二级销售信息
                  const secondarySale = primarySalesStats?.secondarySales?.find(s => s.sales_code === record.sales_code);
                  if (secondarySale) {
                    return (
                      <div>
                        <Tag color="orange" size="small">二级销售</Tag>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {secondarySale.wechat_name || record.sales_code}
                        </div>
                      </div>
                    );
                  }
                  // 默认显示
                  return (
                    <div>
                      <Tag color="default" size="small">销售</Tag>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {record.sales_code || '-'}
                      </div>
                    </div>
                  );
                }
              },
            },
            {
              title: '订单金额',
              dataIndex: 'total_amount',
              key: 'total_amount',
              width: 100,
              render: (amount) => (
                <span style={{ 
                  color: amount > 0 ? '#52c41a' : '#faad14',
                  fontWeight: 'bold' 
                }}>
                  ${parseFloat(amount || 0).toFixed(2)}
                </span>
              ),
            },
            {
              title: '创建时间',
              dataIndex: 'created_at',
              key: 'created_at',
              width: 150,
              render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
            },
            {
              title: '到期时间',
              dataIndex: 'expiry_time',
              key: 'expiry_time',
              width: 150,
              render: (time) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
            },
            {
              title: '催单建议',
              key: 'reminder_suggestion',
              width: 120,
              render: (_, record) => {
                if (record.expiry_time) {
                  const expiryDate = dayjs(record.expiry_time);
                  const today = dayjs();
                  const daysUntilExpiry = expiryDate.diff(today, 'day');
                  
                  // 只催已配置生效且马上到期的订单
                  const isActiveOrder = record.status === 'confirmed_config' || record.status === 'active';
                  
                  if (isActiveOrder) {
                    // 根据金额判断催单时间
                    const hasAmount = record.total_amount > 0 || record.amount > 0;
                    const reminderDays = hasAmount ? 7 : 3; // 有金额7天，无金额3天
                    
                    // 未到期的订单：提前催单
                    if (daysUntilExpiry >= 0 && daysUntilExpiry <= reminderDays) {
                      return (
                        <Tag color="red" icon={<ExclamationCircleOutlined />}>
                          建议催单({daysUntilExpiry}天到期)
                        </Tag>
                      );
                    }
                    
                    // 已过期的订单：过期1个月内也建议催单
                    if (daysUntilExpiry < 0) {
                      const daysOverdue = Math.abs(daysUntilExpiry);
                      if (daysOverdue <= 30) { // 过期30天内
                        return (
                          <Tag color="orange" icon={<ExclamationCircleOutlined />}>
                            建议催单(已过期{daysOverdue}天)
                          </Tag>
                        );
                      }
                    }
                  }
                }
                return <Tag color="default">无需催单</Tag>;
              },
            },
            {
              title: '操作',
              key: 'action',
              width: 120,
              render: (_, record) => {
                // 判断是否是一级销售自己的订单（通过sales_code判断）
                const isOwnOrder = record.sales_code === primarySalesStats?.sales_code;
                const isActiveOrder = record.status === 'confirmed_config' || record.status === 'active';
                
                if (isActiveOrder) {
                  if (isOwnOrder) {
                    return (
                      <Button 
                        type="primary"
                        size="small"
                        icon={<BellOutlined />}
                        onClick={() => handleUrgeOrder(record)}
                        disabled={record.is_reminded}
                      >
                        {record.is_reminded ? '已催单' : '催单'}
                      </Button>
                    );
                  } else {
                    // 二级销售的订单，一级只能查看
                    return (
                      <Tooltip title="二级销售的订单由对应销售员自行催单">
                        <Button 
                          type="default"
                          size="small"
                          disabled
                          ghost
                        >
                          仅查看
                        </Button>
                      </Tooltip>
                    );
                  }
                } else {
                  return <span style={{ color: '#ccc' }}>无需催单</span>;
                }
              },
            },
          ]}
          dataSource={primarySalesStats?.filteredReminderOrders || primarySalesStats?.pendingReminderOrders || []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['5', '10', '20', '50']
          }}
        />
      </Card>

          {/* 佣金率设置模态框 */}
      <Modal
        title="设置佣金率"
        open={commissionModalVisible}
        onOk={handleCommissionSubmit}
        onCancel={() => {
          setCommissionModalVisible(false);
          commissionForm.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={commissionForm} layout="vertical">
          <Form.Item
            label="二级销售微信号"
          >
            <Input 
              value={selectedSecondarySales?.wechat_name} 
              disabled 
            />
          </Form.Item>
          <Form.Item
            name="commission_rate"
            label="佣金率 (%)"
            rules={[
              { required: true, message: '请输入佣金率' },
              { type: 'number', min: 0, max: 100, message: '佣金率必须在0-100%之间' }
            ]}
          >
            <InputNumber 
              min={0} 
              max={100} 
              precision={2}
              placeholder="请输入佣金率" 
              style={{ width: '100%' }}
              formatter={value => `${value}`}
              parser={value => value?.replace('%', '')}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 移除确认模态框 */}
      <Modal
        title="确认移除"
        open={removeModalVisible}
        onOk={handleRemoveConfirm}
        onCancel={() => setRemoveModalVisible(false)}
        okText="确定移除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>
          确定要移除二级销售 <strong>{selectedSecondarySales?.wechat_name}</strong> 吗？
        </p>
        <p style={{ color: '#ff4d4f' }}>
          <ExclamationCircleOutlined /> 移除后将无法恢复，该二级销售的所有订单将转为直接销售。
        </p>
      </Modal>
      
      {/* 催单功能区域 */}
      {salesData && primarySalesStats?.pendingReminderCount > 0 && (
        <ReminderSection
          reminderOrders={primarySalesStats?.reminderOrders || []}
          reminderCount={primarySalesStats?.pendingReminderCount || 0}
          primarySalesCode={salesData?.sales_code}
          onRefresh={handleRefresh}
        />
      )}
        </>
      )}
    </div>
  );
};

export default PrimarySalesSettlementPage; 