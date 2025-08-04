import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Table, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  Tag,
  message,
  Alert,
  Divider,
  DatePicker
} from 'antd';
import { 
  SearchOutlined,
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SalesReconciliationPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reminderOrders, setReminderOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    totalCommission: 0,
    pendingReminderCount: 0
  });

  const handleSearch = async (values) => {
    if (!values.wechat_name && !values.link_code && !values.payment_date_range) {
      message.error('请输入微信号、链接代码或选择付款时间');
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用 - 实际项目中需要替换为真实API
      const mockData = {
        sales: {
          wechat_name: values.wechat_name || '二级销售示例',
          link_code: values.link_code || 'secondary_demo',
          total_orders: 15,
          total_amount: 12580,
          total_commission: 3774, // 返佣金额 = 订单金额 * 30%
          commission_rate: 0.30
        },
        orders: [
          {
            id: 1,
            tradingview_username: 'demo_user_001',
            customer_wechat: 'customer_demo_001',
            duration: '1month',
            amount: 188,
            commission: 56.4, // 188 * 30%
            payment_time: '2025-01-27 10:00:00',
            status: 'confirmed_configuration',
            config_confirmed: true,
            expiry_time: '2025-02-28 10:00:00'
          },
          {
            id: 2,
            tradingview_username: 'demo_user_002',
            customer_wechat: 'customer_demo_002',
            duration: '3months',
            amount: 488,
            commission: 146.4, // 488 * 30%
            payment_time: '2025-01-26 15:30:00',
            status: 'confirmed_configuration',
            config_confirmed: true,
            expiry_time: '2025-04-27 15:30:00'
          },
          {
            id: 3,
            tradingview_username: 'user003',
            customer_wechat: 'customer003',
            duration: '6months',
            amount: 688,
            commission: 206.4, // 688 * 30%
            payment_time: '2025-01-25 09:15:00',
            status: 'confirmed_configuration',
            config_confirmed: true,
            expiry_time: '2025-07-26 09:15:00'
          },
          {
            id: 6,
            tradingview_username: 'user006',
            customer_wechat: 'customer006',
            duration: '1month',
            amount: 188,
            commission: 56.4,
            payment_time: '2025-01-24 16:30:00',
            status: 'pending_config',
            config_confirmed: false,
            expiry_time: '2025-02-25 16:30:00'
          }
        ],
        reminderOrders: [
          {
            id: 4,
            tradingview_username: 'user004',
            customer_wechat: 'customer004',
            duration: '1month',
            amount: 188,
            commission: 56.4, // 188 * 30%
            payment_time: '2025-01-20 14:20:00',
            status: 'confirmed_configuration',
            config_confirmed: true,
            expiry_time: '2025-02-21 14:20:00',
            daysUntilExpiry: 5
          },
          {
            id: 5,
            tradingview_username: 'user005',
            customer_wechat: 'customer005',
            duration: '3months',
            amount: 488,
            commission: 146.4, // 488 * 30%
            payment_time: '2025-01-15 11:45:00',
            status: 'confirmed_configuration',
            config_confirmed: true,
            expiry_time: '2025-02-16 11:45:00',
            daysUntilExpiry: 2
          }
        ]
      };

      // 只显示配置确认的订单
      const confirmedOrders = mockData.orders.filter(order => order.config_confirmed === true);
      const confirmedReminderOrders = mockData.reminderOrders.filter(order => order.config_confirmed === true);
      
      // 重新计算统计数据（仅计入配置确认的订单）
      const confirmedStats = {
        totalOrders: confirmedOrders.length,
        totalAmount: confirmedOrders.reduce((sum, order) => sum + order.amount, 0),
        totalCommission: confirmedOrders.reduce((sum, order) => sum + order.commission, 0),
        pendingReminderCount: confirmedReminderOrders.length
      };

      // 销售基本信息（包括返佣比例）不受配置确认状态影响，保持原值
      setSalesData(mockData.sales);
      // 订单列表仅显示配置确认的订单
      setOrders(confirmedOrders);
      setReminderOrders(confirmedReminderOrders);
      // 统计数据仅计入配置确认的订单
      setStats(confirmedStats);

      message.success('查询成功');
    } catch (error) {
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setSalesData(null);
    setOrders([]);
    setReminderOrders([]);
    setStats({
      totalOrders: 0,
      totalAmount: 0,
      totalCommission: 0,
      pendingReminderCount: 0
    });
  };

  // 订单列表列定义
  const orderColumns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户微信号',
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
      title: '购买时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration) => {
        const durationMap = {
          '7days': '7天免费',
          '1month': '1个月',
          '3months': '3个月',
          '6months': '6个月',
          'lifetime': '终身'
        };
        return durationMap[duration] || duration;
      }
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => `$${amount.toFixed(2)}`,
    },
    {
      title: '返佣金额',
      dataIndex: 'commission',
      key: 'commission',
      width: 100,
      render: (commission) => `$${commission.toFixed(2)}`,
    },
    {
      title: '付款时间',
      dataIndex: 'payment_time',
      key: 'payment_time',
      width: 150,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '到期时间',
      dataIndex: 'expiry_time',
      key: 'expiry_time',
      width: 150,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
                  'pending_payment': { text: '待付款确认', color: 'processing' },
        'pending_config': { text: '待配置确认', color: 'warning' },
          'confirmed_payment': { text: '已付款确认', color: 'success' },
          'confirmed_configuration': { text: '已配置确认', color: 'success' },
          'rejected': { text: '已拒绝', color: 'error' }
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    }
  ];

  // 待催单客户列表列定义
  const reminderColumns = [
    ...orderColumns,
    {
      title: '剩余天数',
      dataIndex: 'daysUntilExpiry',
      key: 'daysUntilExpiry',
      width: 100,
      render: (days) => {
        if (days <= 0) {
          return <Tag color="error">已过期</Tag>;
        } else if (days <= 3) {
          return <Tag color="warning">{days}天</Tag>;
        } else {
          return <Tag color="processing">{days}天</Tag>;
        }
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          icon={<ExclamationCircleOutlined />}
          tabIndex={0}
          onClick={() => message.success(`已同${record.customer_wechat}用户完成催单`)}
        >
          催单
        </Button>
      )
    }
  ];

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <Title level={2} style={{ 
          textAlign: 'center', 
          marginBottom: '32px',
          color: '#2c3e50'
        }}>
          销售对账页面
        </Title>

        {/* 搜索表单 */}
        <Card title="查询销售信息" style={{ marginBottom: 24 }} role="region">
          <Form form={form} layout="inline" onFinish={handleSearch} >
            <Form.Item name="wechat_name" label="微信号" >
              <Input 
                placeholder="请输入微信号" 
                style={{ width: 200 }}
                allowClear
                aria-label="请输入微信号"
              />
            </Form.Item>
            <Form.Item name="link_code" label="链接代码" >
              <Input 
                placeholder="请输入链接代码" 
                style={{ width: 200 }}
                allowClear
                aria-label="请输入链接代码"
              />
            </Form.Item>
            <Form.Item name="payment_date_range" label="付款时间" >
              <DatePicker.RangePicker 
                style={{ width: 240 }}
                placeholder={['开始时间', '结束时间']}
                format="YYYY-MM-DD"
                aria-label="选择付款时间范围"
              />
            </Form.Item>
            <Form.Item >
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SearchOutlined />}
                  tabIndex={0}
                >
                  查询
                </Button>
                <Button onClick={handleReset} tabIndex={0}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* 销售信息显示 */}
        {salesData && (
          <>
            {/* 订单统计信息 */}
            <Card title="订单统计信息" style={{ marginBottom: 24 }} role="region">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="总订单数"
                    value={stats.totalOrders}
                    prefix={<ShoppingCartOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="总订单金额"
                    value={stats.totalAmount}
                    prefix={<DollarOutlined />}
                    suffix="美元"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="返佣金额"
                    value={stats.totalCommission}
                    prefix={<DollarOutlined />}
                    suffix="美元"
                    precision={2}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="返佣比例"
                    value={salesData.commission_rate * 100}
                    suffix="%"
                    precision={0}
                  />
                </Col>
              </Row>

            </Card>

            {/* 订单列表 */}
            <Card title="订单列表" style={{ marginBottom: 24 }} role="region">
              <Table
                columns={orderColumns}
                dataSource={orders}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }}
                scroll={{ x: 1000 }}
              />
            </Card>

            {/* 待催单客户统计 */}
            {stats.pendingReminderCount > 0 && (
              <Card title="待催单客户统计" style={{ marginBottom: 24 }} role="region">
                <Alert
                  message={`有 ${stats.pendingReminderCount} 个客户需要催单`}
                  description="以下客户的服务即将到期或已过期，建议及时联系"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Statistic
                  title="待催单客户数"
                  value={stats.pendingReminderCount}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            )}

            {/* 待催单客户订单列表 */}
            {stats.pendingReminderCount > 0 && (
              <Card title="待催单客户订单列表" role="region">
                <Table
                  columns={reminderColumns}
                  dataSource={reminderOrders}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                  }}
                  scroll={{ x: 1100 }}
                />
              </Card>
            )}
          </>
        )}

        {/* 初始提示 */}
        {!salesData && (
          <Card role="region">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
              <Text type="secondary" style={{ fontSize: '16px' }}>
                请输入微信号或链接代码查询销售信息
              </Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SalesReconciliationPage; 