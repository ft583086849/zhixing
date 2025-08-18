import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Card, 
  Tag, 
  message, 
  Typography,
  Select,
  DatePicker,
  Form,
  Row,
  Col,
  Input,
  Space,
  Button,
  Tooltip,
  Badge
} from 'antd';
import { 
  SearchOutlined,
  ExportOutlined,
  CopyOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../services/supabase';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminCustomersOptimized = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 100,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
    pageSizeOptions: ['20', '50', '100', '200'],
  });

  // 复制到剪贴板
  const copyToClipboard = useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  }, []);

  // 获取客户数据
  const fetchCustomers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('customers_optimized')
        .select('*', { count: 'exact' });

      // 应用筛选条件
      if (params.customer_wechat) {
        query = query.ilike('customer_wechat', `%${params.customer_wechat}%`);
      }
      if (params.tradingview_username) {
        query = query.ilike('tradingview_username', `%${params.tradingview_username}%`);
      }
      if (params.sales_wechat) {
        query = query.or(`sales_wechat_name.ilike.%${params.sales_wechat}%,primary_sales_wechat.ilike.%${params.sales_wechat}%,secondary_sales_wechat.ilike.%${params.sales_wechat}%`);
      }
      if (params.sales_type) {
        query = query.eq('sales_type', params.sales_type);
      }
      if (params.total_orders_min !== undefined && params.total_orders_min !== '') {
        query = query.gte('total_orders', params.total_orders_min);
      }
      if (params.total_amount_min !== undefined && params.total_amount_min !== '') {
        query = query.gte('total_amount', params.total_amount_min);
      }
      if (params.days_since_last_order_max !== undefined && params.days_since_last_order_max !== '') {
        query = query.lte('days_since_last_order', params.days_since_last_order_max);
      }
      if (params.start_date && params.end_date) {
        query = query.gte('last_order_date', params.start_date)
                     .lte('last_order_date', params.end_date);
      }

      // 排序和分页
      const { current = 1, pageSize = 100 } = params.pagination || {};
      const from = (current - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .order('total_amount', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setCustomers(data || []);
      setPagination(prev => ({
        ...prev,
        current,
        pageSize,
        total: count || 0
      }));

      console.log(`✅ 成功加载 ${data?.length || 0} 个客户，总计 ${count || 0} 个`);
    } catch (error) {
      console.error('❌ 获取客户数据失败:', error);
      message.error('获取客户数据失败，请刷新页面重试');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化数据
  useEffect(() => {
    console.log('📦 AdminCustomersOptimized: 组件加载，开始获取客户数据');
    fetchCustomers({ pagination: { current: 1, pageSize: 100 } });
  }, [fetchCustomers]);

  // 处理搜索
  const handleSearch = () => {
    const values = form.getFieldsValue();
    
    const searchParams = {
      customer_wechat: values.customer_wechat,
      tradingview_username: values.tradingview_username,
      sales_wechat: values.sales_wechat,
      sales_type: values.sales_type,
      total_orders_min: values.total_orders_min,
      total_amount_min: values.total_amount_min,
      days_since_last_order_max: values.days_since_last_order_max,
      start_date: values.date_range?.[0]?.format('YYYY-MM-DD'),
      end_date: values.date_range?.[1]?.format('YYYY-MM-DD'),
      pagination: { current: 1, pageSize: pagination.pageSize }
    };
    
    // 移除空值
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key] === undefined || searchParams[key] === null || searchParams[key] === '') {
        delete searchParams[key];
      }
    });
    
    fetchCustomers(searchParams);
    message.success('搜索完成');
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    fetchCustomers({ pagination: { current: 1, pageSize: 100 } });
  };

  // 处理表格变化
  const handleTableChange = (newPagination) => {
    const values = form.getFieldsValue();
    fetchCustomers({
      ...values,
      pagination: newPagination
    });
  };

  // 获取客户状态标签
  const getCustomerStatusTag = (record) => {
    if (record.days_since_last_order === null) {
      return <Tag color="default">新客户</Tag>;
    } else if (record.days_since_last_order <= 30) {
      return <Tag color="green">活跃</Tag>;
    } else if (record.days_since_last_order <= 60) {
      return <Tag color="orange">沉睡</Tag>;
    } else {
      return <Tag color="red">流失</Tag>;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '客户信息',
      key: 'customer_info',
      width: 280,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Space>
              <UserOutlined />
              <span style={{ fontWeight: 500 }}>{record.customer_wechat || '-'}</span>
              {record.customer_wechat && (
                <Tooltip title="复制微信号">
                  <Button 
                    size="small" 
                    type="text" 
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(record.customer_wechat)}
                  />
                </Tooltip>
              )}
            </Space>
          </div>
          {record.tradingview_username && (
            <div style={{ fontSize: 12, color: '#666' }}>
              TV: {record.tradingview_username}
              <Tooltip title="复制TV用户名">
                <Button 
                  size="small" 
                  type="text" 
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(record.tradingview_username)}
                />
              </Tooltip>
            </div>
          )}
          {record.customer_name && (
            <div style={{ fontSize: 12, color: '#999' }}>
              姓名: {record.customer_name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '销售信息',
      key: 'sales_info',
      width: 280,
      render: (_, record) => {
        let salesTypeBadge = null;
        let primaryInfo = null;
        
        if (record.sales_type === 'primary') {
          salesTypeBadge = <Tag color="blue">一级</Tag>;
        } else if (record.sales_type === 'secondary') {
          salesTypeBadge = <Tag color="orange">二级</Tag>;
          if (record.primary_sales_wechat) {
            primaryInfo = (
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                上级: {record.primary_sales_wechat}
              </div>
            );
          }
        } else if (record.sales_type === 'independent') {
          salesTypeBadge = <Tag color="green">独立</Tag>;
        } else {
          salesTypeBadge = <Tag color="default">未分配</Tag>;
        }
        
        return (
          <div>
            <Space>
              <TeamOutlined />
              <span>{record.sales_wechat_name || '未分配'}</span>
              {salesTypeBadge}
              {record.sales_wechat_name && (
                <Tooltip title="复制销售微信">
                  <Button 
                    size="small" 
                    type="text" 
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(record.sales_wechat_name)}
                  />
                </Tooltip>
              )}
            </Space>
            {primaryInfo}
            {record.sales_code && (
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                销售码: {record.sales_code}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '客户状态',
      key: 'customer_status',
      width: 100,
      render: (_, record) => getCustomerStatusTag(record),
      filters: [
        { text: '活跃', value: 'active' },
        { text: '沉睡', value: 'sleep' },
        { text: '流失', value: 'lost' },
        { text: '新客户', value: 'new' }
      ],
      onFilter: (value, record) => {
        if (value === 'new') return record.days_since_last_order === null;
        if (value === 'active') return record.days_since_last_order <= 30;
        if (value === 'sleep') return record.days_since_last_order > 30 && record.days_since_last_order <= 60;
        if (value === 'lost') return record.days_since_last_order > 60;
        return false;
      }
    },
    {
      title: '订单统计',
      key: 'order_stats',
      width: 150,
      render: (_, record) => (
        <div>
          <Badge 
            count={record.total_orders || 0} 
            style={{ backgroundColor: '#52c41a' }}
            showZero
          />
          <span style={{ marginLeft: 8 }}>总订单</span>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            活跃: {record.active_orders || 0} | 待处理: {record.pending_orders || 0}
          </div>
        </div>
      ),
      sorter: (a, b) => (a.total_orders || 0) - (b.total_orders || 0),
    },
    {
      title: '消费金额',
      key: 'amounts',
      width: 180,
      render: (_, record) => (
        <div>
          <div>
            <DollarOutlined style={{ marginRight: 4 }} />
            <span style={{ fontWeight: 500, color: '#1890ff' }}>
              ${(record.total_amount || 0).toFixed(2)}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            已付: ${(record.total_paid_amount || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            佣金: ${(record.total_commission || 0).toFixed(2)}
          </div>
        </div>
      ),
      sorter: (a, b) => (a.total_amount || 0) - (b.total_amount || 0),
    },
    {
      title: '平均订单',
      dataIndex: 'avg_order_amount',
      key: 'avg_order_amount',
      width: 100,
      render: (amount) => amount ? `$${amount.toFixed(2)}` : '-',
      sorter: (a, b) => (a.avg_order_amount || 0) - (b.avg_order_amount || 0),
    },
    {
      title: '最近订单',
      key: 'last_order_info',
      width: 200,
      render: (_, record) => {
        if (!record.last_order_date) {
          return <span style={{ color: '#999' }}>暂无订单</span>;
        }
        
        const statusColorMap = {
          'active': 'green',
          'confirmed_config': 'blue',
          'confirmed_payment': 'cyan',
          'pending_payment': 'orange',
          'pending_config': 'gold',
          'cancelled': 'red',
          'rejected': 'red',
          'expired': 'default'
        };
        
        return (
          <div>
            <div>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {dayjs(record.last_order_date).format('YYYY-MM-DD')}
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              <Space>
                <Tag color={statusColorMap[record.last_order_status] || 'default'}>
                  {record.last_order_status || '未知'}
                </Tag>
                <span style={{ color: '#1890ff' }}>
                  ${(record.last_order_amount || 0).toFixed(2)}
                </span>
              </Space>
            </div>
            {record.days_since_last_order !== null && (
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                {record.days_since_last_order}天前
              </div>
            )}
          </div>
        );
      },
      sorter: (a, b) => {
        if (!a.last_order_date) return 1;
        if (!b.last_order_date) return -1;
        return new Date(b.last_order_date) - new Date(a.last_order_date);
      },
    },
    {
      title: '首单信息',
      key: 'first_order_info',
      width: 150,
      render: (_, record) => {
        if (!record.first_order_date) {
          return '-';
        }
        return (
          <div>
            <div style={{ fontSize: 12 }}>
              {dayjs(record.first_order_date).format('YYYY-MM-DD')}
            </div>
            <div style={{ fontSize: 12, color: '#1890ff', marginTop: 2 }}>
              ${(record.first_order_amount || 0).toFixed(2)}
            </div>
          </div>
        );
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
      sorter: (a, b) => {
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return new Date(b.created_at) - new Date(a.created_at);
      },
    },
  ];

  // 导出数据
  const handleExport = () => {
    if (!customers || customers.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }
    
    const exportData = customers.map(customer => ({
      '客户微信号': customer.customer_wechat || '',
      '客户姓名': customer.customer_name || '',
      'TradingView用户名': customer.tradingview_username || '',
      '销售微信号': customer.sales_wechat_name || '',
      '销售类型': customer.sales_type || '',
      '一级销售': customer.primary_sales_wechat || '',
      '总订单数': customer.total_orders || 0,
      '活跃订单数': customer.active_orders || 0,
      '待处理订单数': customer.pending_orders || 0,
      '总消费金额': customer.total_amount ? `$${customer.total_amount.toFixed(2)}` : '$0.00',
      '已付金额': customer.total_paid_amount ? `$${customer.total_paid_amount.toFixed(2)}` : '$0.00',
      '佣金金额': customer.total_commission ? `$${customer.total_commission.toFixed(2)}` : '$0.00',
      '平均订单金额': customer.avg_order_amount ? `$${customer.avg_order_amount.toFixed(2)}` : '$0.00',
      '最近订单日期': customer.last_order_date ? dayjs(customer.last_order_date).format('YYYY-MM-DD HH:mm') : '',
      '最近订单状态': customer.last_order_status || '',
      '最近订单金额': customer.last_order_amount ? `$${customer.last_order_amount.toFixed(2)}` : '',
      '距离上次订单天数': customer.days_since_last_order !== null ? customer.days_since_last_order : '',
      '首单日期': customer.first_order_date ? dayjs(customer.first_order_date).format('YYYY-MM-DD HH:mm') : '',
      '首单金额': customer.first_order_amount ? `$${customer.first_order_amount.toFixed(2)}` : '',
      '创建时间': customer.created_at ? dayjs(customer.created_at).format('YYYY-MM-DD HH:mm') : ''
    }));

    // 生成CSV内容
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `客户数据_优化版_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('客户数据导出成功');
  };

  return (
    <div style={{ padding: '0 24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        客户管理
        <Tag color="blue" style={{ marginLeft: 8 }}>优化版</Tag>
      </Title>

      {/* 搜索表单 */}
      <Card style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="customer_wechat" label="客户微信">
                <Input placeholder="请输入客户微信" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="tradingview_username" label="TV用户名">
                <Input placeholder="请输入TV用户名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="sales_wechat" label="销售微信">
                <Input placeholder="请输入销售微信" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="sales_type" label="销售类型">
                <Select placeholder="请选择销售类型" allowClear>
                  <Option value="primary">一级销售</Option>
                  <Option value="secondary">二级销售</Option>
                  <Option value="independent">独立销售</Option>
                  <Option value="unassigned">未分配</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="total_orders_min" label="最小订单数">
                <Input type="number" placeholder="最小订单数" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="total_amount_min" label="最小消费额">
                <Input type="number" placeholder="最小消费金额" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="days_since_last_order_max" label="最近活跃天数">
                <Input type="number" placeholder="天数" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="date_range" label="最近订单时间">
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
                  导出数据
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ fontSize: 14, color: '#666' }}>总客户数</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
              {pagination.total || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ fontSize: 14, color: '#666' }}>活跃客户</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#52c41a' }}>
              {customers.filter(c => c.days_since_last_order !== null && c.days_since_last_order <= 30).length}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ fontSize: 14, color: '#666' }}>总消费额</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#1890ff' }}>
              ${customers.reduce((sum, c) => sum + (c.total_amount || 0), 0).toFixed(2)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ fontSize: 14, color: '#666' }}>平均客单价</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
              ${(customers.reduce((sum, c) => sum + (c.avg_order_amount || 0), 0) / (customers.length || 1)).toFixed(2)}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 客户列表 */}
      <Card bodyStyle={{ padding: '0px' }}>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          scroll={{ 
            x: 1800,
            y: 'calc(100vh - 520px)'
          }}
          pagination={pagination}
          onChange={handleTableChange}
          loading={loading}
          locale={{
            emptyText: loading ? '加载中...' : '暂无客户数据'
          }}
        />
      </Card>
    </div>
  );
};

export default AdminCustomersOptimized;