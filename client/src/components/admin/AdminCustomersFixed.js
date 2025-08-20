import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  Tooltip
} from 'antd';
import { 
  SearchOutlined,
  ExportOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getCustomers } from '../../store/slices/adminSlice';
import { formatCommissionAmount } from '../../utils/commissionUtils';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminCustomers = () => {
  const dispatch = useDispatch();
  const { customers, loading } = useSelector((state) => state.admin);
  const [form] = Form.useForm();
  // 移除未使用的状态变量以避免警告

  // 初始化数据
  useEffect(() => {
    console.log('📦 AdminCustomers: 组件加载，开始获取客户数据');
    dispatch(getCustomers())
      .then((result) => {
        console.log('getCustomers返回结果:', result);
        if (result.error) {
          console.error('❌ 获取客户数据失败 - Redux错误:', result.error);
          message.error(`获取客户数据失败: ${result.error}`);
        } else if (result.payload && result.payload.length > 0) {
          console.log(`✅ 成功加载 ${result.payload.length} 个客户`);
        } else {
          console.warn('⚠️ 没有获取到客户数据');
          // 显示提示信息
          message.warning('暂无客户数据，可能是权限问题或数据库为空');
        }
      })
      .catch((error) => {
        console.error('❌ 获取客户数据失败 - Promise错误:', error);
        message.error('获取客户数据失败，请刷新页面重试');
      });
  }, [dispatch]);

  // 移除未使用的LoadingSkeleton组件

  // 处理搜索
  const handleSearch = () => {
    const searchValues = form.getFieldsValue();
    console.log('搜索条件:', searchValues);
    
    // 转换参数名以匹配后端API
    const apiParams = {
      customer_wechat: searchValues.customer_wechat,
      sales_wechat: searchValues.sales_wechat,
      is_reminded: searchValues.remind_status,
      reminder_suggestion: searchValues.reminder_suggestion,
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
      title: '客户微信号',
      dataIndex: 'customer_wechat',
      key: 'customer_wechat',
      width: 130,
      fixed: 'left',
    },
    {
      title: 'TradingView用户',
      dataIndex: 'tradingview_username',
      key: 'tradingview_username',
      width: 150,
    },
    {
      title: '销售微信号',
      dataIndex: 'sales_wechat_name',
      key: 'sales_wechat_name',
      width: 260,
      render: (text, record) => {
        // 判断销售类型和层级关系
        let salesTypeBadge = null;
        let primarySalesName = null;
        
        // 根据sales_type判断类型
        if (record.sales_type === 'primary') {
          salesTypeBadge = <Tag color="blue">一级</Tag>;
        } else if (record.sales_type === 'secondary') {
          // 检查是否有上级
          if (record.primary_sales_name) {
            salesTypeBadge = <Tag color="orange">二级</Tag>;
            primarySalesName = record.primary_sales_name;
          } else {
            salesTypeBadge = <Tag color="green">独立</Tag>;
          }
        } else {
          // 备用逻辑
          if (record.primary_sales_name) {
            salesTypeBadge = <Tag color="orange">二级</Tag>;
            primarySalesName = record.primary_sales_name;
          } else {
            salesTypeBadge = <Tag color="green">独立</Tag>;
          }
        }
        
        return (
          <Space size="small">
            {text || '-'}
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
        // 使用 expiry_time 字段（订单表的正确字段）
        if (record.expiry_time) {
          const expiryDate = dayjs(record.expiry_time);
          const today = dayjs();
          const daysUntilExpiry = expiryDate.diff(today, 'day');
          
          // 只催已配置生效且马上到期的订单
          const isActiveOrder = record.status === 'confirmed_config' || record.status === 'active';
          
          if (isActiveOrder && daysUntilExpiry >= 0) {
            // 根据金额判断催单时间
            const hasAmount = record.total_amount > 0 || record.amount > 0;
            const reminderDays = hasAmount ? 7 : 3; // 有金额7天，无金额3天
            
            if (daysUntilExpiry <= reminderDays) {
              return (
                <Tag color="red" icon={<ExclamationCircleOutlined />}>
                  建议催单({daysUntilExpiry}天)
                </Tag>
              );
            }
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
        
        // 只催已配置生效且马上到期的订单
        const isActiveOrder = record.status === 'confirmed_config' || record.status === 'active';
        const hasAmount = record.total_amount > 0 || record.amount > 0;
        const reminderDays = hasAmount ? 7 : 3;
        
        const needReminder = isActiveOrder && 
                            daysUntilExpiry >= 0 && 
                            daysUntilExpiry <= reminderDays;
        
        return value === 'need_reminder' ? needReminder : !needReminder;
      }
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
      title: '实付金额',
      dataIndex: 'actual_payment_amount',
      key: 'actual_payment_amount',
      width: 100,
      render: (amount) => `$${parseFloat(amount || 0).toFixed(2)}`,
    },
    {
      title: '返佣金额',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      width: 100,
      render: (amount) => formatCommissionAmount(amount),
    },
    {
      title: '到期时间',
      dataIndex: 'expiry_time',
      key: 'expiry_time',
      width: 150,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },

  ];

  return (
    <div style={{ padding: '0 24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>客户管理</Title>

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
              <Form.Item name="sales_wechat" label="销售微信号">
                <Input placeholder="请输入销售微信号" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="reminder_suggestion" label="催单建议">
                <Select placeholder="请选择催单状态" allowClear>
                  <Option value="need_reminder">建议催单</Option>
                  <Option value="no_reminder">无需催单</Option>
                </Select>
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
              <Form.Item name="config_confirmed_filter" label="配置确认状态">
                <Select placeholder="选择配置确认状态" allowClear>
                  <Option value="all">全部订单</Option>
                  <Option value="confirmed">已配置确认</Option>
                  <Option value="pending">待配置确认</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
                <Button icon={<ExportOutlined />} onClick={() => {
                  if (!customers || customers.length === 0) {
                    message.warning('暂无数据可导出');
                    return;
                  }
                  
                  // 准备导出数据
                  const exportData = customers.map(customer => ({
                    '客户微信号': customer.customer_wechat || '',
                    'TradingView用户名': customer.tradingview_username || '',
                    '销售微信号': customer.sales_wechat_name || '',
                    '总订单数': customer.total_orders || 0,
                    '总金额': customer.total_amount ? `$${customer.total_amount}` : '$0',
                    '实付金额': customer.actual_payment_amount ? `$${parseFloat(customer.actual_payment_amount).toFixed(2)}` : '$0.00',
                    '返佣金额': customer.commission_amount ? `$${parseFloat(customer.commission_amount).toFixed(2)}` : '$0.00',
                    '订单时长': customer.duration_text || customer.duration || '',
                    '到期时间': customer.expiry_time ? new Date(customer.expiry_time).toLocaleString('zh-CN') : '',
                    '催单状态': customer.is_reminded ? '已催单' : '未催单',
                    '订单状态': customer.status_text || customer.status || '',
                    '创建时间': customer.created_at ? new Date(customer.created_at).toLocaleString('zh-CN') : ''
                  }));

                  if (exportData.length === 0) {
                    message.warning('没有数据可导出');
                    return;
                  }

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
                  link.setAttribute('download', `客户数据_${new Date().toISOString().split('T')[0]}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  message.success('客户数据导出成功');
                }}>
                  导出数据
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 客户列表 */}
      <Card bodyStyle={{ padding: '0px' }}>
        <Table
          columns={columns}
          dataSource={Array.isArray(customers) ? customers : []}
          rowKey={(record, index) => `${record.customer_wechat}-${record.tradingview_username}-${index}`}
          scroll={{ 
            x: 1600,  // 设置横向滚动（增加了催单建议和层级信息）
            y: 'calc(100vh - 420px)'  // 设置纵向高度
          }}
          pagination={{
            pageSize: 100,
            defaultPageSize: 100,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['20', '50', '100', '200'],
          }}
          loading={loading}
          locale={{
            emptyText: loading ? '加载中...' : '暂无客户数据（可能是权限问题或没有订单）'
          }}
        />
      </Card>




    </div>
  );
};

export default AdminCustomers; 