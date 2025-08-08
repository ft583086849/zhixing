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
  Button
} from 'antd';
import { 
  SearchOutlined,
  ExportOutlined
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
        if (result.payload && result.payload.length > 0) {
          console.log(`✅ 成功加载 ${result.payload.length} 个客户`);
        } else {
          console.warn('⚠️ 没有获取到客户数据');
          // 显示提示信息
          message.warning('暂无客户数据，可能是权限问题或数据库为空');
        }
      })
      .catch((error) => {
        console.error('❌ 获取客户数据失败:', error);
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
      dataIndex: 'sales_wechat_name',
      key: 'sales_wechat_name',
      width: 120,
      // 🔧 修复：添加渲染函数处理空值
      render: (text) => text || '-'
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
      <Card>
        <Table
          columns={columns}
          dataSource={Array.isArray(customers) ? customers : []}
          rowKey={(record, index) => `${record.customer_wechat}-${record.tradingview_username}-${index}`}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            defaultPageSize: 20,  // 默认每页20条
            pageSizeOptions: ['10', '20', '50', '100'],  // 可选每页显示数量
            defaultCurrent: 1  // 默认第一页
          }}
          loading={loading}
          scroll={{ x: 1400 }}
          locale={{
            emptyText: loading ? '加载中...' : '暂无客户数据（可能是权限问题或没有订单）'
          }}
        />
      </Card>




    </div>
  );
};

export default AdminCustomers; 