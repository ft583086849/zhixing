import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
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
  ReloadOutlined,
  CopyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAdminOrders, updateAdminOrderStatus, exportOrders, getStats } from '../../store/slices/adminSlice';
import DataRefreshManager from '../../utils/dataRefresh';
// import { checkE8257Order } from '../../utils/checkE8257';
// import { simpleCheckE8257 } from '../../utils/simpleCheck';
// import { fixE8257Order } from '../../utils/fixE8257Order';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminOrders = () => {
  const dispatch = useDispatch();
  const { orders: rawOrders, pagination, loading } = useSelector((state) => {
    console.log('Redux state.admin:', state.admin);
    console.log('Orders data:', state.admin.orders);
    console.log('Orders type:', typeof state.admin.orders);
    console.log('Orders isArray:', Array.isArray(state.admin.orders));
    return state.admin;
  });
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  
  // 🔧 由于后端已经处理筛选，直接使用返回的数据
  const orders = React.useMemo(() => {
    if (!Array.isArray(rawOrders)) return [];
    
    console.log('🔍 所有订单数据:', rawOrders.length, '个订单');
    
    // 查找e8257的订单
    const e8257Orders = rawOrders.filter(order => 
      order.tradingview_username?.toLowerCase().includes('e8257') ||
      order.customer_wechat?.toLowerCase().includes('e8257') ||
      order.customer_name?.toLowerCase().includes('e8257')
    );
    if (e8257Orders.length > 0) {
      console.log('🔍 找到e8257的订单:', e8257Orders);
    }
    
    // 查找$1588的订单
    const amount1588Orders = rawOrders.filter(order => 
      order.amount === 1588 || order.amount === '1588'
    );
    console.log('🔍 找到$1588的订单:', amount1588Orders.length, '个');
    if (amount1588Orders.length > 0) {
      console.log('$1588订单详情:', amount1588Orders.map(o => `#${o.id} ${o.tradingview_username} ${o.status}`));
    }
    
    // 直接返回后端筛选后的数据，不做客户端过滤
    return rawOrders;
  }, [rawOrders]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 保存上次查询参数
  const lastSearchParams = useRef(null);

  // 获取订单列表
  const fetchOrders = (params = {}) => {
    const searchValues = searchForm.getFieldsValue();
    const queryParams = {
      page: params.page || pagination?.page || 1,
      limit: params.limit || 100,  // 增加默认分页大小到100
      ...searchValues,
      ...params
    };
    
    // 🔧 处理多选金额筛选 - 直接传递给后端，后端已支持数组
    // 金额数组会被直接传递给后端，后端已经更新支持 array.in 查询
    
    // 🔧 新增：默认排除已拒绝的订单，除非用户明确选择查看
    // 处理特殊状态值
    if (queryParams.status === 'all_including_rejected') {
      // 查看全部订单，包括已拒绝的
      delete queryParams.status;
      queryParams.includeRejected = true;
    } else if (!queryParams.status && !params.includeRejected) {
      // 如果没有明确选择状态，默认排除已拒绝
      queryParams.excludeRejected = true;
    }
    
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

    // 保存查询参数供刷新使用
    lastSearchParams.current = queryParams;
    
    console.log('🔍 发送的查询参数:', queryParams);
    
    try {
      dispatch(getAdminOrders(queryParams));
      // 🔧 修复：同时刷新统计数据，确保订单状态更新后统计数据同步
      dispatch(getStats({ usePaymentTime: true }));
    } catch (error) {
      console.error('获取订单列表失败:', error);
      message.error('获取订单数据失败，请稍后重试');
    }
  };

  // 手动刷新数据
  const handleRefresh = async () => {
    if (!lastSearchParams.current) {
      fetchOrders();
      return;
    }
    
    setIsRefreshing(true);
    try {
      await dispatch(getAdminOrders(lastSearchParams.current));
      await dispatch(getStats({ usePaymentTime: true }));
      message.success('数据已刷新');
    } catch (error) {
      console.error('刷新失败:', error);
      message.error('数据刷新失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // 临时：检查e8257订单数据 - 已注释，修复完成
    // window.checkE8257Order = checkE8257Order;
    // window.simpleCheckE8257 = simpleCheckE8257;
    // window.fixE8257Order = fixE8257Order;
    
    // 检查URL参数
    const statusParam = searchParams.get('status');
    if (statusParam) {
      // 如果有status参数，设置表单值并搜索
      form.setFieldsValue({ status: statusParam });
      fetchOrders({ status: statusParam });
    } else {
      fetchOrders();
    }
  }, [searchParams]);
  
  // 自动刷新（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSearchParams.current) {
        handleRefresh();
      }
    }, 30000); // 30秒自动刷新
    
    return () => clearInterval(interval);
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
      
      // 🔧 处理多选金额筛选（导出）- 直接传递给后端，后端已支持数组
      // 金额数组会被直接传递给后端，后端已经更新支持 array.in 查询
      
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
      // 使用全局数据刷新管理器，确保所有相关数据都更新
      setTimeout(async () => {
        await DataRefreshManager.onOrderStatusUpdate();
        fetchOrders(); // 也刷新当前页面的订单列表
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

  // 复制到剪贴板函数
  const copyToClipboard = (text, type) => {
    if (!text) {
      message.warning(`${type}为空，无法复制`);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${type}已复制到剪贴板`);
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '用户信息',
      key: 'user_info',
      width: 200,
      fixed: 'left',
      render: (_, record) => {
        try {
          return (
            <div style={{ lineHeight: '1.4' }}>
              {/* 第一行：TradingView用户名 + 复制按钮 */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>
                  {record?.tradingview_username || '-'}
                </span>
                {record?.tradingview_username && (
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(record.tradingview_username, 'TradingView用户名')}
                    style={{ padding: '0 4px', minWidth: 'auto' }}
                  />
                )}
              </div>
              
              {/* 第二行：用户微信 */}
              <div style={{ fontSize: '12px', color: '#666' }}>
                微信: {record?.customer_wechat || '-'}
              </div>
            </div>
          );
        } catch (error) {
          console.error('用户信息列渲染错误:', error, record);
          return <span>数据错误</span>;
        }
      },
    },
    {
      title: '销售信息',
      key: 'sales_info',
      width: 150,
      fixed: 'left',
      render: (_, record) => {
        try {
          // 获取销售微信号和类型
          let salesWechat = '-';
          let salesType = '-';
          let salesTypeColor = 'default';
          
          // 优先判断是否有二级销售信息
          if (record?.secondary_sales) {
            salesWechat = record.secondary_sales.wechat_name || '-';
            if (record.secondary_sales.primary_sales_id) {
              salesType = '二级销售';
              salesTypeColor = 'orange';
            } else {
              salesType = '独立销售';
              salesTypeColor = 'green';
            }
          }
          // 判断是否有一级销售信息
          else if (record?.primary_sales) {
            salesWechat = record.primary_sales.wechat_name || '-';
            salesType = '一级销售';
            salesTypeColor = 'blue';
          }
          // 从sales_wechat_name字段获取
          else if (record?.sales_wechat_name && record.sales_wechat_name !== '-') {
            salesWechat = record.sales_wechat_name;
            salesType = '未知类型';
          }
          
          return (
            <div style={{ lineHeight: '1.4' }}>
              {/* 第一行：销售微信号 */}
              <div style={{ marginBottom: '4px' }}>
                {salesWechat}
              </div>
              
              {/* 第二行：销售类型 */}
              <div>
                <Tag color={salesTypeColor} size="small">{salesType}</Tag>
              </div>
            </div>
          );
        } catch (error) {
          console.error('销售信息列渲染错误:', error, record);
          return <span>数据错误</span>;
        }
      }
    },
    {
      title: '一级销售微信',
      key: 'primary_sales_wechat',
      width: 150,
      render: (_, record) => {
        // 🔧 修复：按照新逻辑显示一级销售
        
        // 如果是二级销售订单，显示其所属的一级销售
        if (record.secondary_sales?.primary_sales_id) {
          // 从关联中获取一级销售信息
          const primaryWechat = record.secondary_sales?.primary_sales?.wechat_name;
          if (primaryWechat) {
            return primaryWechat;
          }
          // 如果没有关联信息，返回占位符
          return '(有上级)';
        }
        
        // 如果是一级销售直接订单，显示自己
        if (record.primary_sales?.wechat_name) {
          return record.primary_sales.wechat_name;
        }
        
        // 独立销售，没有一级
        return '-';
      }
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
    // 🚀 佣金系统v2.0 - 新增佣金拆分列
    {
      title: '一级销售佣金额',
      dataIndex: 'commission_amount_primary',
      key: 'commission_amount_primary',
      width: 140,
      render: (commission) => {
        // 如果数据库字段存在，直接使用
        if (commission !== undefined && commission !== null) {
          return commission > 0 
            ? <span style={{ color: '#1890ff' }}>${Number(commission).toFixed(2)}</span>
            : '-';
        }
        // 数据库字段不存在时的后备计算（兼容旧数据）
        return '-';
      }
    },
    {
      title: '二级分销佣金额',
      dataIndex: 'secondary_commission_amount',
      key: 'secondary_commission_amount',
      width: 140,
      render: (commission) => {
        // 如果数据库字段存在，直接使用
        if (commission !== undefined && commission !== null) {
          return commission > 0 
            ? <span style={{ color: '#52c41a' }}>${Number(commission).toFixed(2)}</span>
            : '-';
        }
        // 数据库字段不存在时的后备计算（兼容旧数据）
        return '-';
      }
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
        if ((record.duration === '7天' || record.duration === '7days') && (status === 'pending' || status === 'pending_payment')) {
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
              if ((record.duration === '7天' || record.duration === '7days')) {
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
              <Form.Item 
                name="status" 
                label="订单状态" 
                style={{ marginBottom: 0 }}
                tooltip="默认不显示已拒绝订单，选择'已拒绝'可查看"
              >
                <Select placeholder="请选择状态" allowClear style={{ width: '100%' }}>
                  <Option value="rejected">已拒绝（查看）</Option>
                  <Option value="pending_payment">待付款确认</Option>
                  <Option value="pending_config">待配置确认</Option>
                  <Option value="confirmed_config">已配置确认</Option>
                  <Option value="all_including_rejected">全部（含已拒绝）</Option>
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
              <Form.Item 
                name="amount" 
                label="订单金额" 
                style={{ marginBottom: 0 }}
                tooltip="按订单套餐价格筛选，可多选"
              >
                <Select 
                  mode="multiple"
                  placeholder="选择订单金额（可多选）" 
                  allowClear 
                  style={{ width: '100%' }}
                >
                  <Option value="0">免费体验（$0）</Option>
                  <Option value="100">$100</Option>
                  <Option value="188">$188</Option>
                  <Option value="488">$488</Option>
                  <Option value="888">$888</Option>
                  <Option value="1588">$1588</Option>
                </Select>
              </Form.Item>
            </Col>
            
            {/* 添加金额范围搜索 */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="金额范围" style={{ marginBottom: 0 }}>
                <Input.Group compact>
                  <Form.Item
                    name="min_amount"
                    noStyle
                  >
                    <Input
                      style={{ width: '50%' }}
                      placeholder="最小金额"
                      type="number"
                    />
                  </Form.Item>
                  <Form.Item
                    name="max_amount"
                    noStyle
                  >
                    <Input
                      style={{ width: '50%' }}
                      placeholder="最大金额"
                      type="number"
                    />
                  </Form.Item>
                </Input.Group>
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
                  icon={<ReloadOutlined />}
                  loading={isRefreshing}
                  onClick={handleRefresh}
                  size="middle"
                >
                  刷新
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
          dataSource={Array.isArray(orders) ? orders : []}
          rowKey={(record) => record.id || record.order_id || Math.random()}
          scroll={{ 
            x: 1900,  // 设置横向滚动
            y: 'calc(100vh - 420px)'  // 设置纵向高度
          }}
          pagination={{
            pageSize: 50,
            total: Array.isArray(orders) ? orders.length : 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['20', '50', '100', '200', '500'],
            defaultPageSize: 50,
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