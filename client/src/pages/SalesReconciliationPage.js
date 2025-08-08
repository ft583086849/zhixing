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
import { salesAPI } from '../services/api';

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
    if (!values.wechat_name && !values.payment_date_range) {
      message.error('请输入微信号或选择付款时间');
      return;
    }

    setLoading(true);
    try {
      // 构建查询参数
      const params = {};
      
      if (values.wechat_name) {
        params.wechat_name = values.wechat_name;
      }
      
      if (values.payment_date_range && values.payment_date_range.length === 2) {
        const [startDate, endDate] = values.payment_date_range;
        params.payment_date_range = `${startDate.format('YYYY-MM-DD')},${endDate.format('YYYY-MM-DD')}`;
      }

      // 调用真实API
      const response = await salesAPI.getSecondarySalesSettlement(params);
      
      if (response.success) {
        const { sales, orders, reminderOrders, stats } = response.data;
        
        setSalesData(sales);
        setOrders(orders);
        setReminderOrders(reminderOrders);
        setStats(stats);
        
        message.success('对账信息查询成功');
      } else {
        message.error(response.message || '查询失败');
      }
    } catch (error) {
      console.error('查询失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '查询失败，请重试';
      message.error(errorMessage);
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
      dataIndex: 'commission_amount',
      key: 'commission_amount',
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
          'confirmed_config': { text: '已配置确认', color: 'success' },
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
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>订单列表</span>
                  <div style={{ marginLeft: 'auto' }}>
                    <span style={{ marginRight: 8, fontSize: '14px', color: '#666' }}>付款时间:</span>
                    <DatePicker.RangePicker 
                      style={{ width: 240 }}
                      placeholder={['开始时间', '结束时间']}
                      format="YYYY-MM-DD"
                      aria-label="选择付款时间范围"
                      onChange={(dates) => {
                        // 这里可以添加时间过滤逻辑
                        console.log('付款时间范围:', dates);
                      }}
                    />
                  </div>
                </div>
              }
              style={{ marginBottom: 24 }} 
              role="region"
            >
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
                请输入微信号查询销售信息
              </Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SalesReconciliationPage; 