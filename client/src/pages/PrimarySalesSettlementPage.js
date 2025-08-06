import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, Select, message, Tag, Space, Tooltip, Typography, InputNumber, DatePicker } from 'antd';
import { DollarOutlined, UserOutlined, ShoppingCartOutlined, TeamOutlined, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPrimarySalesStats, fetchPrimarySalesOrders, updateSecondarySalesCommission, removeSecondarySales } from '../store/slices/salesSlice';

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

  // 搜索处理函数
  const handleSearch = async (values) => {
    if (!values.wechat_name && !values.sales_code) {
      message.error('请输入微信号或销售代码');
      return;
    }

    try {
      // 模拟查询一级销售数据 - 实际项目中需要替换为真实API
      const mockSalesData = {
        wechat_name: values.wechat_name || '一级销售测试',
        sales_code: values.sales_code || 'primary_test123',
        commission_rate: 0.40,
        total_secondary_sales: 3,
        total_orders: 8,
        total_amount: 4588,
        total_commission: 1835.2 // 40%佣金
      };

      const mockStats = {
        totalCommission: 1835.2,
        monthlyCommission: 756.8,
        totalOrders: 8,
        monthlyOrders: 3,
        secondarySales: [
          {
            id: 1,
            wechat_name: '二级销售1',
            link_code: 'sec001',
            commission_rate: 0.30,
            total_orders: 3,
            order_count: 3,
            total_amount: 1364,
            commission_earned: 409.2,
            total_commission: 409.2,
            payment_method: 'alipay',
            created_at: '2025-01-10'
          },
          {
            id: 2,
            wechat_name: '二级销售2', 
            link_code: 'sec002',
            commission_rate: 0.32,
            total_orders: 2,
            order_count: 2,
            total_amount: 876,
            commission_earned: 280.32,
            total_commission: 280.32,
            payment_method: 'wechat',
            created_at: '2025-01-12'
          },
          {
            id: 3,
            wechat_name: '二级销售3', 
            link_code: 'sec003',
            commission_rate: 0.28,
            total_orders: 3,
            order_count: 3,
            total_amount: 1348,
            commission_earned: 377.44,
            total_commission: 377.44,
            payment_method: 'crypto',
            created_at: '2025-01-15'
          }
        ],
        pendingReminderCount: 2,
        monthlyReminderCount: 5,
        reminderSuccessRate: 78.5,
        avgResponseTime: 3.2,
        pendingReminderOrders: [
          {
            id: 1,
            sales_wechat: '二级销售1',
            customer_wechat: 'customer001',
            tradingview_username: 'user001',
            amount: 188,
            expiry_time: '2025-02-28',
            reminder_status: false
          }
        ]
      };

      const mockOrders = {
        data: [
          {
            id: 1,
            customer_wechat: 'customer001',
            tradingview_username: 'user001',
            duration: '1month',
            amount: 188,
            commission_amount: 56.4,
            status: 'confirmed',
            config_confirmed: true,
            secondary_sales_name: '二级销售1',
            payment_method: 'alipay',
            order_count: 1,
            created_at: '2025-01-10 14:30:00'
          },
          {
            id: 2,
            customer_wechat: 'customer002',
            tradingview_username: 'user002',
            duration: '3months',
            amount: 488,
            commission_amount: 156.16,
            status: 'pending_config',
            config_confirmed: false,
            secondary_sales_name: '二级销售2',
            payment_method: 'crypto',
            order_count: 1,
            created_at: '2025-01-12 09:15:00'
          },
          {
            id: 3,
            customer_wechat: 'customer003',
            tradingview_username: 'user003',
            duration: '1month',
            amount: 188,
            commission_amount: 52.64,
            status: 'confirmed',
            config_confirmed: true,
            secondary_sales_name: '二级销售3',
            payment_method: 'wechat',
            order_count: 1,
            created_at: '2025-01-15 16:45:00'
          }
        ],
        total: 8,
        page: 1
      };

      // 显示所有订单（移除配置确认过滤）
      const confirmedOrders = mockOrders.data;
      const filteredOrdersData = {
        ...mockOrders,
        data: confirmedOrders,
        total: confirmedOrders.length
      };
      
      // 重新计算二级销售统计（仅计入配置确认的订单）
      const updatedSecondarySales = mockStats.secondarySales.map(sales => {
        // 仅计算该二级销售配置确认的订单
        const confirmedOrdersForSales = confirmedOrders.filter(order => 
          order.secondary_sales_name === sales.wechat_name
        );
        
        const confirmedOrderCount = confirmedOrdersForSales.length;
        const confirmedTotalAmount = confirmedOrdersForSales.reduce((sum, order) => sum + order.amount, 0);
        const confirmedCommission = confirmedOrdersForSales.reduce((sum, order) => sum + order.commission_amount, 0);
        
        return {
          ...sales,
          // 业绩数据仅计入配置确认的订单
          order_count: confirmedOrderCount,
          total_orders: confirmedOrderCount,
          total_amount: confirmedTotalAmount,
          commission_earned: confirmedCommission,
          total_commission: confirmedCommission,
          // 佣金比率不受配置确认状态影响，保持原值
          commission_rate: sales.commission_rate
        };
      });

      // 计算总订单数：名下销售订单数 + 自己销售订单数
      const secondarySalesTotalOrders = updatedSecondarySales.reduce((sum, sales) => sum + sales.order_count, 0);
      const primarySalesOwnOrders = confirmedOrders.filter(order => !order.secondary_sales_name).length;
      const calculatedTotalOrders = secondarySalesTotalOrders + primarySalesOwnOrders;

      const updatedStatsData = {
        ...mockStats,
        // 二级销售数量不受配置确认状态影响，保持原值
        total_secondary_sales: mockSalesData.total_secondary_sales,
        // 重新计算总订单数
        totalOrders: calculatedTotalOrders,
        secondarySales: updatedSecondarySales
      };

      setSalesData(mockSalesData);
      setPrimarySalesStats(updatedStatsData);
      setPrimarySalesOrders(filteredOrdersData);
      
      message.success('查询成功');
    } catch (error) {
      message.error('查询失败');
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
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={4}>
        <Card>
          <Statistic
            title="总佣金收入"
            value={primarySalesStats?.totalCommission || 0}
            precision={2}
            valueStyle={{ color: '#3f8600' }}
            prefix={<DollarOutlined />}
            suffix="元"
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card>
          <Statistic
            title="本月佣金"
            value={primarySalesStats?.monthlyCommission || 0}
            precision={2}
            valueStyle={{ color: '#1890ff' }}
            prefix={<DollarOutlined />}
            suffix="元"
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card>
          <Statistic
            title="佣金比率"
            value={(() => {
              // 新的佣金比率计算逻辑：
              // 佣金比率 = （（一级销售的用户下单金额*40%）+（二级销售订单总金额-二级销售分佣比率平均值*二级销售订单总金额））/（二级销售订单总金额+一级销售的用户下单金额）
              
              if (!primarySalesOrders?.data || primarySalesOrders.data.length === 0) {
                return 40; // 没有订单时，显示40%
              }
              
              // 获取所有订单（移除配置确认过滤）
              const confirmedOrders = primarySalesOrders.data;
              
              if (confirmedOrders.length === 0) {
                return 40; // 没有配置确认的订单时，显示40%
              }
              
              // 1. 计算一级销售的用户下单金额（没有secondary_sales_name的订单）
              const primaryDirectOrders = confirmedOrders.filter(order => !order.secondary_sales_name);
              const primaryDirectAmount = primaryDirectOrders.reduce((sum, order) => sum + order.amount, 0);
              
              // 2. 计算二级销售订单总金额
              const secondaryOrders = confirmedOrders.filter(order => order.secondary_sales_name);
              const secondaryTotalAmount = secondaryOrders.reduce((sum, order) => sum + order.amount, 0);
              
              // 3. 计算二级销售分佣比率平均值
              let averageSecondaryRate = 0;
              if (primarySalesStats?.secondarySales && primarySalesStats.secondarySales.length > 0) {
                const secondaryRates = primarySalesStats.secondarySales.map(sales => sales.commission_rate);
                averageSecondaryRate = secondaryRates.reduce((sum, rate) => sum + rate, 0) / secondaryRates.length;
              }
              
              // 4. 计算总订单金额
              const totalOrderAmount = primaryDirectAmount + secondaryTotalAmount;
              
              if (totalOrderAmount === 0) {
                return 40; // 总金额为0时，显示40%
              }
              
              // 5. 计算一级销售总佣金
              const primaryDirectCommission = primaryDirectAmount * 0.40; // 一级销售直接用户佣金：40%
              const primaryFromSecondaryCommission = secondaryTotalAmount * ((40 - averageSecondaryRate * 100) / 100); // 一级销售从二级销售获得的佣金：(40%-二级销售平均佣金率)
              const totalPrimaryCommission = primaryDirectCommission + primaryFromSecondaryCommission;
              
              // 6. 计算一级销售佣金比率
              const primaryCommissionRate = (totalPrimaryCommission / totalOrderAmount) * 100;
              
              return primaryCommissionRate.toFixed(1);
            })()}
            valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: 'bold' }}
            prefix={<DollarOutlined />}
            suffix="%"
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="二级销售数量"
            value={primarySalesStats?.secondarySales?.length || 0}
            valueStyle={{ color: '#722ed1' }}
            prefix={<TeamOutlined />}
            suffix="人"
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="总订单数"
            value={primarySalesStats?.totalOrders || 0}
            valueStyle={{ color: '#fa8c16' }}
            prefix={<ShoppingCartOutlined />}
            suffix="单"
          />
        </Card>
      </Col>
    </Row>
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
      title: '二级销售',
      dataIndex: 'secondary_sales_name',
      key: 'secondary_sales_name',
      width: 120,
      render: (name) => name || '直接销售'
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
          'pending_config': { text: '待配置确认', color: 'purple' },
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
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary"
            size="small"
            onClick={() => handleUrgeOrder(record)}
            disabled={record.status === 'cancelled' || record.status === 'refunded'}
          >
            催单
          </Button>
        </Space>
      )
    }
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
      render: (rate) => `${(rate * 100).toFixed(1)}%`
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
    commissionForm.setFieldsValue({
      commission_rate: secondarySales.commission_rate * 100
    });
    setCommissionModalVisible(true);
  };

  // 提交佣金率更新
  const handleCommissionSubmit = async () => {
    try {
      const values = await commissionForm.validateFields();
      const commissionRate = values.commission_rate / 100;
      
      // 模拟更新本地数据
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

  // 处理催单
  const handleUrgeOrder = (order) => {
    Modal.confirm({
      title: '确认催单',
      content: `确定要向客户 ${order.customer_wechat} 发送催单提醒吗？`,
      onOk: async () => {
        try {
          // 这里需要调用催单API
          message.success('催单提醒已发送');
        } catch (error) {
          message.error('催单失败');
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
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>一级销售分销管理和对账</Title>
      
      {/* 搜索查询功能 */}
      <Card title="查询一级销售信息" style={{ marginBottom: 24 }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="wechat_name" label="微信号">
            <Input 
              placeholder="请输入微信号" 
              style={{ width: 200 }}
              allowClear
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item name="sales_code" label="销售代码">
            <Input 
              placeholder="请输入销售代码" 
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<SearchOutlined />}
              >
                查询
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
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
          
          {/* 统计卡片 */}
          {renderStatsCards()}

          {/* 二级销售管理 */}
          <Card title="二级销售管理" style={{ marginBottom: 24 }}>
            {/* 二级销售搜索 */}
            <div style={{ marginBottom: 16, padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
              <Form form={secondarySalesSearchForm} layout="inline" onFinish={handleSecondarySalesSearch}>
                <Form.Item name="payment_date_range" label="付款时间">
                  <DatePicker.RangePicker 
                    style={{ width: 240 }}
                    placeholder={['开始时间', '结束时间']}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
                <Form.Item>
                  <Space>
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
              </Form>
            </div>
        <Table
          columns={secondarySalesColumns}
          dataSource={primarySalesStats?.secondarySales || []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 订单列表 */}
      <Card title="我的订单列表" style={{ marginBottom: 24 }}>
        {/* 订单搜索 */}
        <div style={{ marginBottom: 16, padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
          <Form form={ordersSearchForm} layout="inline" onFinish={handleOrdersSearch}>
            <Form.Item name="payment_date_range" label="付款时间">
              <DatePicker.RangePicker 
                style={{ width: 240 }}
                placeholder={['开始时间', '结束时间']}
                format="YYYY-MM-DD"
              />
            </Form.Item>
            <Form.Item>
              <Space>
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
          </Form>
        </div>
        <Table
          columns={orderColumns}
          dataSource={primarySalesOrders?.data || []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            current: primarySalesOrders?.page || 1,
            total: primarySalesOrders?.total || 0
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