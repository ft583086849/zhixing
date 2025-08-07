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
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
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

    if (searchValues.expiry_date_range && searchValues.expiry_date_range.length === 2) {
      queryParams.expiry_start_date = searchValues.expiry_date_range[0].format('YYYY-MM-DD');
      queryParams.expiry_end_date = searchValues.expiry_date_range[1].format('YYYY-MM-DD');
      delete queryParams.expiry_date_range;
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
      console.log('开始更新订单状态:', { orderId, status });
      await dispatch(updateAdminOrderStatus({ orderId, status })).unwrap();
      message.success('状态更新成功');
      // 延迟刷新订单列表，确保后端状态已更新
      setTimeout(() => {
        fetchOrders();
      }, 500);
    } catch (error) {
      console.error('状态更新失败:', error);
      message.error(`状态更新失败: ${error.message || error}`);
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
      title: '销售微信号',
      key: 'sales_wechat_name',
      width: 120,
      render: (_, record) => {
        // 优化销售微信号显示逻辑 - 支持多种字段名
        const wechatFields = [
          'sales_wechat_name',     // 主要字段
          'wechat_name',           // 销售表字段
          'primary_sales_wechat',  // 一级销售微信
          'secondary_sales_wechat' // 二级销售微信
        ];
        
        for (const field of wechatFields) {
          if (record[field]) {
            return record[field];
          }
        }
        
        return '-';
      }
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
      dataIndex: 'expiry_time',
      key: 'expiry_time',
      width: 150,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '应付金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => `$${amount}`,
    },
    {
      title: '实付金额',
      dataIndex: 'alipay_amount',
      key: 'alipay_amount',
      width: 120,
      render: (alipayAmount, record) => {
        if (record.payment_method === 'alipay' && alipayAmount) {
          return `¥${alipayAmount}`;
        } else if (record.payment_method === 'crypto' && record.crypto_amount) {
          return `$${record.crypto_amount}`;
        }
        return `$${record.amount}`;
      }
    },
    {
      title: '佣金',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      width: 100,
      render: (amount) => `¥${amount || 0}`,
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
          'pending_payment': { text: '待付款确认', color: 'orange' },
          'pending_review': { text: '待付款确认', color: 'orange' }, // 兼容旧状态名
          'pending': { text: '待付款确认', color: 'orange' }, // 修复：添加pending状态映射
          'confirmed': { text: '已确认', color: 'blue' }, // 修复：添加confirmed状态映射
          'confirmed_payment': { text: '已付款确认', color: 'blue' },
          'pending_config': { text: '待配置确认', color: 'purple' },
          'confirmed_configuration': { text: '已配置确认', color: 'green' },
          'active': { text: '已生效', color: 'green' },
          'expired': { text: '已过期', color: 'gray' },
          'cancelled': { text: '已取消', color: 'red' },
          'rejected': { text: '已拒绝', color: 'red' }
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: '付款截图',
      dataIndex: 'screenshot_data',
      key: 'screenshot_data',
      width: 120,
      render: (screenshotData) => {
        if (!screenshotData) return '-';
        return (
          <Tooltip title="查看付款截图">
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => handlePreviewImage(screenshotData)}
              size="small"
            >
              查看截图
            </Button>
          </Tooltip>
        );
      }
    },
    {
      title: '购买类型',
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
      title: '配置确认时间',
      dataIndex: 'effective_time',
      key: 'effective_time',
      width: 150,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const renderOperations = () => {
          // 处理状态兼容性：多种状态映射
          let currentStatus = record.status;
          if (currentStatus === 'pending_review' || currentStatus === 'pending') {
            currentStatus = 'pending_payment';
          }
          if (currentStatus === 'confirmed') {
            currentStatus = 'confirmed_payment';
          }
          
          switch (currentStatus) {
            case 'pending_payment':
              // 7天免费订单跳过付款确认，直接进入配置确认
              if (record.duration === '7days') {
                return (
                  <>
                    <Button 
                      type="primary" 
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleUpdateStatus(record.id, 'pending_config')}
                    >
                      配置确认
                    </Button>
                    <Button 
                      type="link" 
                      size="small"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => handleUpdateStatus(record.id, 'rejected')}
                    >
                      拒绝订单
                    </Button>
                  </>
                );
              }
              // 付费订单需要付款确认
              return (
                <>
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleUpdateStatus(record.id, 'confirmed_payment')}
                  >
                    付款确认
                  </Button>
                  <Button 
                    type="link" 
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleUpdateStatus(record.id, 'rejected')}
                  >
                    拒绝订单
                  </Button>
                </>
              );
              
            case 'confirmed_payment':
              return (
                <>
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleUpdateStatus(record.id, 'pending_config')}
                  >
                    配置确认
                  </Button>
                  <Button 
                    type="link" 
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleUpdateStatus(record.id, 'rejected')}
                  >
                    拒绝订单
                  </Button>
                </>
              );
              
            case 'pending_config':
              return (
                <>
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleUpdateStatus(record.id, 'confirmed_configuration')}
                  >
                    配置确认
                  </Button>
                  <Button 
                    type="link" 
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleUpdateStatus(record.id, 'rejected')}
                  >
                    拒绝订单
                  </Button>
                </>
              );
              
            case 'confirmed_configuration':
              return (
                <span style={{ color: '#52c41a', fontSize: '12px' }}>
                  ✓ 已完成
                </span>
              );
              
            case 'active':
              return (
                <span style={{ color: '#52c41a', fontSize: '12px' }}>
                  ✓ 已生效
                </span>
              );
              
            case 'expired':
              return (
                <span style={{ color: '#ff4d4f', fontSize: '12px' }}>
                  ✗ 已过期
                </span>
              );
              
            case 'cancelled':
              return (
                <span style={{ color: '#ff4d4f', fontSize: '12px' }}>
                  ✗ 已取消
                </span>
              );
              
            case 'rejected':
              return (
                <span style={{ color: '#ff4d4f', fontSize: '12px' }}>
                  ✗ 已拒绝
                </span>
              );
              
            default:
              return (
                <Button 
                  type="link" 
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleUpdateStatus(record.id, 'rejected')}
                >
                  拒绝订单
                </Button>
              );
          }
        };
        
        return (
          <Space size="small" wrap>
            {renderOperations()}
          </Space>
        );
      }
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
                          <Form.Item name="sales_wechat" label="销售微信号">
              <Input placeholder="请输入销售微信号" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="tradingview_username" label="TradingView用户">
                <Input placeholder="请输入TradingView用户" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="purchase_type" label="购买方式">
                <Select placeholder="请选择购买方式" allowClear>
                  <Option value="immediate">即时购买</Option>
                  <Option value="advance">提前购买</Option>
                </Select>
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
                  <Option value="pending_payment">待付款确认</Option>
                  <Option value="confirmed_payment">已付款确认</Option>
                  <Option value="pending_config">待配置确认</Option>
                  <Option value="confirmed_configuration">已配置确认</Option>
                  <Option value="active">已生效</Option>
                  <Option value="expired">已过期</Option>
                  <Option value="cancelled">已取消</Option>
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
              <Form.Item name="expiry_date_range" label="到期时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="amount_range" label="付款金额">
                <Input.Group compact>
                  <Input
                    style={{ width: '40%', textAlign: 'center' }}
                    placeholder="最小金额"
                    name="min_amount"
                    type="number"
                  />
                  <Input
                    style={{ width: '20%', textAlign: 'center', borderLeft: 0, borderRight: 0, pointerEvents: 'none' }}
                    placeholder="~"
                    disabled
                  />
                  <Input
                    style={{ width: '40%', textAlign: 'center', borderLeft: 0 }}
                    placeholder="最大金额"
                    name="max_amount"
                    type="number"
                  />
                </Input.Group>
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
            current: pagination?.page || 1,
            pageSize: pagination?.limit || 20,
            total: pagination?.total || 0,
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