import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Tag, 
  message, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Modal, 
  Row, 
  Col, 
  Typography,
  Image,
  Tooltip,
  Badge,
  Statistic
} from 'antd';
import { 
  SearchOutlined,
  ExportOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  FilterOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
// import { FixedSizeList as List } from 'react-window';
import { getAdminOrders, updateAdminOrderStatus, exportOrders, getStats } from '../../store/slices/adminSlice';
import DataRefreshManager from '../../utils/dataRefresh';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 🚀 性能优化：使用虚拟滚动组件（简化版）
const VirtualTable = ({ columns, dataSource, ...props }) => {
  // 直接使用Table组件，简化实现
  return <Table columns={columns} dataSource={dataSource} {...props} />;
};

// 🚀 缓存管理器
class OrdersCacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
  }

  getCacheKey(params) {
    return JSON.stringify(params);
  }

  get(params) {
    const key = this.getCacheKey(params);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    
    return null;
  }

  set(params, data) {
    const key = this.getCacheKey(params);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

const ordersCache = new OrdersCacheManager();

const AdminOrdersOptimized = () => {
  const dispatch = useDispatch();
  const { orders, pagination, loading } = useSelector((state) => state.admin);
  const [searchParams] = useSearchParams();
  const [searchForm] = Form.useForm();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statistics, setStatistics] = useState({
    pending: 0,
    completed: 0,
    rejected: 0,
    totalAmount: 0
  });
  
  const lastSearchParams = useRef(null);

  // 🚀 优化：计算统计数据
  useEffect(() => {
    if (orders && orders.length > 0) {
      const stats = {
        pending: orders.filter(o => o.status === 'pending_payment' || o.status === 'pending_config').length,
        completed: orders.filter(o => o.status === 'confirmed_config').length,
        rejected: orders.filter(o => o.status === 'rejected').length,
        totalAmount: orders.reduce((sum, o) => sum + (o.amount || 0), 0)
      };
      setStatistics(stats);
    }
  }, [orders]);

  // 🚀 优化：使用缓存获取订单
  const fetchOrders = useCallback(async (params = {}) => {
    const searchValues = searchForm.getFieldsValue();
    const queryParams = {
      page: params.page || pagination?.page || 1,
      limit: params.limit || 100,
      ...searchValues,
      ...params
    };
    
    // 优化：默认排除已拒绝订单
    if (!queryParams.status && !params.includeRejected) {
      queryParams.excludeRejected = true;
    }
    
    // 处理日期范围
    if (searchValues.date_range && searchValues.date_range.length === 2) {
      queryParams.start_date = searchValues.date_range[0].format('YYYY-MM-DD');
      queryParams.end_date = searchValues.date_range[1].format('YYYY-MM-DD');
      delete queryParams.date_range;
    }
    
    lastSearchParams.current = queryParams;
    
    // 检查缓存
    const cachedData = ordersCache.get(queryParams);
    if (cachedData && !params.forceRefresh) {
      return cachedData;
    }
    
    // 获取新数据
    const result = await dispatch(getAdminOrders(queryParams));
    if (result) {
      ordersCache.set(queryParams, result);
    }
    
    // 同步更新统计
    dispatch(getStats({ useCache: true }));
    
    return result;
  }, [dispatch, searchForm, pagination]);

  // 🚀 优化：防抖搜索
  const debouncedSearch = useMemo(() => {
    let timeoutId;
    return (params) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchOrders(params);
      }, 300);
    };
  }, [fetchOrders]);

  // 手动刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      ordersCache.clear();
      await fetchOrders({ ...lastSearchParams.current, forceRefresh: true });
      message.success('数据已刷新');
    } catch (error) {
      message.error('数据刷新失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      searchForm.setFieldsValue({ status: statusParam });
      fetchOrders({ status: statusParam });
    } else {
      fetchOrders();
    }
  }, [searchParams]);

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
      const response = await dispatch(exportOrders(searchValues)).unwrap();
      
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
      
      // 清除缓存并刷新
      ordersCache.clear();
      setTimeout(() => {
        DataRefreshManager.onOrderStatusUpdate();
        fetchOrders();
      }, 500);
    } catch (error) {
      message.error(`状态更新失败: ${error.message}`);
    }
  };

  // 查看截图
  const handlePreviewImage = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
  };

  // 🚀 优化：使用memo缓存列定义
  const columns = useMemo(() => [
    {
      title: '用户微信',
      dataIndex: 'customer_wechat',
      key: 'customer_wechat',
      width: 130,
      fixed: 'left',
      render: (text) => text || '-',
    },
    {
      title: '销售类型',
      key: 'sales_type',
      width: 100,
      fixed: 'left',
      render: (_, record) => {
        if (record.secondary_sales) {
          if (record.secondary_sales.primary_sales_id) {
            return <Tag color="orange">二级销售</Tag>;
          } else {
            return <Tag color="green">独立销售</Tag>;
          }
        } else if (record.primary_sales) {
          return <Tag color="blue">一级销售</Tag>;
        }
        return '-';
      }
    },
    {
      title: '销售微信',
      key: 'sales_wechat_name',
      width: 150,
      render: (_, record) => {
        return record.secondary_sales?.wechat_name || 
               record.primary_sales?.wechat_name || 
               record.sales_wechat_name || '-';
      }
    },
    {
      title: '一级销售',
      key: 'primary_sales_wechat',
      width: 150,
      render: (_, record) => {
        if (record.secondary_sales?.primary_sales_id) {
          return record.secondary_sales?.primary_sales?.wechat_name || '(有上级)';
        }
        return record.primary_sales?.wechat_name || '-';
      }
    },
    {
      title: 'TV用户名',
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
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => (
        <Statistic 
          value={amount} 
          prefix="$" 
          valueStyle={{ fontSize: 14 }}
        />
      ),
    },
    {
      title: '佣金',
      key: 'commission',
      width: 120,
      render: (_, record) => {
        // 从orders_optimized表直接读取佣金数据
        const commission = record.commission_amount || 0;
        const rate = record.commission_rate || 0;
        
        // 如果没有佣金数据，显示为0
        if (record.status === 'rejected') {
          return <span style={{ color: '#999' }}>$0.00</span>;
        }
        
        return (
          <Tooltip title={`佣金率: ${(rate * 100).toFixed(1)}%`}>
            <span style={{ color: '#52c41a' }}>${commission.toFixed(2)}</span>
          </Tooltip>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => {
        const statusMap = {
          'pending_payment': { text: '待付款', color: 'orange' },
          'pending_config': { text: '待配置', color: 'purple' },
          'confirmed_config': { text: '已完成', color: 'green' },
          'rejected': { text: '已拒绝', color: 'red' }
        };
        
        let displayStatus = status;
        if (record.duration === '7days' && status === 'pending_payment') {
          displayStatus = 'pending_config';
        }
        
        const statusInfo = statusMap[displayStatus] || { text: displayStatus, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const currentStatus = record.status;
        
        if (currentStatus === 'pending_payment' || currentStatus === 'pending_config') {
          return (
            <Space>
              <Button 
                type="primary" 
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'confirmed_config')}
              >
                确认
              </Button>
              <Button 
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'rejected')}
              >
                拒绝
              </Button>
            </Space>
          );
        }
        
        if (currentStatus === 'confirmed_config') {
          return <span style={{ color: '#52c41a' }}>✓ 完成</span>;
        }
        
        if (currentStatus === 'rejected') {
          return <span style={{ color: '#ff4d4f' }}>✗ 已拒绝</span>;
        }
        
        return null;
      }
    }
  ], []);

  return (
    <div style={{ padding: '0 24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        订单管理
        <Badge 
          count={statistics.pending} 
          style={{ marginLeft: 16 }}
          title="待处理订单"
        />
      </Title>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理"
              value={statistics.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<FilterOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={statistics.completed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已拒绝"
              value={statistics.rejected}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总金额"
              value={statistics.totalAmount}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索表单 - 简化版 */}
      <Card style={{ marginBottom: 24 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item name="sales_type" label="销售类型">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              <Option value="primary">一级</Option>
              <Option value="secondary">二级</Option>
              <Option value="independent">独立</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              <Option value="pending_payment">待付款</Option>
              <Option value="pending_config">待配置</Option>
              <Option value="confirmed_config">已完成</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="customer_wechat" label="用户微信">
            <Input placeholder="输入微信号" style={{ width: 150 }} />
          </Form.Item>
          
          <Form.Item name="date_range" label="时间范围">
            <RangePicker />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
              <Button icon={<ReloadOutlined />} loading={isRefreshing} onClick={handleRefresh}>
                刷新
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                导出
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 订单表格 - 使用虚拟滚动优化 */}
      <Card bodyStyle={{ padding: '0px' }}>
        <VirtualTable
          columns={columns}
          dataSource={orders}
          rowKey="id"
          scroll={{ x: 1500, y: 600 }}
          pagination={{
            current: pagination?.page || 1,
            pageSize: pagination?.limit || 100,
            total: pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['50', '100', '200'],
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

export default AdminOrdersOptimized;