/**
 * 销售管理页面 - 优化版本
 * 使用 sales_optimized 表提升性能
 * 
 * 主要优化：
 * 1. 查询单表 sales_optimized 而非 primary_sales + secondary_sales
 * 2. 使用预计算的统计字段，不再实时计算
 * 3. 简化佣金计算逻辑
 * 4. 减少数据处理开销
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
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
  Form,
  Input,
  Select,
  Row,
  Col,
  DatePicker,
  Statistic,
  Progress,
  Checkbox,
  Modal
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
  HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSales, updateCommissionRate, downloadCommissionData } from '../../store/slices/adminSlice';
import { AdminAPI } from '../../services/api';
import { SupabaseService } from '../../services/supabase';
// import DataRefreshManager from '../../utils/dataRefresh'; // 暂时不使用
import { 
  formatCommissionRate, 
  formatCommissionAmount
} from '../../utils/commissionUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminSalesOptimized = () => {
  const dispatch = useDispatch();
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [editForm] = Form.useForm();
  const [salesTypeFilter, setSalesTypeFilter] = useState('all');
  const [commissionFilter, setCommissionFilter] = useState('all');
  const [includeTeam, setIncludeTeam] = useState(false); // 是否包含团队成员
  const [commissionRates, setCommissionRates] = useState({});
  const [loadingSalesCode, setLoadingSalesCode] = useState(null);
  const [editingPaidCommission, setEditingPaidCommission] = useState({});
  const [paidCommissionForm] = Form.useForm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [teamMembers, setTeamMembers] = useState({});
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [commissionHistory, setCommissionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentHistorySales, setCurrentHistorySales] = useState(null);
  
  // 统计数据
  const [statistics, setStatistics] = useState({
    totalSales: 0,
    primaryCount: 0,
    secondaryCount: 0,
    independentCount: 0,
    totalAmount: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0
  });

  useEffect(() => {
    // 初始加载数据
    fetchOptimizedSales();
    
    // 设置定时刷新（可选）
    const interval = setInterval(() => {
      fetchOptimizedSales();
    }, 30000); // 每30秒刷新一次
    
    return () => clearInterval(interval);
  }, []);

  // 获取团队成员数据
  const fetchTeamMembers = async (primarySalesCode) => {
    try {
      // 获取该一级销售的所有下级
      const { data, error } = await SupabaseService.supabase
        .from('sales_optimized')
        .select('*')
        .eq('parent_sales_code', primarySalesCode);
      
      if (!error && data) {
        setTeamMembers(prev => ({
          ...prev,
          [primarySalesCode]: data
        }));
      }
    } catch (error) {
      message.error('获取团队成员失败');
    }
  };

  // 获取优化后的销售数据
  const fetchOptimizedSales = async () => {
    setLoading(true);
    try {
      const response = await AdminAPI.getSalesOptimized();
      if (response && response.success) {
        // 计算统计数据
        calculateStatistics(response.data);
        
        // 不使用Redux，直接设置本地state
        setSalesData(response.data);
        
        message.success(`加载了 ${response.data.length} 条销售数据`);
      } else {
        message.error(response.message || '加载失败');
      }
    } catch (error) {
      message.error('获取销售数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算统计数据
  const calculateStatistics = (salesData) => {
    const stats = {
      totalSales: salesData.length,
      primaryCount: 0,
      secondaryCount: 0,
      independentCount: 0,
      totalAmount: 0,
      totalCommission: 0,
      paidCommission: 0,
      pendingCommission: 0
    };

    salesData.forEach(sale => {
      // 销售类型统计
      if (sale.sales_type === 'primary') {
        stats.primaryCount++;
      } else if (sale.sales_type === 'secondary') {
        stats.secondaryCount++;
      } else if (sale.sales_type === 'independent') {
        stats.independentCount++;
      }

      // 金额统计（使用预计算字段）
      stats.totalAmount += sale.total_amount || 0;
      stats.totalCommission += sale.total_commission || 0;
      stats.paidCommission += sale.paid_commission || 0;
    });

    stats.pendingCommission = stats.totalCommission - stats.paidCommission;
    setStatistics(stats);
  };

  // 处理搜索
  const handleSearch = () => {
    const values = form.getFieldsValue();
    
    // 如果勾选了"包含团队成员"，直接使用本地过滤
    if (includeTeam && values.wechat_name) {
      // 不需要调用API，直接触发重新渲染
      // getFilteredData 会处理团队成员的展示
      return;
    }
    
    // 构建查询参数
    const params = {};
    
    if (values.sales_type && values.sales_type !== 'all') {
      params.sales_type = values.sales_type;
    }
    
    if (values.wechat_name) {
      params.wechat_name = values.wechat_name;
    }
    
    if (values.phone) {
      params.phone = values.phone;
    }
    
    if (values.date_range && values.date_range.length === 2) {
      params.start_date = values.date_range[0].format('YYYY-MM-DD');
      params.end_date = values.date_range[1].format('YYYY-MM-DD');
    }
    
    // 调用优化后的API
    fetchOptimizedSalesWithParams(params);
  };

  // 带参数获取销售数据
  const fetchOptimizedSalesWithParams = async (params) => {
    try {
      const response = await AdminAPI.getSalesOptimized(params);
      if (response.success) {
        calculateStatistics(response.data);
        setSalesData(response.data);
        message.success('搜索完成');
      }
    } catch (error) {
      message.error('搜索失败');
    }
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    setSalesTypeFilter('all');
    setCommissionFilter('all');
    setIncludeTeam(false);
    fetchOptimizedSales();
    message.info('已重置搜索条件');
  };

  // 导出佣金数据
  const handleExport = async () => {
    try {
      await dispatch(downloadCommissionData()).unwrap();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 编辑佣金率
  const handleEditCommission = (record) => {
    editForm.setFieldsValue({
      commission_rate: record.commission_rate * 100 // 转换为百分比
    });
    setEditingKey(record.id);
  };

  // 保存佣金率
  const handleSaveCommission = async (record) => {
    try {
      const values = await editForm.validateFields();
      const newRate = values.commission_rate / 100; // 转换为小数
      
      const response = await AdminAPI.updateSalesCommission(record.id, newRate);
      
      if (response.success) {
        message.success('佣金率更新成功');
        setEditingKey('');
        fetchOptimizedSales();
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingKey('');
  };

  // 查看佣金率历史
  const handleViewHistory = async (record) => {
    setCurrentHistorySales(record);
    setHistoryLoading(true);
    setHistoryModalVisible(true);
    
    try {
      const { data, error } = await SupabaseService.supabase
        .from('commission_rate_history')
        .select('*')
        .eq('sales_code', record.sales_code)
        .order('effective_date', { ascending: false });
      
      if (!error && data) {
        setCommissionHistory(data);
      } else {
        message.error('获取历史记录失败');
        setCommissionHistory([]);
      }
    } catch (error) {
      message.error('获取历史记录失败');
      setCommissionHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 计算平均二级佣金率（一级销售的下级平均佣金率）
  const calculateAvgSecondaryRate = (record) => {
    // 平均二级佣金率 = 团队分成 / 团队销售额
    if (record.sales_type === 'primary' && record.total_team_amount > 0) {
      const avgRate = (record.secondary_commission_amount / record.total_team_amount) * 100;
      return avgRate.toFixed(1);
    }
    return null;
  };

  // 表格列定义
  const columns = [
    {
      title: '销售信息',
      key: 'info',
      fixed: 'left',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            {record.sales_type === 'primary' && (
              <Tag icon={<CrownOutlined />} color="gold">一级</Tag>
            )}
            {record.sales_type === 'secondary' && (
              <Tag icon={<TeamOutlined />} color="blue">二级</Tag>
            )}
            {record.sales_type === 'independent' && (
              <Tag color="green">独立</Tag>
            )}
            <Text strong>{record.wechat_name || '未设置微信号'}</Text>
            <Button
              type="link"
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(record.wechat_name || '');
                message.success(`微信号 ${record.wechat_name} 已复制`);
              }}
              style={{ padding: '0 4px' }}
            >
              复制
            </Button>
          </Space>
          <Space>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.sales_code}
            </Text>
          </Space>
          {record.parent_sales_name && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              上级: {record.parent_sales_name}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '销售统计',
      key: 'stats',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Statistic
            title="总订单"
            value={record.total_orders || 0}
            valueStyle={{ fontSize: 14 }}
          />
          <Statistic
            title="总金额"
            value={record.total_amount || 0}
            prefix="$"
            precision={2}
            valueStyle={{ fontSize: 14 }}
          />
        </Space>
      )
    },
    {
      title: '直销业绩',
      key: 'direct',
      width: 160,
      render: (_, record) => {
        if (record.sales_type !== 'primary') return '-';
        return (
          <Space direction="vertical" size="small">
            <Statistic
              title="直销订单"
              value={record.total_direct_orders || 0}
              valueStyle={{ fontSize: 14 }}
            />
            <Statistic
              title="直销金额"
              value={record.total_direct_amount || 0}
              prefix="$"
              precision={2}
              valueStyle={{ fontSize: 14 }}
            />
          </Space>
        );
      }
    },
    {
      title: '团队业绩',
      key: 'team',
      width: 160,
      render: (_, record) => {
        if (record.sales_type !== 'primary') return '-';
        return (
          <Space direction="vertical" size="small">
            <Statistic
              title="团队人数"
              value={record.team_size || 0}
              valueStyle={{ fontSize: 14 }}
            />
            <Statistic
              title="团队订单"
              value={record.total_team_orders || 0}
              valueStyle={{ fontSize: 14 }}
            />
            <Statistic
              title="团队金额"
              value={record.total_team_amount || 0}
              prefix="$"
              precision={2}
              valueStyle={{ fontSize: 14 }}
            />
          </Space>
        );
      }
    },
    {
      title: '收款地址',
      key: 'payment_info',
      width: 180,
      render: (_, record) => {
        const paymentAccount = record.payment_account || record.payment_info || '';
        const chainName = record.chain_name || '';
        
        // 判断是否是加密货币地址
        const isCryptoAddress = paymentAccount && (
          paymentAccount.startsWith('0x') || 
          paymentAccount.startsWith('T') ||
          chainName !== ''
        );
        
        if (!paymentAccount) {
          return (
            <Text type="warning" style={{ fontSize: 12 }}>未设置收款信息</Text>
          );
        }
        
        return (
          <Space size="small">
            {chainName && (
              <Tag color="blue" style={{ fontSize: 11 }}>{chainName}</Tag>
            )}
            <Tooltip title={paymentAccount}>
              <Text style={{ fontSize: 12 }}>
                {isCryptoAddress && paymentAccount.length > 10 
                  ? `${paymentAccount.slice(0, 6)}...${paymentAccount.slice(-4)}`
                  : paymentAccount
                }
              </Text>
            </Tooltip>
            <Button
              type="link"
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(paymentAccount);
                message.success('收款账号已复制');
              }}
            >
              复制
            </Button>
          </Space>
        );
      }
    },
    {
      title: '佣金率',
      key: 'commission_rates',
      width: 200,
      render: (_, record) => {
        const isEditing = editingKey === record.id;
        
        if (isEditing) {
          return (
            <Space direction="vertical" size="small">
              <Form form={editForm} component={false}>
                <Form.Item
                  name="commission_rate"
                  style={{ margin: 0 }}
                  rules={[
                    { required: true, message: '请输入佣金率' },
                    { type: 'number', min: 0, max: 100, message: '佣金率必须在0-100之间' }
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    formatter={value => `${value}%`}
                    parser={value => value.replace('%', '')}
                    style={{ width: 100 }}
                  />
                </Form.Item>
              </Form>
              <Space size="small">
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0 }}
                  onClick={() => handleSaveCommission(record)}
                >
                  保存
                </Button>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0 }}
                  onClick={handleCancelEdit}
                >
                  取消
                </Button>
              </Space>
            </Space>
          );
        }
        
        return (
          <div>
            {record.sales_type === 'primary' ? (
              <div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, marginRight: 8 }}>直销:</span>
                  <Tag color="blue" style={{ marginRight: 8 }}>{((record.commission_rate || 0.4) * 100).toFixed(1)}%</Tag>
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: 'auto', marginRight: 4 }}
                    icon={<EditOutlined />}
                    onClick={() => handleEditCommission(record)}
                  />
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: 'auto' }}
                    icon={<HistoryOutlined />}
                    onClick={() => handleViewHistory(record)}
                    title="查看历史"
                  />
                </div>
                <div>
                  <span style={{ fontSize: 12, marginRight: 8 }}>二级:</span>
                  <Tag color="purple">{calculateAvgSecondaryRate(record) || '15.0'}%</Tag>
                </div>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: 12, marginRight: 8 }}>佣金率:</span>
                <Tag color="green" style={{ marginRight: 8 }}>{((record.commission_rate || 0.25) * 100).toFixed(1)}%</Tag>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: 'auto', marginRight: 4 }}
                  icon={<EditOutlined />}
                  onClick={() => handleEditCommission(record)}
                />
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: 'auto' }}
                  icon={<HistoryOutlined />}
                  onClick={() => handleViewHistory(record)}
                  title="查看历史"
                />
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '佣金明细',
      key: 'commission',
      width: 220,
      render: (_, record) => {
        return (
          <div>
            {record.sales_type === 'primary' && (
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#666', marginRight: 16 }}>
                  直销: ${(record.primary_commission_amount || 0).toFixed(2)}
                </span>
                <span style={{ fontSize: 12, color: '#666' }}>
                  分销: ${(record.secondary_commission_amount || 0).toFixed(2)}
                </span>
              </div>
            )}
            
            <div style={{ marginBottom: 6 }}>
              <Space size="small">
                <Text>总佣金:</Text>
                <Text strong style={{ color: '#52c41a' }}>
                  ${(record.total_commission || 0).toFixed(2)}
                </Text>
              </Space>
            </div>
            
            <div style={{ marginBottom: 6 }}>
              <Space size="small">
                <Text type="secondary" style={{ fontSize: 12 }}>已返:</Text>
                {editingPaidCommission[record.id] !== undefined ? (
                <Space>
                  <InputNumber
                    size="small"
                    min={0}
                    value={editingPaidCommission[record.id]}
                    onChange={(value) => setEditingPaidCommission({...editingPaidCommission, [record.id]: value})}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    style={{ width: 100 }}
                  />
                  <Button
                    type="link"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={async () => {
                      const amount = editingPaidCommission[record.id];
                      if (amount !== undefined && amount >= 0) {
                        try {
                          const { error } = await SupabaseService.supabase
                            .from('sales_optimized')
                            .update({ paid_commission: amount })
                            .eq('id', record.id);
                          if (!error) {
                            message.success('已返佣金更新成功');
                            const newEditing = {...editingPaidCommission};
                            delete newEditing[record.id];
                            setEditingPaidCommission(newEditing);
                            fetchOptimizedSales();
                          }
                        } catch (err) {
                          message.error('更新失败');
                        }
                      }
                    }}
                  />
                  <Button
                    type="link"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      const newEditing = {...editingPaidCommission};
                      delete newEditing[record.id];
                      setEditingPaidCommission(newEditing);
                    }}
                  />
                </Space>
              ) : (
                <Space>
                  <Text>${(record.paid_commission || 0).toFixed(2)}</Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setEditingPaidCommission({...editingPaidCommission, [record.id]: record.paid_commission || 0})}
                  />
                </Space>
              )}
              </Space>
            </div>
            
            <div>
              <Space>
                <Text type="secondary">待返:</Text>
                <Text type="danger">
                  ${((record.total_commission || 0) - (record.paid_commission || 0)).toFixed(2)}
                </Text>
              </Space>
            </div>
          </div>
        );
      }
    },
    {
      title: '链接',
      key: 'links',
      width: 120,
      render: (_, record) => {
        // 生成购买链接和分销注册链接
        const baseUrl = 'https://zhixing-seven.vercel.app';
        const purchaseLink = `${baseUrl}/purchase/${record.sales_code}`;
        const registerLink = record.sales_type === 'primary' ? 
          `${baseUrl}/secondary-registration/${record.sales_code}` : null;
        
        return (
          <Space direction="vertical" size="small">
            <Tooltip title="用户购买链接">
              <Button
                type="link"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(purchaseLink);
                  message.success('购买链接已复制');
                }}
              >
                购买链接
              </Button>
            </Tooltip>
            {registerLink && (
              <Tooltip title="分销注册链接">
                <Button
                  type="link"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(registerLink);
                    message.success('注册链接已复制');
                  }}
                >
                  注册链接
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      }
    }
  ];

  // 获取过滤后的数据（包含团队成员展示）
  const getFilteredData = () => {
    let filteredData = salesData || [];
    
    // 销售类型过滤
    if (salesTypeFilter !== 'all') {
      filteredData = filteredData.filter(sale => sale.sales_type === salesTypeFilter);
    }
    
    // 佣金状态过滤
    if (commissionFilter !== 'all') {
      filteredData = filteredData.filter(sale => {
        const pending = (sale.total_commission || 0) - (sale.paid_commission || 0);
        
        switch(commissionFilter) {
          case 'pending':
            return pending > 0;
          case 'paid':
            return sale.paid_commission > 0 && pending === 0;
          case 'none':
            return sale.total_commission === 0;
          default:
            return true;
        }
      });
    }
    
    // 如果开启了"包含团队"选项，且搜索的是一级销售
    if (includeTeam) {
      const searchWechat = form.getFieldValue('wechat_name');
      if (searchWechat) {
        // 找出符合搜索条件的一级销售
        const primarySales = salesData.find(
          sale => sale.sales_type === 'primary' && 
          sale.wechat_name && 
          sale.wechat_name.toLowerCase().includes(searchWechat.toLowerCase())
        );
        
        if (primarySales) {
          // 获取该一级销售的团队成员
          const teamMembers = salesData.filter(
            sale => sale.parent_sales_code === primarySales.sales_code
          );
          
          // 重新构建结果：一级销售 + 团队成员
          filteredData = [primarySales, ...teamMembers];
        }
      }
    }
    
    return filteredData;
  };

  return (
    <div style={{ padding: 24 }}>
      
      <Title level={2}>
        <TeamOutlined /> 销售管理
      </Title>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ height: 140 }}>
            <Statistic
              title="总销售人数"
              value={statistics.totalSales}
              prefix={<TeamOutlined />}
            />
            <div style={{ marginTop: 8, height: 24 }}>
              <Space>
                <Tag color="gold">一级: {statistics.primaryCount}</Tag>
                <Tag color="blue">二级: {statistics.secondaryCount}</Tag>
                <Tag color="green">独立: {statistics.independentCount}</Tag>
              </Space>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ height: 140 }}>
            <Statistic
              title="总销售额"
              value={statistics.totalAmount}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 8, height: 24 }}>
              {/* 占位保持高度一致 */}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ height: 140 }}>
            <Statistic
              title="应返佣金"
              value={statistics.totalCommission}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, height: 24 }}>
              <Text type="secondary">已返: ${statistics.paidCommission.toFixed(2)}</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ height: 140 }}>
            <Statistic
              title="待返佣金"
              value={statistics.pendingCommission}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#cf1322' }}
            />
            <div style={{ marginTop: 8, height: 24 }}>
              <Progress 
                percent={Math.round((statistics.paidCommission / statistics.totalCommission) * 100) || 0}
                size="small"
              />
            </div>
          </Card>
        </Col>
      </Row>
      
      {/* 搜索和筛选 - 全部在一行 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Form.Item name="sales_type" label="销售类型">
            <Select style={{ width: 120 }} placeholder="全部" allowClear>
              <Option value="all">全部</Option>
              <Option value="primary">一级销售</Option>
              <Option value="secondary">二级销售</Option>
              <Option value="independent">独立销售</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="wechat_name" label="微信名">
            <Input placeholder="请输入微信名" style={{ width: 150 }} />
          </Form.Item>
          
          <Form.Item>
            <Checkbox 
              checked={includeTeam} 
              onChange={(e) => setIncludeTeam(e.target.checked)}
            >
              包含团队成员
            </Checkbox>
          </Form.Item>
          
          <Form.Item label="快速筛选" style={{ marginLeft: 20 }}>
            <Space>
              <Select
                value={salesTypeFilter}
                onChange={setSalesTypeFilter}
                style={{ width: 120 }}
              >
                <Option value="all">全部类型</Option>
                <Option value="primary">一级销售</Option>
                <Option value="secondary">二级销售</Option>
                <Option value="independent">独立销售</Option>
              </Select>
              
              <Select
                value={commissionFilter}
                onChange={setCommissionFilter}
                style={{ width: 120 }}
              >
                <Option value="all">全部状态</Option>
                <Option value="pending">待返佣</Option>
                <Option value="paid">已返佣</Option>
                <Option value="none">无佣金</Option>
              </Select>
            </Space>
          </Form.Item>
          
          <Form.Item style={{ marginLeft: 'auto' }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
              <Button type="primary" onClick={handleExport} icon={<ExportOutlined />}>
                导出数据
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      
      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={getFilteredData()}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1500 }}
          // expandable={{
          //   expandedRowKeys,
          //   onExpandedRowsChange: (keys) => {
          //     setExpandedRowKeys(keys);
          //     // 展开时加载团队成员
          //     keys.forEach(key => {
          //       const record = getFilteredData().find(r => r.id === key);
          //       if (record && record.sales_type === 'primary' && !teamMembers[record.sales_code]) {
          //         fetchTeamMembers(record.sales_code);
          //       }
          //     });
          //   },
          //   rowExpandable: (record) => record.sales_type === 'primary' && record.team_size > 0,
          //   expandedRowRender: (record) => {
          //     const members = teamMembers[record.sales_code] || [];
          //     return (
          //       <div style={{ padding: '0 20px' }}>
          //         <Title level={5}>团队成员（{members.length} 人）</Title>
          //         <Table
          //           size="small"
          //           columns={[
          //             { title: '微信号', dataIndex: 'wechat_name', key: 'wechat_name' },
          //             { title: '类型', dataIndex: 'sales_type', key: 'sales_type',
          //               render: (type) => type === 'independent' ? '独立' : '二级' },
          //             { title: '订单数', dataIndex: 'total_orders', key: 'total_orders' },
          //             { title: '销售额', dataIndex: 'total_amount', key: 'total_amount',
          //               render: (val) => `$${(val || 0).toFixed(2)}` },
          //             { title: '佣金', dataIndex: 'total_commission', key: 'total_commission',
          //               render: (val) => `$${(val || 0).toFixed(2)}` }
          //           ]}
          //           dataSource={members}
          //           rowKey="id"
          //           pagination={false}
          //         />
          //       </div>
          //     );
          //   }
          // }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 佣金率历史模态框 */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            佣金率历史记录
            {currentHistorySales && (
              <Tag color="blue">{currentHistorySales.wechat_name || currentHistorySales.sales_code}</Tag>
            )}
          </Space>
        }
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Table
          loading={historyLoading}
          dataSource={commissionHistory}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            {
              title: '生效时间',
              dataIndex: 'effective_date',
              key: 'effective_date',
              width: 180,
              render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
            },
            {
              title: '旧佣金率',
              dataIndex: 'old_rate',
              key: 'old_rate',
              width: 100,
              render: (rate) => rate ? `${(rate * 100).toFixed(1)}%` : '-'
            },
            {
              title: '新佣金率',
              dataIndex: 'new_rate',
              key: 'new_rate',
              width: 100,
              render: (rate) => (
                <Tag color="blue">{(rate * 100).toFixed(1)}%</Tag>
              )
            },
            {
              title: '修改人',
              dataIndex: 'changed_by',
              key: 'changed_by',
              width: 100
            },
            {
              title: '修改原因',
              dataIndex: 'change_reason',
              key: 'change_reason',
              ellipsis: true
            }
          ]}
        />
        {commissionHistory.length === 0 && !historyLoading && (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            暂无历史记录
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminSalesOptimized;