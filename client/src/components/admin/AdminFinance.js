import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Radio, 
  DatePicker, 
  Space, 
  Typography, 
  Divider,
  InputNumber,
  message,
  Spin
} from 'antd';
import { 
  DollarOutlined, 
  WalletOutlined, 
  BankOutlined,
  CalculatorOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { getStats } from '../../store/slices/adminSlice';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const AdminFinance = () => {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.admin);
  const [timeRange, setTimeRange] = useState('all');
  const [customRange, setCustomRange] = useState([]);
  
  // 收益占比配置（可手动调整）
  const [profitRatios, setProfitRatios] = useState({
    public: 40,  // 公户占比 40%
    zhixing: 35, // 知行占比 35%
    zijun: 25    // 子俊占比 25%
  });

  useEffect(() => {
    // 获取统计数据
    if (timeRange === 'custom' && customRange.length > 0) {
      dispatch(getStats({ 
        timeRange: 'custom', 
        customRange,
        usePaymentTime: true // 使用付款时间
      }));
    } else {
      dispatch(getStats({ 
        timeRange,
        usePaymentTime: true // 使用付款时间
      }));
    }
  }, [dispatch, timeRange, customRange]);

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    setCustomRange([]);
  };

  const handleCustomRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setTimeRange('custom');
      setCustomRange(dates);
    }
  };

  const handleRatioChange = (type, value) => {
    if (value >= 0 && value <= 100) {
      setProfitRatios(prev => ({
        ...prev,
        [type]: value
      }));
    }
  };

  // 计算各项金额
  const calculateFinancials = () => {
    if (!stats) return {
      totalRevenue: 0,
      totalPaid: 0,
      salesCommission: 0,
      pendingCommission: 0,
      netProfit: 0
    };

    // 总收入（所有订单金额）
    const totalRevenue = stats.total_amount || 0;
    
    // 总实付金额（已确认订单金额）
    const totalPaid = stats.confirmed_amount || totalRevenue;
    
    // 销售返佣金额（基于实付金额计算）
    const salesCommission = stats.total_commission || 0;
    
    // 待返佣金额
    const pendingCommission = stats.pending_commission_amount || 0;
    
    // 营利金额 = 总实付金额 - 销售返佣金额
    const netProfit = totalPaid - salesCommission;

    return {
      totalRevenue,
      totalPaid,
      salesCommission,
      pendingCommission,
      netProfit
    };
  };

  const financials = calculateFinancials();

  // 计算收益分配
  const calculateProfitDistribution = () => {
    const { netProfit } = financials;
    const total = profitRatios.public + profitRatios.zhixing + profitRatios.zijun;
    
    if (total === 0) return [];

    return [
      {
        key: 'public',
        category: '公户',
        ratio: profitRatios.public,
        profit: (netProfit * profitRatios.public / 100).toFixed(2)
      },
      {
        key: 'zhixing',
        category: '知行',
        ratio: profitRatios.zhixing,
        profit: (netProfit * profitRatios.zhixing / 100).toFixed(2)
      },
      {
        key: 'zijun',
        category: '子俊',
        ratio: profitRatios.zijun,
        profit: (netProfit * profitRatios.zijun / 100).toFixed(2)
      }
    ];
  };

  const profitColumns = [
    {
      title: '营利金额',
      dataIndex: 'netProfit',
      key: 'netProfit',
      render: () => (
        <Statistic
          value={financials.netProfit}
          prefix="$"
          precision={2}
          valueStyle={{ fontSize: '16px' }}
        />
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '收益占比',
      dataIndex: 'ratio',
      key: 'ratio',
      render: (value, record) => (
        <Space>
          <InputNumber
            min={0}
            max={100}
            value={value}
            onChange={(val) => handleRatioChange(record.key, val)}
            formatter={value => `${value}%`}
            parser={value => value.replace('%', '')}
            style={{ width: 100 }}
          />
        </Space>
      )
    },
    {
      title: '收益',
      dataIndex: 'profit',
      key: 'profit',
      render: (value) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          ${value}
        </span>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>资金统计</Title>

      {/* 时间范围选择器 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <span>时间范围：</span>
          <Radio.Group value={timeRange} onChange={(e) => handleTimeRangeChange(e.target.value)}>
            <Radio.Button value="all">全部数据</Radio.Button>
            <Radio.Button value="today">今天</Radio.Button>
            <Radio.Button value="week">本周</Radio.Button>
            <Radio.Button value="month">本月</Radio.Button>
            <Radio.Button value="year">本年</Radio.Button>
          </Radio.Group>
          <RangePicker 
            onChange={handleCustomRangeChange}
            placeholder={['开始日期', '结束日期']}
          />
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* 核心财务指标表格 */}
          <Card title="核心财务指标" style={{ marginBottom: 24 }}>
            <Table
              dataSource={[
                {
                  key: 'totalRevenue',
                  indicator: '总收入',
                  amount: financials.totalRevenue,
                  description: '所有订单金额总和',
                  icon: <DollarOutlined style={{ color: '#1890ff' }} />,
                  color: '#1890ff'
                },
                {
                  key: 'totalPaid',
                  indicator: '总实付金额',
                  amount: financials.totalPaid,
                  description: '已确认订单的实付金额',
                  icon: <WalletOutlined style={{ color: '#52c41a' }} />,
                  color: '#52c41a'
                },
                {
                  key: 'salesCommission',
                  indicator: '销售返佣金额',
                  amount: financials.salesCommission,
                  description: '基于实付金额计算的返佣',
                  icon: <CalculatorOutlined style={{ color: '#13c2c2' }} />,
                  color: '#13c2c2'
                },
                {
                  key: 'pendingCommission',
                  indicator: '待返佣金额',
                  amount: financials.pendingCommission,
                  description: '未确认订单的佣金',
                  icon: <PieChartOutlined style={{ color: '#eb2f96' }} />,
                  color: '#eb2f96'
                },
                {
                  key: 'netProfit',
                  indicator: '营利金额',
                  amount: financials.netProfit,
                  description: '总实付金额 - 销售返佣金额',
                  icon: <BankOutlined style={{ color: '#faad14' }} />,
                  color: '#faad14',
                  style: { fontWeight: 'bold', fontSize: '16px' }
                }
              ]}
              columns={[
                {
                  title: '指标',
                  dataIndex: 'indicator',
                  key: 'indicator',
                  width: 180,
                  render: (text, record) => (
                    <Space>
                      {record.icon}
                      <span style={{ fontWeight: 500 }}>{text}</span>
                    </Space>
                  )
                },
                {
                  title: '金额（美元）',
                  dataIndex: 'amount',
                  key: 'amount',
                  width: 150,
                  align: 'right',
                  render: (value, record) => (
                    <span style={{ 
                      color: record.color, 
                      ...record.style 
                    }}>
                      ${value?.toFixed(2) || '0.00'}
                    </span>
                  )
                },
                {
                  title: '说明',
                  dataIndex: 'description',
                  key: 'description',
                  render: (text) => (
                    <span style={{ color: '#666', fontSize: '13px' }}>{text}</span>
                  )
                }
              ]}
              pagination={false}
              bordered
              size="middle"
            />
          </Card>

          {/* 收益分配表格 */}
          <Divider orientation="left">收益分配</Divider>
          <Card>
            <Table
              dataSource={calculateProfitDistribution()}
              columns={profitColumns}
              pagination={false}
              bordered
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <strong>合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <strong>{profitRatios.public + profitRatios.zhixing + profitRatios.zijun}%</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <strong style={{ color: '#52c41a' }}>
                        ${financials.netProfit.toFixed(2)}
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
            <div style={{ marginTop: 16, color: '#666' }}>
              <Space direction="vertical">
                <span>* 营利金额 = 总实付金额 - 销售返佣金额</span>
                <span>* 收益占比可手动调整，总和建议为100%</span>
                <span>* 销售返佣金额基于实付金额计算</span>
              </Space>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminFinance;
