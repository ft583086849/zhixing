import React, { useState } from 'react';
import { Card, Table, Tag, Button, message, Tooltip, Typography, Row, Col, Statistic, Form, Select, Input } from 'antd';
import { ExclamationCircleOutlined, BellOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { urgeOrder } from '../../store/slices/salesSlice';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

// 催单逻辑工具函数
const getReminderStatus = (order) => {
  if (!order.expiry_time) return null;
  
  const expiryDate = dayjs(order.expiry_time);
  const today = dayjs();
  const daysUntilExpiry = expiryDate.diff(today, 'day');
  
  // 只催已配置生效且马上到期的订单
  const isActiveOrder = order.status === 'confirmed_config' || order.status === 'active';
  if (!isActiveOrder) return null;
  
  // 根据金额判断催单时间
  const hasAmount = (order.total_amount > 0) || (order.amount > 0);
  const reminderDays = hasAmount ? 7 : 3; // 有金额7天，无金额3天
  
  // 未过期的催单
  if (daysUntilExpiry >= 0 && daysUntilExpiry <= reminderDays) {
    return {
      level: daysUntilExpiry <= 1 ? 'critical' : 'warning',
      text: `${daysUntilExpiry}天后到期`,
      daysUntilExpiry,
      needReminder: true
    };
  }
  
  // 已过期但在30天内的催单
  if (daysUntilExpiry < 0) {
    const daysOverdue = Math.abs(daysUntilExpiry);
    if (daysOverdue <= 30) {
      return {
        level: 'critical',
        text: `已过期${daysOverdue}天`,
        daysUntilExpiry,
        needReminder: true
      };
    }
  }
  
  return null;
};

// 获取催单颜色
const getReminderColor = (status) => {
  if (!status) return 'default';
  
  switch (status.level) {
    case 'critical': return 'red';
    case 'warning': return 'orange';
    default: return 'blue';
  }
};

const ReminderSection = ({ 
  reminderOrders = [], 
  reminderCount = 0, 
  primarySalesCode,
  onRefresh 
}) => {
  const dispatch = useDispatch();
  const [urgingOrders, setUrgingOrders] = useState(new Set());
  const [searchForm] = Form.useForm();
  const [filteredOrders, setFilteredOrders] = useState(reminderOrders);

  // 更新过滤后的订单
  React.useEffect(() => {
    setFilteredOrders(reminderOrders);
  }, [reminderOrders]);

  // 搜索过滤
  const handleSearch = (values) => {
    let filtered = reminderOrders;

    // 按销售分类过滤
    if (values.salesType) {
      if (values.salesType === 'primary') {
        filtered = filtered.filter(order => isOwnOrder(order));
      } else if (values.salesType === 'secondary') {
        filtered = filtered.filter(order => !isOwnOrder(order));
      }
    }

    // 按客户微信号过滤
    if (values.customerWechat) {
      const searchText = values.customerWechat.toLowerCase();
      filtered = filtered.filter(order => {
        const customerInfo = (order.customer_wechat || order.wechat_name || order.tradingview_username || '').toLowerCase();
        return customerInfo.includes(searchText);
      });
    }

    setFilteredOrders(filtered);
  };

  // 重置搜索
  const handleResetSearch = () => {
    searchForm.resetFields();
    setFilteredOrders(reminderOrders);
  };

  // 催单操作
  const handleUrgeOrder = async (order) => {
    try {
      setUrgingOrders(prev => new Set([...prev, order.id]));
      
      console.log('🔔 催单订单:', order.id);
      
      // 调用催单API
      const result = await dispatch(urgeOrder(order.id));
      
      if (result.type.endsWith('/fulfilled')) {
        message.success(`订单 ${order.id} 催单成功！`);
        
        // 刷新数据
        if (onRefresh) {
          setTimeout(onRefresh, 1000);
        }
      } else {
        message.error('催单失败，请重试');
      }
    } catch (error) {
      console.error('催单失败:', error);
      message.error('催单失败，请重试');
    } finally {
      setUrgingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  };

  // 判断是否是一级销售自己的订单
  const isOwnOrder = (order) => {
    return order.parent_sales_code === primarySalesCode || 
           order.sales_code === primarySalesCode ||
           !order.parent_sales_code; // 直接订单
  };

  // 统计数据
  const criticalCount = reminderOrders.filter(order => {
    const status = getReminderStatus(order);
    return status?.level === 'critical';
  }).length;
  
  const warningCount = reminderOrders.filter(order => {
    const status = getReminderStatus(order);
    return status?.level === 'warning';
  }).length;

  // 表格列配置
  const columns = [
    {
      title: '客户信息',
      key: 'customer_info',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.customer_wechat || record.wechat_name || record.tradingview_username || '未知客户'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            订单号: {record.id}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {isOwnOrder(record) ? 
              <Tag color="blue" size="small">一级直销</Tag> : 
              <Tag color="orange" size="small">二级销售</Tag>
            }
          </div>
        </div>
      ),
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (amount) => (
        <span style={{ 
          color: amount > 0 ? '#52c41a' : '#faad14',
          fontWeight: 'bold' 
        }}>
          ${parseFloat(amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: '到期时间',
      dataIndex: 'expiry_time',
      key: 'expiry_time',
      width: 120,
      render: (time) => {
        if (!time) return '-';
        return dayjs(time).format('MM-DD HH:mm');
      },
    },
    {
      title: '催单优先级',
      key: 'reminder_priority',
      width: 120,
      render: (_, record) => {
        const status = getReminderStatus(record);
        if (!status) return <Tag color="default">无需催单</Tag>;
        
        const color = getReminderColor(status);
        const icon = status.level === 'critical' ? <ExclamationCircleOutlined /> : <BellOutlined />;
        
        return (
          <Tag color={color} icon={icon}>
            {status.text}
          </Tag>
        );
      },
    },
    {
      title: '催单状态',
      dataIndex: 'is_reminded',
      key: 'is_reminded',
      width: 100,
      render: (isReminded) => (
        <Tag color={isReminded ? 'green' : 'orange'} 
             icon={isReminded ? <CheckCircleOutlined /> : <BellOutlined />}>
          {isReminded ? '已催单' : '未催单'}
        </Tag>
      ),
    },
    {
      title: '销售归属',
      key: 'sales_attribution',
      width: 120,
      render: (_, record) => {
        if (isOwnOrder(record)) {
          return (
            <div>
              <Tag color="blue">一级直销</Tag>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {primarySalesCode}
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <Tag color="orange">二级销售</Tag>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {record.parent_sales_code}
              </div>
            </div>
          );
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => {
        const isOwn = isOwnOrder(record);
        const isUrging = urgingOrders.has(record.id);
        const status = getReminderStatus(record);
        
        if (!status?.needReminder) {
          return <span style={{ color: '#ccc' }}>无需催单</span>;
        }
        
        if (isOwn) {
          return (
            <Button 
              type="primary"
              size="small"
              icon={<BellOutlined />}
              loading={isUrging}
              onClick={() => handleUrgeOrder(record)}
              disabled={record.is_reminded}
            >
              {record.is_reminded ? '已催单' : '催单'}
            </Button>
          );
        } else {
          return (
            <Tooltip title="二级销售的订单由对应销售员自行催单">
              <Button 
                type="default"
                size="small"
                disabled
                ghost
              >
                仅查看
              </Button>
            </Tooltip>
          );
        }
      },
    },
  ];

  // 如果没有催单数据，不显示
  if (reminderCount === 0 || reminderOrders.length === 0) {
    return null;
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BellOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          待催单客户管理
        </div>
      }
      style={{ marginTop: 24 }}
    >
      {/* 搜索表单 */}
      <div style={{ marginBottom: 16, padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
        <Form 
          form={searchForm} 
          layout="inline" 
          onFinish={handleSearch}
        >
          <Form.Item name="salesType" label="销售分类">
            <Select placeholder="请选择销售分类" style={{ width: 150 }} allowClear>
              <Option value="primary">一级销售</Option>
              <Option value="secondary">二级销售</Option>
            </Select>
          </Form.Item>
          <Form.Item name="customerWechat" label="客户微信">
            <Input placeholder="请输入客户微信号" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleResetSearch}>重置</Button>
          </Form.Item>
        </Form>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待催单总数"
              value={reminderCount}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="紧急催单"
              value={criticalCount}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预警催单"
              value={warningCount}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="催单完成率"
              value={reminderOrders.filter(o => o.is_reminded).length}
              suffix={`/ ${reminderOrders.length}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 催单说明 */}
      <div style={{ 
        marginBottom: 16, 
        padding: '12px', 
        background: '#f6ffed', 
        border: '1px solid #b7eb8f',
        borderRadius: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <ExclamationCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          <strong>催单规则说明：</strong>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          • <Tag color="red">紧急</Tag>：已过期或1天内到期的订单
          • <Tag color="orange">预警</Tag>：有金额订单7天内到期，免费订单3天内到期
          • <Tag color="blue">一级直销</Tag>：可执行催单操作
          • <Tag color="orange">二级销售</Tag>：仅显示，由对应销售员催单
        </div>
      </div>

      {/* 催单订单列表 */}
      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
        }}
        scroll={{ x: 800 }}
        size="small"
        rowClassName={(record) => {
          const status = getReminderStatus(record);
          if (status?.level === 'critical') return 'reminder-critical-row';
          if (status?.level === 'warning') return 'reminder-warning-row';
          return '';
        }}
      />

      <style>{`
        .reminder-critical-row {
          background-color: #fff2f0 !important;
        }
        .reminder-warning-row {
          background-color: #fffbe6 !important;
        }
        .reminder-critical-row:hover,
        .reminder-warning-row:hover {
          background-color: #fafafa !important;
        }
      `}</style>
    </Card>
  );
};

export default ReminderSection;