import React, { useState, useEffect, useRef } from 'react';
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
  DatePicker,
  Tooltip,
  Select
} from 'antd';
import { 
  SearchOutlined,
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { salesAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

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
    monthCommission: 0,
    todayCommission: 0,
    pendingReminderCount: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [amountFilter, setAmountFilter] = useState([]); // 订单金额筛选
  const [filteredOrders, setFilteredOrders] = useState([]); // 筛选后的订单
  
  // 保存上次查询参数
  const lastSearchParams = useRef(null);
  
  // 处理订单金额筛选
  useEffect(() => {
    if (!orders || orders.length === 0) {
      setFilteredOrders([]);
      return;
    }
    
    // 如果没有选择金额筛选，显示所有订单
    if (!amountFilter || amountFilter.length === 0) {
      setFilteredOrders(orders);
      return;
    }
    
    // 筛选订单
    const filtered = orders.filter(order => {
      // 将筛选值转为数字进行比较
      const filterValues = amountFilter.map(v => Number(v));
      return filterValues.includes(Number(order.amount));
    });
    
    setFilteredOrders(filtered);
  }, [orders, amountFilter]);
  
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
      const response = await salesAPI.getSecondarySalesSettlement(lastSearchParams.current);
      
      if (response.success && response.data) {
        const { sales, orders, reminderOrders, stats } = response.data;
        
        setSalesData(sales);
        setOrders(orders || []);
        setReminderOrders(reminderOrders || []);
        setStats({
          totalOrders: stats?.totalOrders || 0,
          totalAmount: stats?.totalAmount || 0,
          totalCommission: stats?.totalCommission || 0,
          monthCommission: stats?.monthCommission || 0,
          todayCommission: stats?.todayCommission || 0,
          pendingReminderCount: stats?.pendingReminderCount || 0
        });
        
        message.success('数据已刷新');
      }
    } catch (error) {
      console.error('刷新失败:', error);
      message.error('数据刷新失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = async (values) => {
    if (!values.wechat_name) {
      message.error('请输入微信号');
      return;
    }

    setLoading(true);
    try {
      // 构建查询参数
      const params = {};
      
      if (values.wechat_name) {
        params.wechat_name = values.wechat_name;
      }
      
      // 添加付款时间范围参数
      if (values.payment_date && values.payment_date.length === 2) {
        params.start_date = values.payment_date[0].format('YYYY-MM-DD');
        params.end_date = values.payment_date[1].format('YYYY-MM-DD');
      }
      
      // 保存查询参数供刷新使用
      lastSearchParams.current = params;

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
    setFilteredOrders([]);
    setReminderOrders([]);
    setAmountFilter([]);
    setStats({
      totalOrders: 0,
      totalAmount: 0,
      totalCommission: 0,
      monthCommission: 0,
      todayCommission: 0,
      pendingReminderCount: 0
    });
  };

  // 处理催单操作（记录线下已联系用户）
  const handleUrgeOrder = async (order) => {
    try {
      // 调用API更新催单状态
      const response = await salesAPI.updateOrderReminderStatus(order.id, true);
      
      if (response.success) {
        // 显示成功消息
        message.success({
          content: `已记录：已线下联系用户 ${order.customer_wechat}`,
          duration: 3
        });
        
        // 刷新数据以更新催单状态
        handleRefresh();
      } else {
        message.error(response.message || '记录催单操作失败');
      }
    } catch (error) {
      console.error('记录催单失败:', error);
      message.error('记录催单操作失败');
    }
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
      render: (time) => {
        if (!time) return '-';
        const expiry = dayjs(time);
        const now = dayjs();
        const daysLeft = expiry.diff(now, 'day');
        
        // 根据剩余天数显示不同颜色
        let color = 'default';
        if (daysLeft <= 0) {
          color = 'error';
        } else if (daysLeft <= 7) {
          color = 'warning';
        }
        
        return (
          <Space direction="vertical" size={0}>
            <span>{expiry.format('YYYY-MM-DD')}</span>
            {daysLeft <= 7 && (
              <Tag color={color} style={{ fontSize: '12px' }}>
                {daysLeft <= 0 ? '已过期' : `剩余${daysLeft}天`}
              </Tag>
            )}
          </Space>
        );
      }
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
    },
  ];

  // 待催单客户列表列定义（统一客户管理页面逻辑）
  const reminderColumns = [
    ...orderColumns.filter(col => col.key !== 'action'), // 移除原有的操作列
    {
      title: '催单建议',
      key: 'reminder_suggestion',
      width: 150,
      render: (_, record) => {
        if (record.expiry_time) {
          const daysUntilExpiry = record.daysUntilExpiry;
          
          // 判断是否有金额（与客户管理页面逻辑一致）
          const hasAmount = (record.total_amount || record.amount || 0) > 0;
          const reminderDays = hasAmount ? 7 : 3; // 有金额7天，无金额3天
          
          // 未过期的催单
          if (daysUntilExpiry >= 0 && daysUntilExpiry <= reminderDays) {
            return (
              <Tag color="red" icon={<ExclamationCircleOutlined />}>
                建议催单({daysUntilExpiry}天)
              </Tag>
            );
          }
          
          // 已过期但在30天内的催单
          if (daysUntilExpiry < 0) {
            const daysOverdue = Math.abs(daysUntilExpiry);
            if (daysOverdue <= 30) {
              return (
                <Tag color="orange" icon={<ExclamationCircleOutlined />}>
                  建议催单(已过期{daysOverdue}天)
                </Tag>
              );
            }
          }
        }
        return <Tag color="default">无需催单</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Tooltip title="请您联系客户咨询是否复购">
          <Button 
            type="primary" 
            size="small"
            danger
            icon={<ExclamationCircleOutlined />}
            tabIndex={0}
            onClick={() => handleUrgeOrder(record)}
          >
            催单
          </Button>
        </Tooltip>
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
          <Form form={form} layout="horizontal" onFinish={handleSearch} >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="wechat_name" label="微信号" style={{ marginBottom: 8 }}>
                  <Input 
                    prefix={<UserOutlined />}
                    placeholder="请输入微信号" 
                    allowClear
                    aria-label="请输入微信号"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item style={{ marginBottom: 8 }}>
                  <Space wrap>
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
                    {salesData && (
                      <Button 
                        icon={<ReloadOutlined />}
                        loading={isRefreshing}
                        onClick={handleRefresh}
                        tabIndex={0}
                      >
                        刷新
                      </Button>
                    )}
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 销售信息显示 */}
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
                <Col xs={24}>
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
              </Row>
            </Card>

            {/* 订单统计信息 - 响应式布局 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable style={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <Statistic
                    title={<span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>总佣金收入</span>}
                    value={stats.totalCommission}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    precision={2}
                    valueStyle={{ color: '#fff', fontSize: '28px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable style={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <Statistic
                    title={<span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>本月佣金</span>}
                    value={stats.monthCommission}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    precision={2}
                    valueStyle={{ color: '#fff', fontSize: '28px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable style={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <Statistic
                    title={<span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>当日佣金</span>}
                    value={stats.todayCommission}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    precision={2}
                    valueStyle={{ color: '#fff', fontSize: '28px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable style={{ height: '100%' }}>
                  <Statistic
                    title="总订单数"
                    value={stats.totalOrders}
                    prefix={<ShoppingCartOutlined />}
                    suffix="单"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable style={{ height: '100%' }}>
                  <Statistic
                    title="总销售额"
                    value={stats.totalAmount}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    precision={2}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable style={{ height: '100%' }}>
                  <Statistic
                    title="佣金比率"
                    value={(salesData.commission_rate * 100) || 25}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 订单列表 */}
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>订单列表</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div>
                      <span style={{ marginRight: 8, fontSize: '14px', color: '#666' }}>付款时间:</span>
                      <DatePicker.RangePicker 
                        style={{ width: 220 }}
                        placeholder={['开始日期', '结束日期']}
                        format="YYYY-MM-DD"
                        allowClear
                      />
                    </div>
                    <div>
                      <span style={{ marginRight: 8, fontSize: '14px', color: '#666' }}>订单金额:</span>
                      <Select 
                        mode="multiple"
                        placeholder="选择订单金额（可多选）" 
                        allowClear
                        style={{ width: 280 }}
                        value={amountFilter}
                        onChange={(values) => {
                          setAmountFilter(values || []);
                        }}
                      >
                        <Option value="0">免费体验（$0）</Option>
                        <Option value="188">一个月（$188）</Option>
                        <Option value="488">三个月（$488）</Option>
                        <Option value="888">六个月（$888）</Option>
                        <Option value="1588">一年（$1588）</Option>
                      </Select>
                    </div>
                  </div>
                </div>
              }
              style={{ marginBottom: 24 }} 
              role="region"
            >
              <Table
                columns={orderColumns}
                dataSource={filteredOrders}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  responsive: true
                }}
                scroll={{ x: 'max-content' }}
              />
            </Card>

            {/* 待催单客户统计 - 总是显示 */}
            <Card title="待催单客户统计" style={{ marginBottom: 24 }} role="region">
              {stats.pendingReminderCount > 0 ? (
                <>
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
                </>
              ) : (
                <>
                  <Alert
                    message="暂无需要催单的客户"
                    description="所有客户的服务状态正常"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Statistic
                    title="待催单客户数"
                    value={0}
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ color: '#d9d9d9' }}
                  />
                </>
              )}
            </Card>

            {/* 待催单客户订单列表 - 总是显示 */}
            <Card title="待催单客户订单列表" role="region">
              {reminderOrders.length > 0 ? (
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
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <div style={{ color: '#999', fontSize: '14px' }}>暂无待催单客户</div>
                  <div style={{ color: '#ccc', fontSize: '12px', marginTop: '8px' }}>
                    当客户服务即将到期或已过期时，会在此显示
                  </div>
                </div>
              )}
            </Card>
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