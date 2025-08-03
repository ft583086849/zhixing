import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Table, 
  Card, 
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
  Space,
  Button
} from 'antd';
import { 
  SearchOutlined
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
      is_reminded: searchValues.remind_status,
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



  // 表格列定义
  const columns = [
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
      title: '销售微信号',
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
      dataIndex: 'is_reminded',
      key: 'is_reminded',
      width: 100,
      render: (isReminded) => {
        const statusMap = {
          false: { text: '未催单', color: 'orange' },
          true: { text: '已催单', color: 'green' }
        };
        const statusInfo = statusMap[isReminded] || { text: isReminded ? '已催单' : '未催单', color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },

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
              <Form.Item name="sales_wechat" label="销售微信号">
                <Input placeholder="请输入销售微信号" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="remind_status" label="催单状态">
                <Select placeholder="请选择状态" allowClear>
                  <Option value="false">未催单</Option>
                  <Option value="true">已催单</Option>
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




    </div>
  );
};

export default AdminCustomers; 