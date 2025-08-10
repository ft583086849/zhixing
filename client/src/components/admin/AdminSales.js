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
  FilterOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSales, updateCommissionRate, downloadCommissionData } from '../../store/slices/adminSlice';
import { AdminAPI } from '../../services/api';
import DataRefreshManager from '../../utils/dataRefresh';
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
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [editingCommissionRates, setEditingCommissionRates] = useState({});
  const [paidCommissionData, setPaidCommissionData] = useState({});
  const [salesTypeFilter, setSalesTypeFilter] = useState('all'); // 新增：销售类型筛选
  const [commissionRateOptions, setCommissionRateOptions] = useState([]); // 动态佣金比率选项
  const [commissionFilter, setCommissionFilter] = useState('all'); // 🔧 新增：佣金筛选条件

  useEffect(() => {
    // 检查URL参数
    const filterParam = searchParams.get('filter');
    if (filterParam === 'pending_commission') {
      // 设置佣金筛选为待返佣
      setCommissionFilter('pending');
      form.setFieldsValue({ commission_filter: 'pending' });
    }
    dispatch(getSales());
  }, [dispatch, searchParams]);

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
    // 🔧 修复：直接使用API返回的commission_rate
    // 如果有用户设置的佣金率，直接使用
    if (record.commission_rate !== undefined && record.commission_rate !== null) {
      return record.commission_rate;
    }
    
    // 如果没有订单，返回默认值
    if (!record.orders || record.orders.length === 0) {
      return record.sales?.sales_type === 'primary' ? 40 : 25;
    }
    
    // 其他情况使用默认值
    return record.sales?.sales_type === 'primary' ? 40 : 25;
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
    
    // 🔧 新增：保存佣金筛选条件
    if (searchValues.commission_filter) {
      searchParams.commission_filter = searchValues.commission_filter;
      setCommissionFilter(searchValues.commission_filter);
    } else {
      setCommissionFilter('all');
    }
    
    // 调用API搜索
    dispatch(getSales(searchParams));
    message.success('搜索完成');
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    setSalesTypeFilter('all');
    setCommissionFilter('all');  // 🔧 重置佣金筛选条件
    // 🔧 修复：重置时强制刷新数据，不使用任何过滤条件
    dispatch(getSales({}));  // 传递空对象确保获取所有数据
    message.info('已重置搜索条件');
  };
  
  // 🔧 新增：根据佣金筛选条件过滤销售数据
  const getFilteredSales = () => {
    if (!sales || !Array.isArray(sales)) return [];
    
    let filteredData = [...sales];
    
    // 应用佣金筛选
    if (commissionFilter && commissionFilter !== 'all') {
      filteredData = filteredData.filter(sale => {
        const commissionAmount = sale.commission_amount || 0;
        
        switch(commissionFilter) {
          case 'pending': {
            // 待返佣：应返佣金额 > 已返佣金额
            const salesId = sale.sales?.id;
            const dbValue = sale.sales?.paid_commission || sale.paid_commission || 0;
            const paidAmount = paidCommissionData[salesId] !== undefined ? paidCommissionData[salesId] : dbValue;
            const pendingAmount = commissionAmount - paidAmount;
            return pendingAmount > 0;
          }
          case 'gt1':
            return commissionAmount > 1;
          case 'gt10':
            return commissionAmount > 10;
          case 'gt100':
            return commissionAmount > 100;
          case 'eq0':
            return commissionAmount === 0;
          default:
            return true;
        }
      });
    }
    
    return filteredData;
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
      '应返佣金额': calculateCommissionAmount(sale),
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

  // 计算佣金金额（基于已配置确认订单金额）
  const calculateCommissionAmount = (record) => {
    // 🔧 修复：使用confirmed_amount和commission_rate计算
    const confirmedAmount = record.confirmed_amount || 0;
    const rate = getFinalCommissionRate(record);
    
    // 如果没有已配置确认订单金额，应返佣金为0
    if (confirmedAmount === 0) return 0;
    
    // 计算应返佣金
    return (confirmedAmount * rate) / 100;
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
      // 🔧 统一处理：全部转换为小数格式存储
      let rateToStore;
      
      // 特别处理：允许设置为0
      if (newRate === 0) {
        rateToStore = 0; // 直接设置为0
      } else {
        // 统一转换为小数格式（0-1之间）
        // 用户输入的是百分比（如25），转换为小数（0.25）
        rateToStore = newRate / 100;
      }
      
      // 处理浮点数精度问题
      rateToStore = Math.round(rateToStore * 10000) / 10000;
      
      // 🔧 修复：获取正确的salesId和salesType（支持一级销售和独立销售）
      const actualSalesId = record.sales?.id;
      const actualSalesType = record.sales?.sales_type || record.sales_type || 'secondary';
      
      // 🔧 修复：独立销售需要特殊处理
      // 独立销售在数据库中是secondary_sales表，但sales_type是'independent'
      let tableType = actualSalesType;
      if (actualSalesType === 'independent') {
        tableType = 'secondary';  // 独立销售实际存在secondary_sales表中
      }
      
      if (!actualSalesId) {
        console.error('无法获取销售ID，当前record数据:', record);
        throw new Error('无法获取销售ID');
      }
      
      console.log('更新佣金率:', { 
        salesId: actualSalesId, 
        输入值: newRate, 
        存储值: rateToStore,
        salesType: actualSalesType,
        tableType: tableType,  // 实际更新的表类型
        record: record 
      });
      
      // 🔧 修复：使用正确的参数（独立销售使用secondary表）
      await dispatch(updateCommissionRate({ 
        salesId: actualSalesId, 
        commissionRate: rateToStore,
        salesType: tableType  // 使用tableType而不是actualSalesType
      })).unwrap();
      
      // 清除编辑状态
      setEditingCommissionRates(prev => {
        const newState = { ...prev };
        delete newState[salesId];
        return newState;
      });
      
      message.success('佣金率更新成功');
      // 刷新销售数据和统计数据
      setTimeout(async () => {
        await DataRefreshManager.onCommissionUpdate();
        dispatch(getSales());
      }, 500);
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
    } else if (salesType === 'independent') {
      return <Tag color="blue">独立销售</Tag>;  // 🔧 修复：添加独立销售标签
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
    } else if (salesType === 'independent') {
      // 🔧 修复：独立销售显示独立运营
      return record.hierarchy_info || '独立运营';
    }
    return '';
  };

  // 表格列定义
  const columns = [
    {
      title: '销售类型',
      key: 'sales_type',
      width: 100,
      fixed: 'left',
      render: (_, record) => getSalesTypeTag(record.sales?.sales_type || 'secondary'),
    },
    {
      title: '销售微信号',
      dataIndex: ['sales', 'wechat_name'],
      key: 'wechat_name',
      width: 130,
      fixed: 'left',
    },
    {
      title: '层级关系',
      key: 'hierarchy',
      width: 120,
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
      width: 90,
    },
    {
      title: '有效订单数',
      dataIndex: 'valid_orders',
      key: 'valid_orders',
      width: 110,
      render: (value) => value || 0  // 🔧 修复：直接使用API返回的valid_orders
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 110,
      render: (value) => value ? `$${value.toFixed(2)}` : '$0.00'  // 🔧 修复：直接使用API返回的total_amount
    },
    {
      title: '佣金率',
      key: 'commission_rate',
      width: 140,
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
                style={{ width: 120 }}  // 🔧 修复：增大输入框宽度
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
      width: 180,
      render: (value) => value ? `$${value.toFixed(2)}` : '$0.00'  // 🔧 修复：使用API返回的confirmed_amount字段
    },
    {
      title: '应返佣金额',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      width: 130,
      render: (value) => value ? `$${value.toFixed(2)}` : '$0.00'  // 🔧 修复：直接使用API返回的commission_amount
    },
    {
      title: '已返佣金额',
      key: 'paid_commission',
      width: 180,
      render: (_, record) => {
        const salesId = record.sales?.id;
        // 🔧 优先使用用户输入的值，如果没有则使用数据库值
        const dbValue = record.sales?.paid_commission || record.paid_commission || 0;
        const currentValue = paidCommissionData[salesId] !== undefined ? paidCommissionData[salesId] : dbValue;
        const displayValue = currentValue ? `$${currentValue.toFixed(2)}` : '$0.00';
        
        return (
          <div>
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
                onClick={async () => {
                  const amount = paidCommissionData[salesId] || 0;
                  const result = await AdminAPI.updatePaidCommission(
                    salesId,
                    record.sales_type || record.sales_display_type,
                    amount
                  );
                  
                  if (result.success) {
                    message.success('已返佣金额已保存');
                    // 刷新销售和统计数据
                    await DataRefreshManager.onCommissionUpdate();
                    dispatch(getSales());
                  } else {
                    message.error(`保存失败: ${result.error}`);
                  }
                }}
              >
                确认
              </Button>
            </Space>
            <div style={{ marginTop: 4 }}>
              <Space size="small">
                <span style={{ fontSize: 12, color: '#666' }}>{displayValue}</span>
                {dbValue > 0 && (
                  <span style={{ fontSize: 11, color: '#999' }}>
                    (数据库: ${dbValue.toFixed(2)})
                  </span>
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(displayValue);
                    message.success('已复制金额');
                  }}
                />
              </Space>
            </div>
          </div>
        );
      }
    },
    {
      title: '支付时间',
      key: 'last_commission_paid_at',
      width: 160,
      render: (_, record) => {
        const paidAt = record.sales?.last_commission_paid_at;
        if (!paidAt) return '-';
        const date = new Date(paidAt);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    {
      title: '收款地址',
      key: 'payment_address',
      width: 220,
      render: (_, record) => {
        // 🔧 说明：payment_account从API层兼容获取（payment_account || payment_address）
        // 旧数据存在payment_address字段，新数据存在payment_account字段
        const paymentAccount = record.sales?.payment_account || '-';
        const paymentMethod = record.sales?.payment_method;
        const chainName = record.sales?.chain_name;
        
        // 如果是加密货币地址，截断显示
        if ((paymentMethod === 'crypto' || paymentAccount.startsWith('0x')) && paymentAccount.length > 10) {
          const shortAddress = `${paymentAccount.slice(0, 4)}...${paymentAccount.slice(-4)}`;
          return (
            <Tooltip title={
              <div>
                {chainName && <div style={{ marginBottom: 4 }}>链名: {chainName}</div>}
                <div>{paymentAccount}</div>
              </div>
            }>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px' }}>
                  {chainName && <Tag color="blue" style={{ marginRight: 4 }}>{chainName}</Tag>}
                  {shortAddress}
                </span>
                <Button
                  type="primary"
                  size="small"
                  icon={<CopyOutlined />}
                  style={{ padding: '4px 12px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(paymentAccount);
                    message.success('地址已复制');
                  }}
                >
                  复制
                </Button>
              </div>
            </Tooltip>
          );
        }
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {paymentAccount}
            </span>
            {paymentAccount !== '-' && (
              <Button
                type="primary"
                size="small"
                icon={<CopyOutlined />}
                style={{ padding: '4px 12px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(paymentAccount);
                  message.success('已复制');
                }}
              >
                复制
              </Button>
            )}
          </div>
        );
      }
    },
    {
      title: '待返佣状态',
      key: 'pending_commission_status',
      width: 110,
      render: (_, record) => {
        const salesId = record.sales?.id;
        // 🔧 修复：基于已配置确认订单金额计算应返佣金
        const commissionAmount = calculateCommissionAmount(record);
        // 🔧 修复：优先使用用户输入的值，如果没有则使用数据库值
        const dbValue = record.sales?.paid_commission || record.paid_commission || 0;
        const paidAmount = paidCommissionData[salesId] !== undefined ? paidCommissionData[salesId] : dbValue;
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
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '用户购买链接',
      key: 'purchase_link',
      width: 240,
      render: (_, record) => {
        const purchaseLink = record.links?.find(link => link.type === 'purchase');
        if (purchaseLink) {
          return (
            <div style={{ 
              padding: 8, 
              border: '1px solid #e8e8e8', 
              borderRadius: 4, 
              backgroundColor: '#f0f5ff' 
            }}>
              <div style={{ marginBottom: 4 }}>
                <Tag color="blue" icon={<ShoppingCartOutlined />}>购买链接</Tag>
              </div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                代码: {purchaseLink.code}
              </div>
              <Space size="small">
                <Tooltip title="复制链接">
                  <Button
                    type="link"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyLink(purchaseLink.fullUrl)}
                  >
                    复制链接
                  </Button>
                </Tooltip>
              </Space>
            </div>
          );
        }
        return <span style={{ color: '#ccc' }}>暂无链接</span>;
      }
    },
    {
      title: '分销注册链接',
      key: 'sales_register_link',
      width: 240,
      render: (_, record) => {
        const salesLink = record.links?.find(link => link.type === 'sales_register');
        if (salesLink) {
          return (
            <div style={{ 
              padding: 8, 
              border: '1px solid #e8e8e8', 
              borderRadius: 4, 
              backgroundColor: '#fff7e6' 
            }}>
              <div style={{ marginBottom: 4 }}>
                <Tag color="orange" icon={<TeamOutlined />}>分销链接</Tag>
              </div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                代码: {salesLink.code}
              </div>
              <Space size="small">
                <Tooltip title="复制链接">
                  <Button
                    type="link"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyLink(salesLink.fullUrl)}
                  >
                    复制链接
                  </Button>
                </Tooltip>
              </Space>
            </div>
          );
        }
        return record.sales_type === 'primary' ? 
          <span style={{ color: '#ccc' }}>暂无链接</span> : 
          <span style={{ color: '#999', fontSize: '12px' }}>二级销售无分销链接</span>;
      }
    }
  ];

  return (
    <div style={{ padding: '0 24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>销售管理</Title>

      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Form form={form} layout="horizontal">
          <Row gutter={[24, 16]} style={{ width: '100%' }}>
            {/* 第一行 - 主要筛选条件 */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item 
                name="sales_type" 
                label="销售类型"
                style={{ marginBottom: 0 }}
              >
                <Select 
                  placeholder="选择销售类型" 
                  allowClear
                  value={salesTypeFilter}
                  onChange={handleSalesTypeFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">全部销售</Option>
                  <Option value="primary">一级销售</Option>
                  <Option value="secondary">二级销售</Option>
                  <Option value="independent">独立销售</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item 
                name="wechat_name" 
                label="销售微信号"
                style={{ marginBottom: 0 }}
              >
                <Input 
                  placeholder="请输入销售微信号" 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item 
                name="payment_method" 
                label="收款方式"
                style={{ marginBottom: 0 }}
              >
                <Select 
                  placeholder="请选择收款方式" 
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="alipay">支付宝</Option>
                  <Option value="crypto">链上地址</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item 
                name="create_date_range" 
                label="创建时间"
                style={{ marginBottom: 0 }}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            {/* 第二行 - 次要筛选条件 */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item 
                name="commission_rate" 
                label="佣金比率"
                style={{ marginBottom: 0 }}
              >
                <Select 
                  placeholder="请选择佣金比率" 
                  allowClear
                  style={{ width: '100%' }}
                >
                  {commissionRateOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item 
                name="config_confirmed_filter" 
                label="配置确认状态"
                style={{ marginBottom: 0 }}
              >
                <Select 
                  placeholder="选择配置确认状态" 
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="all">全部订单</Option>
                  <Option value="confirmed">已配置确认</Option>
                  <Option value="pending">待配置确认</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item 
                name="commission_filter" 
                label="应返佣金筛选"
                style={{ marginBottom: 0 }}
              >
                <Select 
                  placeholder="选择佣金筛选条件" 
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="all">全部</Option>
                  <Option value="gt1">大于$1</Option>
                  <Option value="gt10">大于$10</Option>
                  <Option value="gt100">大于$100</Option>
                  <Option value="eq0">等于$0</Option>
                </Select>
              </Form.Item>
            </Col>
            
            {/* 按钮组 - 独立一行或右对齐 */}
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
                  onClick={handleSearch} 
                  icon={<SearchOutlined />}
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
                  type="default" 
                  onClick={handleExport} 
                  icon={<ExportOutlined />}
                  size="middle"
                >
                  导出数据
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 销售列表 */}
      <Card bodyStyle={{ padding: '0px' }}>
        <Table
          columns={columns}
          dataSource={getFilteredSales()}
          rowKey={record => record.sales?.id || record.id}
          scroll={{ 
            x: 2100,  // 设置横向滚动
            y: 'calc(100vh - 400px)'  // 设置纵向高度
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
        />
      </Card>
    </div>
  );
};

export default AdminSales; 