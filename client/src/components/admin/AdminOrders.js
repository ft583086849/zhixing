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
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Modal, 
  Row, 
  Col, 
  Typography,
  Image,
  Tooltip
} from 'antd';
import { 
  SearchOutlined,
  ExportOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAdminOrders, updateAdminOrderStatus, exportOrders } from '../../store/slices/adminSlice';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminOrders = () => {
  const dispatch = useDispatch();
  const { orders, pagination, loading } = useSelector((state) => state.admin);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 获取订单列表
  const fetchOrders = (params = {}) => {
    const searchValues = searchForm.getFieldsValue();
    const queryParams = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchValues,
      ...params
    };
    
    // 处理日期范围
    if (searchValues.date_range && searchValues.date_range.length === 2) {
      queryParams.start_date = searchValues.date_range[0].format('YYYY-MM-DD');
      queryParams.end_date = searchValues.date_range[1].format('YYYY-MM-DD');
      delete queryParams.date_range;
    }
    
    if (searchValues.payment_date_range && searchValues.payment_date_range.length === 2) {
      queryParams.payment_start_date = searchValues.payment_date_range[0].format('YYYY-MM-DD');
      queryParams.payment_end_date = searchValues.payment_date_range[1].format('YYYY-MM-DD');
      delete queryParams.payment_date_range;
    }
    
    if (searchValues.config_date_range && searchValues.config_date_range.length === 2) {
      queryParams.config_start_date = searchValues.config_date_range[0].format('YYYY-MM-DD');
      queryParams.config_end_date = searchValues.config_date_range[1].format('YYYY-MM-DD');
      delete queryParams.config_date_range;
    }

    dispatch(getAdminOrders(queryParams));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 处理分页变化
  const handleTableChange = (pagination) => {
    fetchOrders({ page: pagination.current, limit: pagination.pageSize });
  };

  // 处理搜索
  const handleSearch = () => {
    fetchOrders({ page: 1 });
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    fetchOrders({ page: 1 });
  };

  // 导出数据
  const handleExport = async () => {
    try {
      const searchValues = searchForm.getFieldsValue();
      const queryParams = { ...searchValues };
      
      if (searchValues.date_range && searchValues.date_range.length === 2) {
        queryParams.start_date = searchValues.date_range[0].format('YYYY-MM-DD');
        queryParams.end_date = searchValues.date_range[1].format('YYYY-MM-DD');
        delete queryParams.date_range;
      }
      
      if (searchValues.payment_date_range && searchValues.payment_date_range.length === 2) {
        queryParams.payment_start_date = searchValues.payment_date_range[0].format('YYYY-MM-DD');
        queryParams.payment_end_date = searchValues.payment_date_range[1].format('YYYY-MM-DD');
        delete queryParams.payment_date_range;
      }

      const response = await dispatch(exportOrders(queryParams)).unwrap();
      
      // 创建下载链接
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 更新订单状态
  const handleUpdateStatus = async (orderId, status) => {
    try {
      await dispatch(updateAdminOrderStatus({ orderId, status })).unwrap();
      message.success('状态更新成功');
      // 延迟刷新订单列表，确保后端状态已更新
      setTimeout(() => {
        fetchOrders();
      }, 500);
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  // 查看截图
  const handlePreviewImage = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
  };

  // 表格列定义
  const columns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left',
    },
    {
      title: '销售微信',
      dataIndex: ['links', 'sales', 'wechat_name'],
      key: 'wechat_name',
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
      title: '购买方式',
      dataIndex: 'purchase_type',
      key: 'purchase_type',
      width: 100,
      render: (type) => {
        const typeMap = {
          'immediate': '即时购买',
          'advance': '提前购买'
        };
        return typeMap[type] || type;
      }
    },
    {
      title: '生效时间',
      dataIndex: 'effective_time',
      key: 'effective_time',
      width: 150,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '到期时间',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 150,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => `$${amount}`,
    },
    {
      title: '付款方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (method) => {
        const methodMap = {
          'alipay': '支付宝',
          'crypto': '线上地址码'
        };
        return methodMap[method] || method;
      }
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusMap = {
          'pending_payment_confirmation': { text: '待付款确认', color: 'orange' },
          'confirmed_payment': { text: '已付款确认', color: 'blue' },
          'pending_configuration_confirmation': { text: '待配置确认', color: 'purple' },
          'confirmed_configuration': { text: '已配置确认', color: 'green' },
          'rejected': { text: '已拒绝', color: 'red' }
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: '付款截图',
      dataIndex: 'screenshot_path',
      key: 'screenshot_path',
      width: 120,
      render: (path) => {
        if (!path) return '-';
        return (
          <Tooltip title="查看截图">
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => handlePreviewImage(path)}
              size="small"
            />
          </Tooltip>
        );
      }
    },
    {
      title: '配置确认时间',
      dataIndex: 'effective_time',
      key: 'effective_time',
      width: 150,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending_payment_confirmation' && (
            <>
              <Button 
                type="link" 
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'confirmed_payment')}
              >
                确认付款
              </Button>
              <Button 
                type="link" 
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'rejected')}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === 'confirmed_payment' && (
            <>
              <Button 
                type="link" 
                size="small"
                icon={<CheckOutlined />} 
                onClick={() => handleUpdateStatus(record.id, 'pending_configuration_confirmation')}
              >
                待配置
              </Button>
            </>
          )}
          {record.status === 'pending_configuration_confirmation' && (
            <>
              <Button 
                type="link" 
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'confirmed_configuration')}
              >
                确认配置
              </Button>
              <Button 
                type="link" 
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'rejected')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>订单管理</Title>

      {/* 搜索表单 */}
      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="link_code" label="链接代码">
                <Input placeholder="请输入链接代码" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="payment_method" label="付款方式">
                <Select placeholder="请选择付款方式" allowClear>
                  <Option value="alipay">支付宝</Option>
                  <Option value="crypto">线上地址码</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="status" label="订单状态">
                <Select placeholder="请选择状态" allowClear>
                  <Option value="pending_payment_confirmation">待付款确认</Option>
                  <Option value="pending_configuration_confirmation">待配置确认</Option>
                  <Option value="confirmed_payment">已付款确认</Option>
                  <Option value="confirmed_configuration">已配置确认</Option>
                  <Option value="rejected">已拒绝</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="date_range" label="提交时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="payment_date_range" label="付款时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="config_date_range" label="配置时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
                <Button icon={<ExportOutlined />} onClick={handleExport}>
                  导出
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 订单表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>

      {/* 图片预览 */}
      <Modal
        open={previewVisible}
        title="付款截图"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ top: 20 }}
        destroyOnClose
      >
        <Image
          alt="付款截图"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default AdminOrders; 