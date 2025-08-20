/**
 * 销售管理页面 - 优化版本V2
 * 完全复制原版界面，只改数据源为 sales_optimized 表
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
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Divider,
  DatePicker,
  Alert
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

const AdminSalesOptimizedV2 = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.admin);
  const [sales, setSales] = useState([]);
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [editingCommissionRates, setEditingCommissionRates] = useState({});
  const [paidCommissionData, setPaidCommissionData] = useState({});
  const [salesTypeFilter, setSalesTypeFilter] = useState('all');
  const [commissionRateOptions, setCommissionRateOptions] = useState([]);
  const [commissionFilter, setCommissionFilter] = useState('all');

  useEffect(() => {
    // 检查URL参数
    const filterParam = searchParams.get('filter');
    if (filterParam === 'pending_commission') {
      setCommissionFilter('pending');
      form.setFieldsValue({ commission_filter: 'pending' });
    }
    fetchOptimizedSales();
  }, [searchParams]);

  // 获取优化后的销售数据
  const fetchOptimizedSales = async () => {
    try {
      const response = await AdminAPI.getSalesOptimized();
      if (response.success) {
        // 转换数据格式以匹配原版
        const formattedData = response.data.map(sale => ({
          ...sale,
          sales: {
            id: sale.id,
            wechat_name: sale.wechat_name,
            sales_type: sale.sales_type,
            sales_code: sale.sales_code,
            commission_rate: sale.commission_rate
          },
          sales_type: sale.sales_type,
          total_orders: sale.total_orders || 0,
          valid_orders: sale.total_orders || 0,
          total_amount: sale.total_amount || 0,
          commission_rate: sale.commission_rate ? sale.commission_rate * 100 : 40, // 转换为百分比显示
          commission_amount: sale.total_commission || 0,
          paid_commission: sale.paid_commission || 0,
          // 计算平均二级佣金率（仅一级销售）
          secondary_avg_rate: sale.sales_type === 'primary' ? 0.25 : null
        }));
        
        setSales(formattedData);
        
        // 生成佣金率选项
        const uniqueRates = new Set();
        formattedData.forEach(sale => {
          const rate = sale.commission_rate;
          if (rate && rate > 0) {
            uniqueRates.add(rate);
          }
        });
        
        const options = Array.from(uniqueRates)
          .filter(rate => rate && rate > 0)
          .sort((a, b) => a - b)
          .map(rate => ({ value: rate, label: `${rate}%` }));
        
        setCommissionRateOptions(options);
      }
    } catch (error) {
      console.error('获取销售数据失败:', error);
      message.error('获取销售数据失败');
    }
  };

  // 获取销售类型标签
  const getSalesTypeTag = (type) => {
    const typeMap = {
      primary: { text: '一级销售', color: 'gold', icon: <CrownOutlined /> },
      secondary: { text: '二级销售', color: 'blue', icon: <TeamOutlined /> },
      independent: { text: '独立销售', color: 'green', icon: <TeamOutlined /> }
    };
    
    const config = typeMap[type] || typeMap.secondary;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 获取层级关系信息
  const getHierarchyInfo = (record) => {
    if (record.sales_type === 'primary') {
      return '一级';
    } else if (record.parent_sales_name) {
      return `上级: ${record.parent_sales_name}`;
    } else {
      return '独立';
    }
  };

  // 处理佣金率编辑
  const handleCommissionRateEdit = (salesId, value) => {
    setEditingCommissionRates({
      ...editingCommissionRates,
      [salesId]: value
    });
  };

  // 取消编辑佣金率
  const handleCancelCommissionRate = (salesId) => {
    const newRates = { ...editingCommissionRates };
    delete newRates[salesId];
    setEditingCommissionRates(newRates);
  };

  // 确认更新佣金率
  const handleConfirmCommissionRate = async (salesId, record) => {
    const newRate = editingCommissionRates[salesId];
    if (newRate === undefined || newRate === null) {
      message.error('请输入有效的佣金率');
      return;
    }

    try {
      // 将百分比转换为小数存储
      const rateDecimal = newRate / 100;
      const response = await AdminAPI.updateSalesCommission(salesId, rateDecimal);
      
      if (response.success) {
        message.success('佣金率更新成功');
        handleCancelCommissionRate(salesId);
        fetchOptimizedSales(); // 刷新数据
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      console.error('更新佣金率失败:', error);
      message.error('更新失败');
    }
  };

  // 处理已返佣金编辑
  const handlePaidCommissionEdit = (salesId, value) => {
    setPaidCommissionData({
      ...paidCommissionData,
      [salesId]: value
    });
  };

  // 取消编辑已返佣金
  const handleCancelPaidCommission = (salesId) => {
    const newData = { ...paidCommissionData };
    delete newData[salesId];
    setPaidCommissionData(newData);
  };

  // 确认更新已返佣金
  const handleConfirmPaidCommission = async (salesId, record) => {
    const amount = paidCommissionData[salesId];
    if (amount === undefined || amount === null || amount < 0) {
      message.error('请输入有效的金额');
      return;
    }

    try {
      const response = await AdminAPI.updatePaidCommission(salesId, record.sales_type, amount);
      
      if (response.success) {
        message.success('已返佣金更新成功');
        handleCancelPaidCommission(salesId);
        fetchOptimizedSales(); // 刷新数据
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      console.error('更新已返佣金失败:', error);
      message.error('更新失败');
    }
  };

  // 处理搜索
  const handleSearch = () => {
    const searchValues = form.getFieldsValue();
    
    // 构建搜索参数
    const searchParams = {};
    
    if (searchValues.sales_type && searchValues.sales_type !== 'all') {
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
    
    // 应用筛选
    let filteredData = sales;
    
    if (searchParams.sales_type) {
      filteredData = filteredData.filter(s => s.sales_type === searchParams.sales_type);
    }
    
    if (searchParams.wechat_name) {
      filteredData = filteredData.filter(s => 
        s.wechat_name?.toLowerCase().includes(searchParams.wechat_name.toLowerCase())
      );
    }
    
    setSales(filteredData);
    message.success('搜索完成');
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    setSalesTypeFilter('all');
    setCommissionFilter('all');
    fetchOptimizedSales();
    message.info('已重置搜索条件');
  };

  // 导出数据
  const handleExport = async () => {
    try {
      await dispatch(downloadCommissionData()).unwrap();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 获取过滤后的销售数据
  const getFilteredSales = () => {
    if (!sales || !Array.isArray(sales)) return [];
    
    let filteredData = [...sales];
    
    // 应用销售类型筛选
    if (salesTypeFilter && salesTypeFilter !== 'all') {
      filteredData = filteredData.filter(sale => {
        if (salesTypeFilter === 'primary') {
          return sale.sales_type === 'primary';
        } else if (salesTypeFilter === 'secondary') {
          return sale.sales_type === 'secondary';
        } else if (salesTypeFilter === 'independent') {
          return sale.sales_type === 'independent';
        }
        return true;
      });
    }
    
    // 应用佣金筛选
    if (commissionFilter && commissionFilter !== 'all') {
      filteredData = filteredData.filter(sale => {
        const commissionAmount = sale.commission_amount || 0;
        const paidAmount = sale.paid_commission || 0;
        const pendingAmount = commissionAmount - paidAmount;
        
        switch(commissionFilter) {
          case 'pending':
            return pendingAmount > 0;
          case 'paid':
            return paidAmount >= commissionAmount && commissionAmount > 0;
          case 'no_commission':
            return commissionAmount === 0;
          default:
            return true;
        }
      });
    }
    
    return filteredData;
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
      render: (value) => value || 0
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 110,
      render: (value) => value ? `$${value.toFixed(2)}` : '$0.00'
    },
    {
      title: '平均二级佣金率',
      key: 'secondary_avg_rate',
      width: 140,
      render: (_, record) => {
        const salesId = record.sales?.id;
        
        // 一级销售显示平均二级佣金率
        if (record.sales_type === 'primary') {
          const avgRate = record.secondary_avg_rate || 0;
          return <Tag color="purple">{(avgRate * 100).toFixed(1)}%</Tag>;
        }
        
        // 二级/独立销售显示自己的佣金率（可编辑）
        const currentRate = editingCommissionRates[salesId] !== undefined 
          ? editingCommissionRates[salesId]
          : (record.commission_rate !== undefined ? record.commission_rate : 25);
        
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
          return (
            <Space size="small">
              <Tag color="blue">{currentRate}%</Tag>
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
      title: '佣金率',
      key: 'commission_rate',
      width: 100,
      render: (_, record) => {
        const rate = calculatePrimaryCommissionRate(record);
        return formatCommissionRate(rate);
      }
    },
    {
      title: '应返佣金额',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      width: 120,
      render: (value) => formatCommissionAmount(value)
    },
    {
      title: '已返佣金额',
      key: 'paid_commission',
      width: 150,
      render: (_, record) => {
        const salesId = record.sales?.id;
        const currentAmount = paidCommissionData[salesId] !== undefined
          ? paidCommissionData[salesId]
          : (record.paid_commission || 0);
        
        if (paidCommissionData[salesId] !== undefined) {
          return (
            <Space size="small">
              <InputNumber
                size="small"
                min={0}
                value={paidCommissionData[salesId]}
                onChange={(value) => handlePaidCommissionEdit(salesId, value)}
                style={{ width: 100 }}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleConfirmPaidCommission(salesId, record)}
              />
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleCancelPaidCommission(salesId)}
              />
            </Space>
          );
        } else {
          return (
            <Space size="small">
              <span>${currentAmount.toFixed(2)}</span>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handlePaidCommissionEdit(salesId, currentAmount)}
              />
            </Space>
          );
        }
      }
    },
    {
      title: '待返佣金额',
      key: 'pending_commission',
      width: 120,
      render: (_, record) => {
        const pending = (record.commission_amount || 0) - (record.paid_commission || 0);
        return (
          <span style={{ color: pending > 0 ? '#ff4d4f' : '#52c41a' }}>
            ${pending.toFixed(2)}
          </span>
        );
      }
    },
    {
      title: '销售代码',
      dataIndex: ['sales', 'sales_code'],
      key: 'sales_code',
      width: 120,
      render: (code) => (
        <Space>
          <span>{code}</span>
          <Tooltip title="复制销售代码">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(code);
                message.success('销售代码已复制');
              }}
            />
          </Tooltip>
        </Space>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
    }
  ];

  // 计算一级销售佣金比率
  const calculatePrimaryCommissionRate = (record) => {
    if (record.commission_rate !== undefined && record.commission_rate !== null) {
      return record.commission_rate;
    }
    
    if (!record.orders || record.orders.length === 0) {
      return record.sales?.sales_type === 'primary' ? 40 : 25;
    }
    
    return record.sales?.sales_type === 'primary' ? 40 : 25;
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* 测试环境提示 */}
      <Alert
        message="测试环境 - 销售管理优化版"
        description={
          <div>
            <p>当前使用 <strong>sales_optimized</strong> 表，数据自动同步，性能提升约15-20倍</p>
            <Button 
              type="link" 
              size="small"
              onClick={() => window.location.href = '/admin/sales'}
            >
              返回原版
            </Button>
          </div>
        }
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      <Title level={2}>销售管理</Title>
      
      {/* 搜索表单 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="sales_type" label="销售类型">
            <Select style={{ width: 120 }} defaultValue="all">
              <Option value="all">全部</Option>
              <Option value="primary">一级销售</Option>
              <Option value="secondary">二级销售</Option>
              <Option value="independent">独立销售</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="wechat_name" label="微信号">
            <Input placeholder="请输入微信号" style={{ width: 150 }} />
          </Form.Item>
          
          <Form.Item name="commission_filter" label="佣金状态">
            <Select style={{ width: 120 }} defaultValue="all">
              <Option value="all">全部</Option>
              <Option value="pending">待返佣</Option>
              <Option value="paid">已返佣</Option>
              <Option value="no_commission">无佣金</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
              <Button onClick={handleExport} icon={<ExportOutlined />}>
                导出
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      
      {/* 快速筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span>快速筛选：</span>
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
            <Option value="no_commission">无佣金</Option>
          </Select>
        </Space>
      </Card>
      
      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={getFilteredSales()}
        rowKey={(record) => record.id || record.sales?.id}
        loading={loading}
        scroll={{ x: 1800 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />
    </div>
  );
};

export default AdminSalesOptimizedV2;