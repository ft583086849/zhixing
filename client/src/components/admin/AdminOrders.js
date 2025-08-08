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
  CloseOutlined,
  StopOutlined,
  ExclamationCircleOutlined
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

    // 处理催单建议筛选
    if (searchValues.reminder_suggestion) {
      queryParams.reminder_suggestion = searchValues.reminder_suggestion;
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
      title: '用户微信号',
      dataIndex: 'customer_wechat',
      key: 'customer_wechat',
      width: 130,
      fixed: 'left',
      render: (text) => text || '-',
    },
    {
      title: '销售微信号',
      key: 'sales_wechat_name',
      width: 260,
      fixed: 'left',
      render: (_, record) => {
        // 判断销售类型 - 使用三层销售体系
        let salesType = '';
        let salesTypeBadge = null;
        let primarySalesName = null;
        
        // 根据字段判断销售类型
        if (record.primary_sales_id) {
          salesType = '一级销售';
          salesTypeBadge = <Tag color="blue">一级</Tag>;
        } else if (record.secondary_sales_id) {
          // 判断是二级销售还是独立销售
          if (record.secondary_sales?.primary_sales_id) {
            // 二级销售（有上级）
            salesTypeBadge = <Tag color="orange">二级</Tag>;
            // 获取一级销售信息
            primarySalesName = record.secondary_sales?.primary_sales?.wechat_name;
          } else {
            // 独立销售（无上级）
            salesTypeBadge = <Tag color="green">独立</Tag>;
          }
        } else {
          // 备用判断逻辑
          if (record.primary_sales?.wechat_name) {
            salesTypeBadge = <Tag color="blue">一级</Tag>;
          } else if (record.secondary_sales?.wechat_name) {
            // 判断是否有primary_sales_id
            if (record.secondary_sales?.primary_sales_id) {
              salesTypeBadge = <Tag color="orange">二级</Tag>;
              primarySalesName = record.secondary_sales?.primary_sales?.wechat_name;
            } else {
              salesTypeBadge = <Tag color="green">独立</Tag>;
            }
          }
        }
        
        // 获取微信号
        let wechatName = '-';
        
        // 优先从sales_wechat_name字段获取（由supabase.js设置）
        if (record.sales_wechat_name && record.sales_wechat_name !== '-') {
          wechatName = record.sales_wechat_name;
        }
        // 尝试从嵌套的销售对象中获取wechat_name
        else if (record.primary_sales?.wechat_name) {
          wechatName = record.primary_sales.wechat_name;
        }
        else if (record.secondary_sales?.wechat_name) {
          wechatName = record.secondary_sales.wechat_name;
        }
        
        // 返回带类型标识的销售微信号
        return (
          <Space size="small">
            {wechatName}
            {salesTypeBadge}
            {primarySalesName && (
              <Tooltip title={`一级销售: ${primarySalesName}`}>
                <span style={{ color: '#999', fontSize: '12px' }}>
                  ({primarySalesName})
                </span>
              </Tooltip>
            )}
          </Space>
        );
      }
    },
    {
      title: '催单建议',
      key: 'reminder_suggestion',
      width: 100,
      render: (_, record) => {
        // 检查是否需要催单（到期时间在一周内）
        if (record.expiry_time) {
          const expiryDate = dayjs(record.expiry_time);
          const today = dayjs();
          const daysUntilExpiry = expiryDate.diff(today, 'day');
          
          // 如果在7天内到期且状态不是已完成
          if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0 && 
              record.status !== 'confirmed_config' && 
              record.status !== 'active' && 
              record.status !== 'expired') {
            return (
              <Tag color="red" icon={<ExclamationCircleOutlined />}>
                建议催单
              </Tag>
            );
          }
        }
        return <Tag color="default">无需催单</Tag>;
      },
      filters: [
        { text: '建议催单', value: 'need_reminder' },
        { text: '无需催单', value: 'no_reminder' }
      ],
      onFilter: (value, record) => {
        if (!record.expiry_time) return value === 'no_reminder';
        
        const expiryDate = dayjs(record.expiry_time);
        const today = dayjs();
        const daysUntilExpiry = expiryDate.diff(today, 'day');
        
        const needReminder = daysUntilExpiry <= 7 && daysUntilExpiry >= 0 && 
                            record.status !== 'confirmed_config' && 
                            record.status !== 'active' && 
                            record.status !== 'expired';
        
        return value === 'need_reminder' ? needReminder : !needReminder;
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
          'crypto': '链上地址'
        };
        return methodMap[method] || method;
      }
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => {
        // 标准化状态映射
        const statusMap = {
          // 主流程状态
          'pending_payment': { text: '待付款确认', color: 'orange' },
          'pending_review': { text: '待付款确认', color: 'orange' }, // 兼容旧状态
          'pending': { text: '待付款确认', color: 'orange' }, // 兼容旧状态
          'confirmed': { text: '待配置确认', color: 'blue' }, // 兼容旧状态
          'confirmed_payment': { text: '待配置确认', color: 'blue' },
          'pending_config': { text: '待配置确认', color: 'purple' },
          'confirmed_config': { text: '已完成', color: 'green' },
          
          // 特殊状态
          'incomplete': { text: '未完成购买', color: 'gray' },
          'active': { text: '已生效', color: 'green' },
          'expired': { text: '已过期', color: 'gray' },
          'cancelled': { text: '已取消', color: 'red' },
          'refunded': { text: '已退款', color: 'red' },
          'rejected': { text: '已拒绝', color: 'red' }
        };
        
        // 7天免费订单特殊处理：如果是pending状态直接显示为待配置
        let displayStatus = status;
        if (record.duration === '7days' && (status === 'pending' || status === 'pending_payment')) {
          displayStatus = 'pending_config';
        }
        
        const statusInfo = statusMap[displayStatus] || { text: displayStatus, color: 'default' };
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
      fixed: 'right',
      render: (_, record) => {
        const renderOperations = () => {
          // 处理状态兼容性：多种状态映射
          let currentStatus = record.status;
          if (currentStatus === 'pending_review' || currentStatus === 'pending') {
            currentStatus = 'pending_payment';
          }
          // 修复：confirmed状态应该映射为confirmed_payment
          if (currentStatus === 'confirmed') {
            currentStatus = 'confirmed_payment';
          }
          
          switch (currentStatus) {
            case 'pending_payment':
              // 7天免费订单特殊处理：直接显示"配置确认"按钮
              if (record.duration === '7days') {
                return (
                  <>
                    <Button 
                      type="primary" 
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleUpdateStatus(record.id, 'confirmed_config')}
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
                    onClick={() => handleUpdateStatus(record.id, 'pending_config')}
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
                    拒绝订单
                  </Button>
                </>
              );
              
            case 'confirmed_payment':
              // confirmed_payment状态也应该显示待配置确认
              return (
                <>
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleUpdateStatus(record.id, 'confirmed_config')}
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
                    onClick={() => handleUpdateStatus(record.id, 'confirmed_config')}
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
              
            case 'confirmed_config':
              return (
                <span style={{ color: '#52c41a', fontSize: '12px' }}>
                  ✓ 完成
                </span>
              );
              
            case 'incomplete':
              return (
                <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                  未完成购买
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
    },
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'right',
    }
  ];

  return (
    <div style={{ padding: '0 24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>订单管理</Title>

      {/* 搜索表单 */}
      <Card style={{ marginBottom: 24 }}>
        <Form form={searchForm} layout="horizontal">
          <Row gutter={[24, 16]} style={{ width: '100%' }}>
            {/* 第一行 - 主要筛选 */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="sales_type" label="销售类型" style={{ marginBottom: 0 }}>
                <Select placeholder="请选择销售类型" allowClear style={{ width: '100%' }}>
                  <Option value="primary">一级销售</Option>
                  <Option value="secondary">二级销售</Option>
                  <Option value="independent">独立销售</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="sales_wechat" label="销售微信号" style={{ marginBottom: 0 }}>
                <Input placeholder="请输入销售微信号" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="customer_wechat" label="用户微信号" style={{ marginBottom: 0 }}>
                <Input placeholder="请输入用户微信号" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="tradingview_username" label="TradingView用户" style={{ marginBottom: 0 }}>
                <Input placeholder="请输入TradingView用户" style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            {/* 第二行 */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="purchase_type" label="购买方式" style={{ marginBottom: 0 }}>
                <Select placeholder="请选择购买方式" allowClear style={{ width: '100%' }}>
                  <Option value="immediate">即时购买</Option>
                  <Option value="advance">提前购买</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="payment_method" label="付款方式" style={{ marginBottom: 0 }}>
                <Select placeholder="请选择付款方式" allowClear style={{ width: '100%' }}>
                  <Option value="alipay">支付宝</Option>
                  <Option value="crypto">链上地址</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="订单状态" style={{ marginBottom: 0 }}>
                <Select placeholder="请选择状态" allowClear style={{ width: '100%' }}>
                  <Option value="pending_payment">待付款确认</Option>
                  <Option value="confirmed_payment">已付款确认</Option>
                  <Option value="pending_config">待配置确认</Option>
                  <Option value="confirmed_config">已配置确认</Option>
                  <Option value="incomplete">未完成购买</Option>
                  <Option value="active">已生效</Option>
                  <Option value="expired">已过期</Option>
                  <Option value="cancelled">已取消</Option>
                  <Option value="rejected">已拒绝</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="date_range" label="提交时间" style={{ marginBottom: 0 }}>
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            {/* 第三行 */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="payment_date_range" label="付款时间" style={{ marginBottom: 0 }}>
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="config_date_range" label="配置时间" style={{ marginBottom: 0 }}>
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="expiry_date_range" label="到期时间" style={{ marginBottom: 0 }}>
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="amount_range" label="付款金额" style={{ marginBottom: 0 }}>
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
            
            {/* 第四行 - 催单建议 */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="reminder_suggestion" label="催单建议" style={{ marginBottom: 0 }}>
                <Select placeholder="请选择催单状态" allowClear style={{ width: '100%' }}>
                  <Option value="need_reminder">建议催单</Option>
                  <Option value="no_reminder">无需催单</Option>
                </Select>
              </Form.Item>
            </Col>
            
            {/* 按钮组 */}
            <Col 
              xs={24} 
              style={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginTop: 8
              }}
            >
              <Space size="middle">
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />} 
                  onClick={handleSearch}
                  size="middle"
                >
                  搜索
                </Button>
                <Button 
                  onClick={handleReset}
                  size="middle"
                >
                  重置
                </Button>
                <Button 
                  icon={<ExportOutlined />} 
                  onClick={handleExport}
                  size="middle"
                >
                  导出数据
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 订单表格 */}
      <Card bodyStyle={{ padding: '0px' }}>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          scroll={{ 
            x: 2000,  // 设置横向滚动（增加了催单建议列）
            y: 'calc(100vh - 420px)'  // 设置纵向高度
          }}
          pagination={{
            current: pagination?.page || 1,
            pageSize: pagination?.limit || 20,
            total: pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
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