import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, Select, message, Tag, Space, Tooltip, Typography, InputNumber, DatePicker } from 'antd';
import { DollarOutlined, UserOutlined, ShoppingCartOutlined, TeamOutlined, ExclamationCircleOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPrimarySalesStats, fetchPrimarySalesOrders, updateSecondarySalesCommission, removeSecondarySales, getPrimarySalesSettlement } from '../store/slices/salesSlice';
import { 
  formatCommissionRate,
  percentToDecimal,
  decimalToPercent,
  calculatePrimaryCommissionRate
} from '../utils/commissionUtils';

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
  const [commissionForm] = Form.useForm();
  const [removeForm] = Form.useForm();
  const [secondarySalesSearchForm] = Form.useForm();
  const [ordersSearchForm] = Form.useForm();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 保存上次查询参数
  const lastSearchParams = useRef(null);
  
  // 自动刷新（每30秒）
  useEffect(() => {
    if (salesData && lastSearchParams.current) {
      const interval = setInterval(() => {
        handleRefresh();
      }, 30000); // 30秒自动刷新
      
      return () => clearInterval(interval);
    }
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

      // 构建统计数据
      const statsData = {
        totalCommission: stats?.totalCommission || 0,
        monthlyCommission: stats?.monthCommission || 0, // 🚀 使用后端计算的本月佣金
        todayCommission: stats?.todayCommission || 0, // 🚀 当日佣金
        totalOrders: stats?.totalOrders || 0,
        monthlyOrders: stats?.monthOrders || 0, // 🚀 使用后端计算的本月订单数
        todayOrders: stats?.todayOrders || 0, // 🚀 当日订单数
        secondarySales: secondarySales || [],
        pendingReminderCount: stats?.pendingReminderCount || 0,
        monthlyReminderCount: stats?.pendingReminderCount || 0,
        reminderSuccessRate: 85.0, // 默认值
        avgResponseTime: 2.5, // 默认值
        pendingReminderOrders: reminderOrders || [],
        currentCommissionRate: stats?.currentCommissionRate || 0.4 // 🚀 使用后端动态计算的佣金率
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
              value={primarySalesStats?.totalCommission || 0}
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
              value={primarySalesStats?.monthlyCommission || 0}
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
              value={primarySalesStats?.todayCommission || 0}
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
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable
            style={{ 
              height: '100%',
              borderLeft: '4px solid #52c41a'
            }}
          >
            <Statistic
              title="综合佣金率"
              value={(() => {
                // 🚀 使用后端动态计算的佣金率
                // 优先使用统计数据中的当前佣金率，其次使用销售数据中的佣金率
                const rate = primarySalesStats?.currentCommissionRate || salesData?.commission_rate || 0.4;
                return (rate * 100).toFixed(1);
              })()}
              valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
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
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable
            style={{ 
              height: '100%',
              borderLeft: '4px solid #1890ff'
            }}
          >
            <Statistic
              title="总订单数"
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
      dataIndex: 'sales_wechat_name',
      key: 'sales_wechat_name',
      width: 120,
      render: (wechat, record) => {
        // 🔧 修复：显示销售微信号
        // 从订单的关联数据中获取销售微信号
        if (record.sales_wechat_name) {
          // 如果是二级销售订单，显示二级销售微信号
          return <Tag color="blue">{record.sales_wechat_name}</Tag>;
        } else if (record.sales_code) {
          // 如果有销售代码但没有微信号，查找对应的销售信息
          const secondarySale = primarySalesStats?.secondarySales?.find(s => s.sales_code === record.sales_code);
          if (secondarySale) {
            return <Tag color="blue">{secondarySale.wechat_name || '二级销售'}</Tag>;
          }
          // 如果是一级销售自己的订单，显示"直接销售"
          return <Tag color="green">直接销售</Tag>;
        }
        return <Tag color="default">-</Tag>;
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

  // 二级销售列表表格列定义
  const secondarySalesColumns = [
    {
      title: '微信号',
      dataIndex: 'wechat_name',
      key: 'wechat_name',
      width: 120,
    },
    {
      title: '收款方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (method) => {
        const methodMap = {
          'alipay': '支付宝',
          'wechat': '微信',
          'crypto': '加密货币'
        };
        return methodMap[method] || method || '-';
      }
    },
    {
      title: '总订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount) => {
        const value = parseFloat(amount || 0);
        return `$${value.toFixed(2)}`;
      }
    },
    {
      title: '当前佣金率',
      dataIndex: 'commission_rate',
      key: 'commission_rate',
      width: 100,
      render: (rate) => {
        // 🔧 修复：区分0和未设置的情况
        if (rate === null || rate === undefined) {
          return <Tag color="orange">未设置</Tag>;
        }
        // 允许显示0%
        return `${(rate * 100).toFixed(1)}%`;
      }
    },
    {
      title: '累计佣金',
      dataIndex: 'total_commission',
      key: 'total_commission',
      width: 100,
      render: (commission) => {
        const value = parseFloat(commission || 0);
        return `$${value.toFixed(2)}`;
      }
    },
    {
      title: '订单数量',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 100,
      render: (count) => count || 0,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => {
        if (!date) return '-';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '-';
        return dateObj.toLocaleString('zh-CN');
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
          <Space size="small">
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
            <Button
              type="link"
              size="small"
              onClick={() => {
                // 在新窗口打开链接
                window.open(purchaseLink, '_blank');
              }}
            >
              查看
            </Button>
          </Space>
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
          
          // TODO: 调用API记录催单状态
          // await salesAPI.recordUrgeOrder(order.id);
          
          message.success(`已记录：已线下联系客户 ${order.customer_wechat}`);
        } catch (error) {
          message.error('记录催单操作失败');
        }
      }
    });
  };

  // 二级销售搜索处理
  const handleSecondarySalesSearch = (values) => {
    if (values.payment_date_range) {
      const [startDate, endDate] = values.payment_date_range;
      message.info(`搜索付款时间: ${startDate.format('YYYY-MM-DD')} 至 ${endDate.format('YYYY-MM-DD')}`);
      // 这里应该调用API进行筛选
    } else {
      // 重置搜索，显示全部数据
      message.info('显示全部二级销售数据');
    }
  };

  // 订单搜索处理
  const handleOrdersSearch = (values) => {
    if (values.payment_date_range) {
      const [startDate, endDate] = values.payment_date_range;
      message.info(`搜索付款时间: ${startDate.format('YYYY-MM-DD')} 至 ${endDate.format('YYYY-MM-DD')}`);
      // 这里应该调用API进行筛选
    } else {
      // 重置搜索，显示全部数据
      message.info('显示全部订单数据');
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
                  <Col xs={24} sm={16} md={12}>
                    <Form.Item name="payment_date_range" label="付款时间" style={{ marginBottom: 0 }}>
                      <DatePicker.RangePicker 
                        style={{ width: '100%' }}
                        placeholder={['开始时间', '结束时间']}
                        format="YYYY-MM-DD"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8} md={12}>
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Space wrap>
                        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                          搜索
                        </Button>
                        <Button onClick={() => {
                          secondarySalesSearchForm.resetFields();
                          handleSecondarySalesSearch({});
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
          dataSource={primarySalesStats?.secondarySales || []}
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
              <Col xs={24} sm={16} md={12}>
                <Form.Item name="payment_date_range" label="付款时间" style={{ marginBottom: 0 }}>
                  <DatePicker.RangePicker 
                    style={{ width: '100%' }}
                    placeholder={['开始时间', '结束时间']}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8} md={12}>
                <Form.Item style={{ marginBottom: 0 }}>
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
            showTotal: (total) => `共 ${total} 条记录`,
            current: primarySalesOrders?.page || 1,
            total: primarySalesOrders?.total || 0,
            responsive: true
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

        {/* 待催单客户列表 */}
        <Table
          title={() => "待催单订单列表"}
          columns={[
            {
              title: '销售微信号',
              dataIndex: 'sales_wechat',
              key: 'sales_wechat',
              width: 120,
            },
            {
              title: '客户微信号',
              dataIndex: 'customer_wechat',
              key: 'customer_wechat',
              width: 120,
            },
            {
              title: 'TradingView用户',
              dataIndex: 'tradingview_username',
              key: 'tradingview_username',
              width: 150,
            },
            {
              title: '订单金额',
              dataIndex: 'amount',
              key: 'amount',
              width: 100,
              render: (amount) => {
                const value = parseFloat(amount || 0);
                return `$${value.toFixed(2)}`;
              },
            },
            {
              title: '到期时间',
              dataIndex: 'expiry_time',
              key: 'expiry_time',
              width: 120,
              render: (time) => time ? new Date(time).toLocaleDateString() : '-',
            },
            {
              title: '催单状态',
              dataIndex: 'reminder_status',
              key: 'reminder_status',
              width: 100,
              render: (status) => (
                <Tag color={status ? 'green' : 'orange'}>
                  {status ? '已催单' : '待催单'}
                </Tag>
              ),
            },

          ]}
          dataSource={primarySalesStats?.pendingReminderOrders || []}
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
        </>
      )}
    </div>
  );
};

export default PrimarySalesSettlementPage; 