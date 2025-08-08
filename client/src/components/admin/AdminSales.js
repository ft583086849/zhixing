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
  Divider,
  DatePicker
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
import { 
  formatCommissionRate, 
  calculatePrimaryCommissionRate as calculateRate,
  percentToDecimal,
  decimalToPercent,
  formatCommissionAmount
} from '../../utils/commissionUtils';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminSales = () => {
  const dispatch = useDispatch();
  const { sales, loading } = useSelector((state) => state.admin);
  const [form] = Form.useForm();
  const [editingCommissionRates, setEditingCommissionRates] = useState({});
  const [paidCommissionData, setPaidCommissionData] = useState({});
  const [salesTypeFilter, setSalesTypeFilter] = useState('all'); // 新增：销售类型筛选
  const [commissionRateOptions, setCommissionRateOptions] = useState([]); // 动态佣金比率选项

  useEffect(() => {
    dispatch(getSales());
  }, [dispatch]);

  // 动态生成佣金比率选项
  useEffect(() => {
    if (sales && sales.length > 0) {
      const uniqueRates = new Set();
      sales.forEach(sale => {
        // 🔧 修复：直接使用API返回的commission_rate
        const rate = sale.commission_rate || sale.sales?.commission_rate;
        if (rate && rate > 0) {
          uniqueRates.add(rate);
        }
      });
      
      // 转换为选项数组并排序
      const options = Array.from(uniqueRates)
        .filter(rate => rate && rate > 0)
        .sort((a, b) => a - b)
        .map(rate => ({ value: rate, label: `${rate}%` }));
      
      setCommissionRateOptions(options);
    }
  }, [sales]);

  // 获取佣金率
  const fetchCommissionRates = async () => {
    // 这里应该调用API获取佣金率数据
    // 实际生产环境中应该调用相应的API
  };

  useEffect(() => {
    fetchCommissionRates();
  }, []);

  // 计算自动佣金率
  const calculateAutoCommissionRate = (orders) => {
    if (!orders || orders.length === 0) return 0;
    
    const totalAmount = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const validOrders = orders.filter(order => order.status === 'confirmed_config');
    
    if (validOrders.length === 0) return 0;
    
    // 根据总金额计算佣金率
    if (totalAmount >= 1000) return 15;
    if (totalAmount >= 500) return 12;
    if (totalAmount >= 200) return 10;
    return 8;
  };

  // 计算一级销售佣金比率（管理员页面）
  const calculatePrimaryCommissionRate = (record) => {
    if (!record.orders || record.orders.length === 0) {
      return 40; // 返回百分比数字用于显示
    }
    
    const confirmedOrders = record.orders;
    if (confirmedOrders.length === 0) {
      return 40;
    }
    
    // 计算各项金额（使用sales_type判断）
    const primaryDirectOrders = confirmedOrders.filter(order => order.sales_type !== 'secondary');
    const primaryDirectAmount = primaryDirectOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    
    const secondaryOrders = confirmedOrders.filter(order => order.sales_type === 'secondary');
    const secondaryTotalAmount = secondaryOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    
    // 获取二级销售佣金率（确保是小数格式）
    const secondaryRates = record.secondary_sales?.map(sales => {
      const rate = sales.commission_rate || 0.3;
      // 兼容处理：如果是百分比则转换
      return rate > 1 ? rate / 100 : rate;
    }) || [];
    
    // 使用工具函数计算
    const rate = calculateRate({
      primaryDirectAmount,
      secondaryTotalAmount,
      secondaryRates
    });
    
    // 返回百分比数字用于显示
    return parseFloat((rate * 100).toFixed(1));
  };

  // 处理搜索
  const handleSearch = () => {
    const searchValues = form.getFieldsValue();
    
    // 构建搜索参数
    const searchParams = {};
    
    if (searchValues.sales_type) {
      searchParams.sales_type = searchValues.sales_type;
    }
    
    if (searchValues.wechat_name) {
      searchParams.wechat_name = searchValues.wechat_name;
    }
    
    if (searchValues.phone) {
      searchParams.phone = searchValues.phone;
    }
    
    if (searchValues.commission_rate) {
      searchParams.commission_rate = searchValues.commission_rate;
    }
    
    // 调用API搜索
    dispatch(getSales(searchParams));
    message.success('搜索完成');
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    setSalesTypeFilter('all');
    dispatch(getSales());
    message.info('已重置搜索条件');
  };

  // 导出数据
  const handleExport = () => {
    // 实现导出逻辑
    const exportData = sales.map(sale => ({
      '销售类型': sale.sales?.sales_type === 'primary' ? '一级销售' : '二级销售',
      '微信号': sale.sales?.wechat_name,
      '销售代码': sale.sales?.sales_code,
      '层级关系': getHierarchyInfo(sale),
      '总订单数': sale.total_orders,
      '有效订单数': sale.valid_orders,
      '总金额': sale.total_amount,
      '已配置确认订单金额': sale.confirmed_amount || 0,
      '佣金率': `${sale.commission_rate || sale.sales?.commission_rate || 0}%`,
      '应返佣金额': sale.commission_amount || 0,
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
  const handleCopyLink = async (fullUrl) => {
    try {
      await navigator.clipboard.writeText(fullUrl);
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

  // 计算佣金金额（计算所有已配置确认的订单）
  const calculateCommissionAmount = (orders, commissionRate) => {
    if (!orders || orders.length === 0) return 0;
    // 计算已配置确认的订单（移除config_confirmed过滤）
    const validOrders = orders.filter(order => 
      order.status === 'confirmed_config'
    );
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
      // 🔧 修复：根据数据库当前格式决定存储格式
      // 如果当前值小于1（说明是小数格式），则转换为小数存储
      let rateToStore = newRate;
      if (record.sales?.commission_rate && record.sales.commission_rate < 1) {
        // 数据库是小数格式，转换百分比为小数
        rateToStore = newRate / 100;
      }
      
      console.log('更新佣金率:', { 
        salesId, 
        输入值: newRate, 
        存储值: rateToStore,
        salesType: record.sales_type 
      });
      
      // 🔧 修复：传递salesType参数
      await dispatch(updateCommissionRate({ 
        salesId, 
        commissionRate: rateToStore,
        salesType: record.sales_type || 'secondary'
      })).unwrap();
      
      // 清除编辑状态
      setEditingCommissionRates(prev => {
        const newState = { ...prev };
        delete newState[salesId];
        return newState;
      });
      
      message.success('佣金率更新成功');
      // 刷新销售数据
      dispatch(getSales());
    } catch (error) {
      console.error('佣金率更新失败:', error);
      message.error('佣金率更新失败: ' + (error.message || '未知错误'));
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
    // 🔧 修复：使用正确的字段和销售类型判断
    const salesType = record.sales_type || record.sales?.sales_type;
    if (salesType === 'primary') {
      // 使用API返回的secondary_sales_count字段
      const count = record.secondary_sales_count || 0;
      return `管理 ${count} 个二级销售`;
    } else if (salesType === 'secondary') {
      // 使用hierarchy_info字段或默认值
      return record.hierarchy_info || `二级销售`;
    }
    return '';
  };

  // 表格列定义
  const columns = [
    {
      title: '销售类型',
      key: 'sales_type',
      width: 120,
      render: (_, record) => getSalesTypeTag(record.sales?.sales_type || 'secondary'),
    },
    {
      title: '销售微信号',
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
      render: (value) => value || 0  // 🔧 修复：直接使用API返回的valid_orders
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (value) => value ? `$${value.toFixed(2)}` : '$0.00'  // 🔧 修复：直接使用API返回的total_amount
    },
    {
      title: '佣金率',
      key: 'commission_rate',
      width: 120,
      render: (_, record) => {
        const salesId = record.sales?.id;
        // 🔧 修复：直接使用API返回的commission_rate，支持显示0或未设置的佣金率
        const currentRate = editingCommissionRates[salesId] !== undefined 
          ? editingCommissionRates[salesId]
          : (record.commission_rate !== undefined ? record.commission_rate : (record.sales?.commission_rate || 0));
        
        // 🔧 修复：一级销售和二级销售都可以编辑佣金率
        if (editingCommissionRates[salesId] !== undefined) {
          return (
            <Space size="small">
              <InputNumber
                size="small"
                min={0}
                max={100}
                value={editingCommissionRates[salesId]}
                onChange={(value) => handleCommissionRateEdit(salesId, value)}
                style={{ width: 80 }}
                addonAfter="%"
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
          // 根据销售类型显示不同颜色的标签
          const tagColor = record.sales_type === 'primary' ? 'green' : 'blue';
          return (
            <Space size="small">
              <Tag color={tagColor}>{currentRate}%</Tag>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleCommissionRateEdit(salesId, currentRate)}
              />
            </Space>
          );
        }
      }
    },
    {
      title: '已配置确认订单金额',
      dataIndex: 'confirmed_amount',
      key: 'confirmed_amount',
      width: 140,
      render: (value) => value ? `$${value.toFixed(2)}` : '$0.00'  // 🔧 修复：使用API返回的confirmed_amount字段
    },
    {
      title: '应返佣金额',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      width: 120,
      render: (value) => value ? `$${value.toFixed(2)}` : '$0.00'  // 🔧 修复：直接使用API返回的commission_amount
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
        const commissionAmount = record.commission_amount || 0;  // 🔧 修复：使用API返回的commission_amount
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '销售链接',
      key: 'links',
      width: 300,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {record.links && record.links.map((link, index) => (
            <div key={index} style={{ 
              padding: 8, 
              border: '1px solid #e8e8e8', 
              borderRadius: 4, 
              backgroundColor: '#fafafa' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 4 
              }}>
                <Tag color={link.type === 'sales_register' ? 'orange' : 'blue'}>
                  {link.title}
                </Tag>
                <Space size="small">
                  <Tooltip title="复制链接">
                    <Button
                      type="link"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyLink(link.fullUrl)}
                    />
                  </Tooltip>
                  <Tooltip title="复制代码">
                    <Button
                      type="link"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyCode(link.code)}
                    />
                  </Tooltip>
                </Space>
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                代码: {link.code}
              </div>
              <div style={{ fontSize: 11, color: '#999' }}>
                {link.description}
              </div>
            </div>
          ))}
          {(!record.links || record.links.length === 0) && (
            <span style={{ color: '#ccc' }}>暂无链接</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>销售管理</Title>

      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            {/* 第一行 */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="sales_type" label="销售类型">
                <Select 
                  placeholder="选择销售类型" 
                  allowClear
                  value={salesTypeFilter}
                  onChange={handleSalesTypeFilter}
                >
                  <Option value="all">全部销售</Option>
                  <Option value="primary">一级销售</Option>
                  <Option value="secondary">二级销售</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="wechat_name" label="销售微信号">
                <Input placeholder="请输入销售微信号" />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="payment_method" label="收款方式">
                <Select placeholder="请选择收款方式" allowClear>
                  <Option value="alipay">支付宝</Option>
                  <Option value="crypto">链上地址</Option>
                </Select>
              </Form.Item>
            </Col>
            
            {/* 第二行 */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="create_date_range" label="创建时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="commission_rate" label="佣金比率">
                <Select placeholder="请选择佣金比率" allowClear>
                  {commissionRateOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
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
        </Form>
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