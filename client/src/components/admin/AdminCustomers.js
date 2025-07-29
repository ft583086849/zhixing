import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Tag, 
  message, 
  Skeleton,
  Typography,
  Select,
  DatePicker,
  Form,
  Row,
  Col,
  Input,
  Modal
} from 'antd';
import { 
  BellOutlined,
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Divider } from 'antd';
import dayjs from 'dayjs';
import { getCustomers } from '../../store/slices/adminSlice';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminCustomers = () => {
  const dispatch = useDispatch();
  const { customers, loading } = useSelector((state) => state.admin);
  const [form] = Form.useForm();
  const [remindModalVisible, setRemindModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localCustomers, setLocalCustomers] = useState([]);

  // 初始化数据
  useEffect(() => {
    dispatch(getCustomers());
  }, [dispatch]);

  // 处理搜索
  
const LoadingSkeleton = () => (
  <div style={{ padding: '20px' }}>
    <Skeleton active paragraph={{ rows: 8 }} />
  </div>
);


const handleSearch = () => {
    const searchValues = form.getFieldsValue();
    console.log('搜索条件:', searchValues);
    
    // 转换参数名以匹配后端API
    const apiParams = {
      customer_wechat: searchValues.customer_wechat,
      sales_wechat: searchValues.sales_wechat,
      remind_status: searchValues.remind_status,
      start_date: searchValues.date_range?.[0]?.format('YYYY-MM-DD'),
      end_date: searchValues.date_range?.[1]?.format('YYYY-MM-DD')
    };
    
    // 移除空值
    Object.keys(apiParams).forEach(key => {
      if (!apiParams[key]) {
        delete apiParams[key];
      }
    });
    
    dispatch(getCustomers(apiParams));
    message.success('搜索完成');
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    dispatch(getCustomers());
  };

  // 处理催单
  const handleRemind = (customer) => {
    setSelectedCustomer(customer);
    setRemindModalVisible(true);
  };

  // 查看客户详情
  const handleViewCustomer = (customer) => {
    setViewingCustomer(customer);
    setViewModalVisible(true);
  };

  // 确认催单
  const confirmRemind = async () => {
    setLocalLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新客户状态
      const updatedCustomers = customers.map(customer => 
        customer.id === selectedCustomer.id 
          ? { ...customer, remind_status: 'reminded' }
          : customer
      );
      
      setLocalCustomers(updatedCustomers);
      setRemindModalVisible(false);
      setSelectedCustomer(null);
      message.success('催单成功');
    } catch (error) {
      message.error('催单失败');
    } finally {
      setLocalLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '客户ID',
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
      title: 'TradingView用户',
      dataIndex: 'tradingview_username',
      key: 'tradingview_username',
      width: 150,
    },
    {
      title: '销售微信',
      dataIndex: 'sales_wechat',
      key: 'sales_wechat',
      width: 120,
    },
    {
      title: '总订单数',
      dataIndex: 'total_orders',
      key: 'total_orders',
      width: 100,
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (amount) => `$${amount}`,
    },
    {
      title: '返佣金额',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      width: 100,
      render: (amount) => `$${parseFloat(amount || 0).toFixed(2)}`,
    },
    {
      title: '到期时间',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 150,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '催单状态',
      dataIndex: 'remind_status',
      key: 'remind_status',
      width: 100,
      render: (status) => {
        const statusMap = {
          'pending': { text: '待催单', color: 'orange' },
          'reminded': { text: '已催单', color: 'green' }
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewCustomer(record)}
          >
            查看
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>客户管理</Title>

      {/* 搜索表单 */}
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="customer_wechat" label="客户微信">
                <Input placeholder="请输入客户微信" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="sales_wechat" label="销售微信">
                <Input placeholder="请输入销售微信" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="remind_status" label="催单状态">
                <Select placeholder="请选择状态" allowClear>
                  <Option value="pending">待催单</Option>
                  <Option value="reminded">已催单</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="date_range" label="到期时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 客户列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={Array.isArray(customers) ? customers : []}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          loading={loading}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 催单确认模态框 */}
      <Modal
        title="确认催单"
        open={remindModalVisible}
        onOk={confirmRemind}
        onCancel={() => setRemindModalVisible(false)}
        confirmLoading={loading}
      >
        {selectedCustomer && (
          <div>
            <p>确定要向以下客户发送催单提醒吗？</p>
            <p><strong>客户微信：</strong>{selectedCustomer.customer_wechat}</p>
            <p><strong>TradingView用户：</strong>{selectedCustomer.tradingview_username}</p>
            <p><strong>销售微信：</strong>{selectedCustomer.sales_wechat}</p>
            <p><strong>总金额：</strong>${selectedCustomer.total_amount}</p>
            <p><strong>到期时间：</strong>{dayjs(selectedCustomer.expiry_date).format('YYYY-MM-DD HH:mm')}</p>
          </div>
        )}
      </Modal>

      {/* 客户详情查看模态框 */}
      <Modal
        title="客户详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={600}
      >
        {viewingCustomer && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <p><strong>客户ID：</strong>{viewingCustomer.id}</p>
                <p><strong>客户微信：</strong>{viewingCustomer.customer_wechat}</p>
                <p><strong>TradingView用户：</strong>{viewingCustomer.tradingview_username}</p>
                <p><strong>销售微信：</strong>{viewingCustomer.sales_wechat}</p>
              </Col>
              <Col span={12}>
                <p><strong>总订单数：</strong>{viewingCustomer.total_orders}</p>
                <p><strong>总金额：</strong>${viewingCustomer.total_amount}</p>
                <p><strong>返佣金额：</strong>${viewingCustomer.commission_amount}</p>
                <p><strong>催单状态：</strong>
                  <Tag color={viewingCustomer.remind_status === 'pending' ? 'orange' : 'green'}>
                    {viewingCustomer.remind_status === 'pending' ? '待催单' : '已催单'}
                  </Tag>
                </p>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <p><strong>最后订单时间：</strong>{dayjs(viewingCustomer.last_order_date).format('YYYY-MM-DD HH:mm')}</p>
                <p><strong>到期时间：</strong>{dayjs(viewingCustomer.expiry_date).format('YYYY-MM-DD HH:mm')}</p>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCustomers; 