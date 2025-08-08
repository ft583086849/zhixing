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
  Spin,
  Button,
  Modal,
  Tag
} from 'antd';
import { 
  DollarOutlined, 
  WalletOutlined, 
  BankOutlined,
  CalculatorOutlined,
  PieChartOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { getStats } from '../../store/slices/adminSlice';
import { AdminAPI } from '../../services/api';
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
  const [savedRatios, setSavedRatios] = useState(null); // 保存的比例
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 获取统计数据 - 实时获取最新数据
    const params = timeRange === 'custom' && customRange.length > 0
      ? { timeRange: 'custom', customRange, usePaymentTime: true }
      : { timeRange, usePaymentTime: true };
    
    dispatch(getStats(params));
  }, [dispatch, timeRange, customRange]);

  // 从数据库加载保存的收益分配比例
  useEffect(() => {
    const loadProfitRatios = async () => {
      try {
        const ratios = await AdminAPI.getProfitDistribution();
        const formattedRatios = {
          public: ratios.public_ratio || 40,
          zhixing: ratios.zhixing_ratio || 35,
          zijun: ratios.zijun_ratio || 25
        };
        setProfitRatios(formattedRatios);
        setSavedRatios(formattedRatios);
        console.log('从数据库加载收益分配配置:', formattedRatios);
      } catch (error) {
        console.error('加载收益分配配置失败:', error);
        // 如果数据库加载失败，尝试从localStorage加载
        const saved = localStorage.getItem('profitRatios');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setProfitRatios(parsed);
            setSavedRatios(parsed);
          } catch (e) {
            console.error('加载收益分配失败:', e);
          }
        }
      }
    };
    
    loadProfitRatios();
  }, []);

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

  // 保存收益分配比例
  const handleSaveRatios = async () => {
    const total = profitRatios.public + profitRatios.zhixing + profitRatios.zijun;
    
    if (total !== 100) {
      Modal.confirm({
        title: '提示',
        content: `当前比例总和为 ${total}%，建议调整为 100%。是否继续保存？`,
        onOk: () => saveRatios(),
        okText: '继续保存',
        cancelText: '取消'
      });
    } else {
      saveRatios();
    }
  };

  const saveRatios = async () => {
    setIsSaving(true);
    try {
      // 保存到数据库
      const result = await AdminAPI.saveProfitDistribution(profitRatios);
      
      if (result.success) {
        setSavedRatios(profitRatios);
        // 同时保存到localStorage作为备份
        localStorage.setItem('profitRatios', JSON.stringify(profitRatios));
        message.success('收益分配比例已保存到数据库');
      } else {
        throw new Error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败：' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 检查是否有未保存的更改
  const hasUnsavedChanges = () => {
    if (!savedRatios) return true;
    return JSON.stringify(profitRatios) !== JSON.stringify(savedRatios);
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
      title: (
        <div style={{ textAlign: 'center' }}>
          <BankOutlined style={{ marginRight: 8, color: '#faad14' }} />
          营利金额
        </div>
      ),
      dataIndex: 'netProfit',
      key: 'netProfit',
      width: 180,
      render: () => (
        <div style={{ 
          background: 'linear-gradient(135deg, #ffd93d 0%, #ffb347 100%)',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#fff', fontSize: '12px', marginBottom: '4px' }}>总营利</div>
          <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
            ${financials.netProfit.toFixed(2)}
          </div>
        </div>
      )
    },
    {
      title: (
        <div style={{ textAlign: 'center' }}>
          <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          分配对象
        </div>
      ),
      dataIndex: 'category',
      key: 'category',
      width: 150,
      align: 'center',
      render: (text, record) => {
        let bgColor = '#f0f2f5';
        let textColor = '#333';
        let icon = null;
        
        if (record.key === 'public') {
          bgColor = '#e6f7ff';
          textColor = '#1890ff';
          icon = '🏢';
        } else if (record.key === 'zhixing') {
          bgColor = '#f6ffed';
          textColor = '#52c41a';
          icon = '📚';
        } else if (record.key === 'zijun') {
          bgColor = '#fff1f0';
          textColor = '#f5222d';
          icon = '👤';
        }
        
        return (
          <div style={{
            background: bgColor,
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'inline-block'
          }}>
            <span style={{ fontSize: '16px', marginRight: '6px' }}>{icon}</span>
            <span style={{ color: textColor, fontWeight: '600' }}>{text}</span>
          </div>
        );
      }
    },
    {
      title: (
        <div style={{ textAlign: 'center' }}>
          <PieChartOutlined style={{ marginRight: 8, color: '#722ed1' }} />
          收益占比
        </div>
      ),
      dataIndex: 'ratio',
      key: 'ratio',
      width: 200,
      align: 'center',
      render: (value, record) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            width: '60px', 
            height: '6px', 
            background: '#f0f0f0',
            borderRadius: '3px',
            marginRight: '12px',
            position: 'relative'
          }}>
            <div style={{
              width: `${value}%`,
              height: '100%',
              background: record.key === 'public' ? '#1890ff' : 
                         record.key === 'zhixing' ? '#52c41a' : '#f5222d',
              borderRadius: '3px',
              transition: 'width 0.3s'
            }} />
          </div>
          <InputNumber
            min={0}
            max={100}
            value={value}
            onChange={(val) => handleRatioChange(record.key, val)}
            formatter={value => `${value}%`}
            parser={value => value.replace('%', '')}
            style={{ width: 80 }}
            size="small"
          />
        </div>
      )
    },
    {
      title: (
        <div style={{ textAlign: 'center' }}>
          <DollarOutlined style={{ marginRight: 8, color: '#52c41a' }} />
          分配金额
        </div>
      ),
      dataIndex: 'profit',
      key: 'profit',
      width: 150,
      align: 'center',
      render: (value, record) => {
        let color = '#52c41a';
        if (record.key === 'public') color = '#1890ff';
        else if (record.key === 'zhixing') color = '#52c41a';
        else if (record.key === 'zijun') color = '#f5222d';
        
        return (
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: color
          }}>
            ${value}
          </div>
        );
      }
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
          <Divider orientation="left" style={{ marginTop: 32 }}>
            <Space>
              <PieChartOutlined style={{ color: '#722ed1' }} />
              <span style={{ fontWeight: '600' }}>收益分配方案</span>
            </Space>
          </Divider>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              border: 'none',
              borderRadius: '12px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Table
              dataSource={calculateProfitDistribution()}
              columns={profitColumns}
              pagination={false}
              showHeader={true}
              style={{
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row style={{ background: '#fafafa' }}>
                    <Table.Summary.Cell index={0} align="center">
                      <strong style={{ fontSize: '16px' }}>💰 合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <span style={{ color: '#999' }}>-</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center">
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: '#722ed1',
                        color: '#fff',
                        borderRadius: '12px',
                        fontWeight: 'bold'
                      }}>
                        {profitRatios.public + profitRatios.zhixing + profitRatios.zijun}%
                      </div>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">
                      <div style={{ 
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#52c41a'
                      }}>
                        ${financials.netProfit.toFixed(2)}
                      </div>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
            
            <div style={{ 
              marginTop: 20, 
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px'
            }}>
              <Row gutter={[16, 16]}>
                <Col span={18}>
                  <Space direction="vertical" size="small">
                    <div>
                      <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                      <span style={{ color: '#666' }}>营利金额 = 总实付金额 - 销售返佣金额</span>
                    </div>
                    <div>
                      <CalculatorOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                      <span style={{ color: '#666' }}>收益占比可手动调整，总和建议为100%</span>
                    </div>
                    <div>
                      <WalletOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      <span style={{ color: '#666' }}>销售返佣金额基于实付金额计算</span>
                    </div>
                  </Space>
                </Col>
                <Col span={6} style={{ textAlign: 'right' }}>
                  <Space>
                    {hasUnsavedChanges() && (
                      <Tag color="warning">有未保存的更改</Tag>
                    )}
                    <Button 
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={isSaving}
                      onClick={handleSaveRatios}
                      size="large"
                      style={{
                        background: hasUnsavedChanges() ? '#52c41a' : '#1890ff',
                        borderColor: hasUnsavedChanges() ? '#52c41a' : '#1890ff'
                      }}
                    >
                      {hasUnsavedChanges() ? '保存分配方案' : '已保存'}
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminFinance;
