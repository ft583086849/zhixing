import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  message,
  Statistic,
  Row,
  Col,
  Tooltip,
  Modal,
  Typography
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  WechatOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  BellOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { salesAPI } from '../../services/api';
import ReminderSection from './ReminderSection';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text } = Typography;

const AdminCustomersOptimized = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    expiredCustomers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageOrderValue: 0
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 获取客户数据
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await salesAPI.getCustomers();
      
      if (response.success) {
        const { customers, stats } = response.data;
        setCustomers(customers || []);
        setStats(stats || {
          totalCustomers: 0,
          activeCustomers: 0,
          expiredCustomers: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          averageOrderValue: 0
        });
      } else {
        message.error(response.message || '获取客户数据失败');
      }
    } catch (error) {
      console.error('获取客户数据失败:', error);
      message.error('获取客户数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
    message.success('数据已刷新');
  };

  // 初始加载
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 查看客户详情
  const handleViewDetail = (customer) => {
    setSelectedCustomer(customer);
    setDetailModalVisible(true);
  };

  // 表格列定义
  const columns = [
    {
      title: '客户ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left'
    },
    {
      title: '微信号',
      dataIndex: 'wechat_name',
      key: 'wechat_name',
      width: 150,
      fixed: 'left',
      render: (text) => (
        <Space>
          <WechatOutlined style={{ color: '#52c41a' }} />
          <Text strong>{text || '-'}</Text>
        </Space>
      )
    },
    {
      title: 'TradingView账号',
      dataIndex: 'tradingview_username',
      key: 'tradingview_username',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (text) => text ? (
        <Space>
          <PhoneOutlined />
          {text}
        </Space>
      ) : '-'
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 100,
      align: 'center',
      render: (count) => (
        <Tag color={count > 1 ? 'green' : 'default'}>
          {count || 0} 单
        </Tag>
      )
    },
    {
      title: '总消费',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${(amount || 0).toFixed(2)}
        </Text>
      )
    },
    {
      title: '最近订单',
      dataIndex: 'last_order_time',
      key: 'last_order_time',
      width: 150,
      render: (time) => time ? (
        <Tooltip title={dayjs(time).format('YYYY-MM-DD HH:mm:ss')}>
          {dayjs(time).fromNow()}
        </Tooltip>
      ) : '-'
    },
    {
      title: '服务状态',
      dataIndex: 'service_status',
      key: 'service_status',
      width: 120,
      render: (status, record) => {
        const expiry = record.expiry_time;
        if (!expiry) {
          return <Tag color="default">无服务</Tag>;
        }
        
        const now = dayjs();
        const expiryDate = dayjs(expiry);
        const daysLeft = expiryDate.diff(now, 'day');
        
        if (daysLeft < 0) {
          return (
            <Tag color="error" icon={<ExclamationCircleOutlined />}>
              已过期 {Math.abs(daysLeft)} 天
            </Tag>
          );
        } else if (daysLeft <= 7) {
          return (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              剩余 {daysLeft} 天
            </Tag>
          );
        } else {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              正常 ({daysLeft} 天)
            </Tag>
          );
        }
      }
    },
    {
      title: '销售员',
      dataIndex: 'sales_wechat',
      key: 'sales_wechat',
      width: 120,
      render: (text, record) => {
        if (record.parent_sales_wechat) {
          return (
            <Space direction="vertical" size={0}>
              <Tag color="orange" size="small">二级</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {text || '-'}
              </Text>
            </Space>
          );
        }
        return (
          <Space direction="vertical" size={0}>
            <Tag color="blue" size="small">一级</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {text || '-'}
            </Text>
          </Space>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <UserOutlined /> 客户管理
            </Title>
          </Col>
          <Col>
            <Button 
              icon={<SyncOutlined spin={refreshing} />}
              onClick={handleRefresh}
              loading={refreshing}
            >
              刷新数据
            </Button>
          </Col>
        </Row>

        {/* 统计信息 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card hoverable>
              <Statistic
                title="客户总数"
                value={stats.totalCustomers}
                prefix={<UserOutlined />}
                suffix="人"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card hoverable>
              <Statistic
                title="活跃客户"
                value={stats.activeCustomers}
                prefix={<CheckCircleOutlined />}
                suffix="人"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card hoverable>
              <Statistic
                title="过期客户"
                value={stats.expiredCustomers}
                prefix={<ExclamationCircleOutlined />}
                suffix="人"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card hoverable>
              <Statistic
                title="总收入"
                value={stats.totalRevenue}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card hoverable>
              <Statistic
                title="月收入"
                value={stats.monthlyRevenue}
                prefix={<DollarOutlined />}
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card hoverable>
              <Statistic
                title="客单价"
                value={stats.averageOrderValue}
                prefix={<DollarOutlined />}
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        {/* 催单提醒模块 */}
        <ReminderSection customers={customers} onRefresh={fetchCustomers} />

        {/* 客户列表 */}
        <Card title="客户列表" style={{ marginTop: 24 }}>
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1500 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </Card>
      </Card>

      {/* 客户详情弹窗 */}
      <Modal
        title="客户详情"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCustomer && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">客户ID：</Text>
                <Text strong>{selectedCustomer.id}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">微信号：</Text>
                <Text strong>{selectedCustomer.wechat_name || '-'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">TradingView：</Text>
                <Text strong>{selectedCustomer.tradingview_username || '-'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">手机号：</Text>
                <Text strong>{selectedCustomer.phone || '-'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">订单数量：</Text>
                <Text strong>{selectedCustomer.order_count || 0} 单</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">总消费：</Text>
                <Text strong>${(selectedCustomer.total_amount || 0).toFixed(2)}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">注册时间：</Text>
                <Text strong>
                  {selectedCustomer.created_at ? 
                    dayjs(selectedCustomer.created_at).format('YYYY-MM-DD HH:mm') : 
                    '-'
                  }
                </Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">到期时间：</Text>
                <Text strong>
                  {selectedCustomer.expiry_time ? 
                    dayjs(selectedCustomer.expiry_time).format('YYYY-MM-DD HH:mm') : 
                    '-'
                  }
                </Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCustomersOptimized;