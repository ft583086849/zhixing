import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Tag, 
  message, 
  Typography, 
  Tooltip,
  InputNumber,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  CopyOutlined,
  SearchOutlined,
  ExportOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  CrownOutlined,
  TeamOutlined,
  FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSales, updateCommissionRate, downloadCommissionData } from '../../store/slices/adminSlice';

const { Title } = Typography;
const { Option } = Select;

const AdminSales = () => {
  const dispatch = useDispatch();
  const { sales, loading } = useSelector((state) => state.admin);
  const [form] = Form.useForm();
  const [editingCommissionRates, setEditingCommissionRates] = useState({});
  const [paidCommissionData, setPaidCommissionData] = useState({});
  const [salesTypeFilter, setSalesTypeFilter] = useState('all'); // 新增：销售类型筛选

  useEffect(() => {
    dispatch(getSales());
  }, [dispatch]);

  // 获取佣金率
  const fetchCommissionRates = async () => {
    // 这里应该调用API获取佣金率数据
    console.log('获取佣金率数据');
  };

  useEffect(() => {
    fetchCommissionRates();
  }, []);

  // 计算自动佣金率
  const calculateAutoCommissionRate = (orders) => {
    if (!orders || orders.length === 0) return 0;
    
    const totalAmount = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const validOrders = orders.filter(order => order.status === 'confirmed_configuration');
    
    if (validOrders.length === 0) return 0;
    
    // 根据总金额计算佣金率
    if (totalAmount >= 1000) return 15;
    if (totalAmount >= 500) return 12;
    if (totalAmount >= 200) return 10;
    return 8;
  };

  // 处理搜索
  const handleSearch = () => {
    const searchValues = form.getFieldsValue();
    console.log('搜索条件:', searchValues);
    // 实现搜索逻辑
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    dispatch(getSales());
  };

  // 导出数据
  const handleExport = () => {
    console.log('导出销售数据');
    // 实现导出逻辑
    const exportData = sales.map(sale => ({
      '销售ID': sale.sales?.id,
      '销售类型': sale.sales?.sales_type === 'primary' ? '一级销售' : '二级销售',
      '微信名称': sale.sales?.wechat_name,
      '链接代码': sale.link_code,
      '层级关系': getHierarchyInfo(sale),
      '总订单数': sale.total_orders,
      '有效订单数': sale.valid_orders,
      '总金额': sale.total_amount,
      '佣金率': `${sale.sales?.commission_rate || 0}%`,
      '创建时间': sale.sales?.created_at
    }));

    // 创建CSV内容
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    // 下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `销售数据_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('销售数据导出成功');
  };

  // 复制链接
  const handleCopyLink = async (linkCode) => {
    const link = `${window.location.origin}/#/purchase/${linkCode}`;
    try {
      await navigator.clipboard.writeText(link);
      message.success('链接已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  // 复制链接代码
  const handleCopyCode = async (linkCode) => {
    try {
      await navigator.clipboard.writeText(linkCode);
      message.success('链接代码已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  // 计算佣金金额
  const calculateCommissionAmount = (orders, commissionRate) => {
    if (!orders || orders.length === 0) return 0;
    const validOrders = orders.filter(order => order.status === 'confirmed_configuration');
    const totalAmount = validOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    return (totalAmount * commissionRate) / 100;
  };

  // 获取最终佣金率
  const getFinalCommissionRate = (record) => {
    const salesId = record.sales?.id;
    return editingCommissionRates[salesId] || record.sales?.commission_rate || 0;
  };

  // 处理已返佣金额变化
  const handlePaidCommissionChange = (salesId, value) => {
    setPaidCommissionData(prev => ({
      ...prev,
      [salesId]: value || 0
    }));
  };

  // 处理佣金率编辑
  const handleCommissionRateEdit = (salesId, autoRate) => {
    setEditingCommissionRates(prev => ({
      ...prev,
      [salesId]: autoRate
    }));
  };

  // 确认佣金率
  const handleConfirmCommissionRate = async (salesId, record) => {
    try {
      const newRate = editingCommissionRates[salesId];
      await dispatch(updateCommissionRate({ salesId, commissionRate: newRate })).unwrap();
      
      // 清除编辑状态
      setEditingCommissionRates(prev => {
        const newState = { ...prev };
        delete newState[salesId];
        return newState;
      });
      
      message.success('佣金率更新成功');
    } catch (error) {
      message.error('佣金率更新失败');
    }
  };

  // 取消佣金率编辑
  const handleCancelCommissionRate = (salesId) => {
    setEditingCommissionRates(prev => {
      const newState = { ...prev };
      delete newState[salesId];
      return newState;
    });
  };

  // 下载佣金数据
  const handleDownloadCommissionData = () => {
    dispatch(downloadCommissionData());
  };

  // 处理销售类型筛选
  const handleSalesTypeFilter = (value) => {
    setSalesTypeFilter(value);
    // 这里可以调用API重新获取数据，或者在前端过滤
    console.log('销售类型筛选:', value);
  };

  // 获取销售类型标签
  const getSalesTypeTag = (salesType) => {
    if (salesType === 'primary') {
      return <Tag color="red" icon={<CrownOutlined />}>一级销售</Tag>;
    } else if (salesType === 'secondary') {
      return <Tag color="green" icon={<TeamOutlined />}>二级销售</Tag>;
    }
    return <Tag color="default">未知</Tag>;
  };

  // 获取层级关系信息
  const getHierarchyInfo = (record) => {
    if (record.sales_type === 'primary') {
      return `管理 ${record.secondary_sales_count || 0} 个二级销售`;
    } else if (record.sales_type === 'secondary') {
      return `隶属于: ${record.primary_sales_name || '未知'}`;
    }
    return '';
  };

  // 表格列定义
  const columns = [
    {
      title: '销售ID',
      dataIndex: ['sales', 'id'],
      key: 'sales_id',
      width: 80,
    },
    {
      title: '销售类型',
      key: 'sales_type',
      width: 120,
      render: (_, record) => getSalesTypeTag(record.sales?.sales_type || 'secondary'),
    },
    {
      title: '销售微信',
      dataIndex: ['sales', 'wechat_name'],
      key: 'wechat_name',
      width: 120,
    },
    {
      title: '层级关系',
      key: 'hierarchy',
      width: 150,
      render: (_, record) => (
        <Tooltip title={getHierarchyInfo(record)}>
          <span style={{ color: '#666', fontSize: '12px' }}>
            {getHierarchyInfo(record)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '链接代码',
      dataIndex: 'link_code',
      key: 'link_code',
      width: 120,
      render: (code) => (
        <Space size="small">
          <span>{code}</span>
          <Tooltip title="复制链接代码">
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={() => handleCopyCode(code)}
            />
          </Tooltip>
        </Space>
      )
    },
    {
      title: '总订单数',
      dataIndex: 'total_orders',
      key: 'total_orders',
      width: 100,
    },
    {
      title: '有效订单数',
      dataIndex: 'valid_orders',
      key: 'valid_orders',
      width: 100,
      render: (_, record) => {
        const validOrders = record.orders?.filter(order => order.status === 'confirmed_configuration') || [];
        return validOrders.length;
      }
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (_, record) => {
        const totalAmount = record.orders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
        return `$${totalAmount.toFixed(2)}`;
      }
    },
    {
      title: '佣金率',
      key: 'commission_rate',
      width: 120,
      render: (_, record) => {
        const salesId = record.sales?.id;
        const autoRate = calculateAutoCommissionRate(record.orders);
        const currentRate = editingCommissionRates[salesId] || record.sales?.commission_rate || autoRate;
        const finalRate = getFinalCommissionRate(record);
        
        if (editingCommissionRates[salesId] !== undefined) {
          return (
            <Space size="small">
              <InputNumber
                size="small"
                min={0}
                max={100}
                value={currentRate}
                onChange={(value) => handleCommissionRateEdit(salesId, value)}
                style={{ width: 60 }}
              />
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleConfirmCommissionRate(salesId, record)}
              />
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleCancelCommissionRate(salesId)}
              />
            </Space>
          );
        } else {
          return (
            <Space size="small">
              <Tag color={finalRate === autoRate ? "blue" : "green"}>{currentRate}%</Tag>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleCommissionRateEdit(salesId, finalRate)}
              />
            </Space>
          );
        }
      }
    },
    {
      title: '有效订单金额',
      key: 'valid_order_amount',
      width: 120,
      render: (_, record) => {
        const validOrders = record.orders?.filter(order => order.status === 'confirmed_configuration') || [];
        const totalAmount = validOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
        return `$${totalAmount.toFixed(2)}`;
      }
    },
    {
      title: '应返佣金额',
      key: 'commission_amount',
      width: 120,
      render: (_, record) => {
        const salesId = record.sales?.id;
        const finalRate = getFinalCommissionRate(record);
        const commissionRate = editingCommissionRates[salesId] || finalRate;
        const commissionAmount = calculateCommissionAmount(record.orders, commissionRate);
        return `$${commissionAmount.toFixed(2)}`;
      }
    },
    {
      title: '已返佣金额',
      key: 'paid_commission',
      width: 150,
      render: (_, record) => {
        const salesId = record.sales?.id;
        const currentValue = paidCommissionData[salesId] || 0;
        
        return (
          <Space size="small">
            <InputNumber
              size="small"
              min={0}
              step={0.01}
              value={currentValue}
              formatter={value => `$${value}`}
              parser={value => value.replace('$', '')}
              style={{ width: 80 }}
              placeholder="已返佣"
              onChange={(value) => handlePaidCommissionChange(salesId, value)}
            />
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => {
                message.success('已返佣金额已确认');
              }}
            >
              确认
            </Button>
          </Space>
        );
      }
    },
    {
      title: '待返佣状态',
      key: 'pending_commission_status',
      width: 100,
      render: (_, record) => {
        const salesId = record.sales?.id;
        const finalRate = getFinalCommissionRate(record);
        const commissionRate = editingCommissionRates[salesId] || finalRate;
        const commissionAmount = calculateCommissionAmount(record.orders, commissionRate);
        const paidAmount = paidCommissionData[salesId] || 0;
        const pendingAmount = commissionAmount - paidAmount;
        
        if (pendingAmount > 0) {
          return <Tag color="orange">待返佣</Tag>;
        } else if (pendingAmount < 0) {
          return <Tag color="red">超额</Tag>;
        } else {
          return <Tag color="green">已结清</Tag>;
        }
      }
    },
    {
      title: '层级关系',
      key: 'hierarchy',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {getSalesTypeTag(record.sales_type)}
          <Divider type="vertical" />
          <span>{getHierarchyInfo(record)}</span>
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: ['sales', 'created_at'],
      key: 'created_at',
      width: 150,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    }
  ];

  return (
    <div>
      <Title level={2}>销售管理</Title>

      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <span>销售类型：</span>
            <Select
              value={salesTypeFilter}
              onChange={handleSalesTypeFilter}
              style={{ width: '100%', marginTop: 8 }}
              placeholder="选择销售类型"
            >
              <Option value="all">全部销售</Option>
              <Option value="primary">一级销售</Option>
              <Option value="secondary">二级销售</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="search" style={{ marginBottom: 0 }}>
              <Input
                placeholder="搜索微信名或链接代码"
                prefix={<SearchOutlined />}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              type="primary" 
              onClick={handleExport} 
              icon={<ExportOutlined />}
              style={{ float: 'right' }}
            >
              导出数据
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 销售列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={sales}
          rowKey={record => record.sales?.id || record.id}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          loading={loading}
          scroll={{ x: 1500 }}
        />
      </Card>
    </div>
  );
};

export default AdminSales; 