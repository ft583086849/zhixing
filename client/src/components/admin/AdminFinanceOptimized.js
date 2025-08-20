import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Statistic,
  Table,
  DatePicker,
  Select,
  Button,
  Space,
  Progress,
  Tag,
  Tabs,
  Badge
} from 'antd';
import { 
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  BankOutlined,
  WalletOutlined,
  AreaChartOutlined,
  CalendarOutlined,
  ExportOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
// import { Line, Column, Pie } from '@ant-design/charts';
import { SupabaseService } from '../../services/supabase';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

// 🚀 财务数据缓存
class FinanceCache {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000;
  }

  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

const financeCache = new FinanceCache();

const AdminFinanceOptimized = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [viewType, setViewType] = useState('daily'); // daily, weekly, monthly
  const [financeData, setFinanceData] = useState({
    totalRevenue: 0,
    confirmedRevenue: 0,
    pendingRevenue: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    netProfit: 0,
    growthRate: 0
  });
  const [dailyStats, setDailyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [commissionBreakdown, setCommissionBreakdown] = useState([]);

  // 🚀 获取财务统计数据
  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const cacheKey = `finance_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}_${viewType}`;
      const cached = financeCache.get(cacheKey);
      
      if (cached) {
        setFinanceData(cached.financeData);
        setDailyStats(cached.dailyStats);
        setMonthlyStats(cached.monthlyStats);
        setCommissionBreakdown(cached.commissionBreakdown);
        setLoading(false);
        return;
      }

      // 获取日统计数据
      const { data: dailyData } = await SupabaseService.supabase
        .from('finance_daily_stats')
        .select('*')
        .gte('stat_date', dateRange[0].format('YYYY-MM-DD'))
        .lte('stat_date', dateRange[1].format('YYYY-MM-DD'))
        .order('stat_date', { ascending: true });

      // 获取月统计数据
      const { data: monthlyData } = await SupabaseService.supabase
        .from('finance_monthly_stats')
        .select('*')
        .order('stat_month', { ascending: false })
        .limit(12);

      // 获取佣金记录
      const { data: commissionData } = await SupabaseService.supabase
        .from('commission_records')
        .select('*')
        .gte('created_at', dateRange[0].format('YYYY-MM-DD'))
        .lte('created_at', dateRange[1].format('YYYY-MM-DD'));

      // 计算汇总数据
      const totalRevenue = dailyData?.reduce((sum, d) => sum + (d.total_revenue || 0), 0) || 0;
      const confirmedRevenue = dailyData?.reduce((sum, d) => sum + (d.confirmed_revenue || 0), 0) || 0;
      const pendingRevenue = totalRevenue - confirmedRevenue;
      
      const totalCommission = commissionData?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;
      const paidCommission = commissionData?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;
      const pendingCommission = totalCommission - paidCommission;
      
      const netProfit = confirmedRevenue - paidCommission;
      
      // 计算增长率
      let growthRate = 0;
      if (dailyData && dailyData.length > 1) {
        const lastWeek = dailyData.slice(-7).reduce((sum, d) => sum + (d.total_revenue || 0), 0);
        const previousWeek = dailyData.slice(-14, -7).reduce((sum, d) => sum + (d.total_revenue || 0), 0);
        if (previousWeek > 0) {
          growthRate = ((lastWeek - previousWeek) / previousWeek) * 100;
        }
      }

      const stats = {
        totalRevenue,
        confirmedRevenue,
        pendingRevenue,
        totalCommission,
        paidCommission,
        pendingCommission,
        netProfit,
        growthRate
      };

      // 处理佣金分组数据
      const commissionByType = {};
      commissionData?.forEach(c => {
        const type = c.sales_type || 'unknown';
        if (!commissionByType[type]) {
          commissionByType[type] = {
            type,
            count: 0,
            amount: 0
          };
        }
        commissionByType[type].count++;
        commissionByType[type].amount += c.commission_amount || 0;
      });

      const breakdown = Object.values(commissionByType);

      setFinanceData(stats);
      setDailyStats(dailyData || []);
      setMonthlyStats(monthlyData || []);
      setCommissionBreakdown(breakdown);

      // 缓存数据
      financeCache.set(cacheKey, {
        financeData: stats,
        dailyStats: dailyData || [],
        monthlyStats: monthlyData || [],
        commissionBreakdown: breakdown
      });
    } catch (error) {
      console.error('获取财务数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [dateRange, viewType]);

  // 暂时移除图表配置，使用表格代替

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['日期', '总收入', '确认收入', '订单数', '有效订单数'],
      ...dailyStats.map(d => [
        d.stat_date,
        d.total_revenue || 0,
        d.confirmed_revenue || 0,
        d.total_orders || 0,
        d.valid_orders || 0
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance_${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
  };

  return (
    <div style={{ padding: '0 24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        资金统计
        <Badge 
          status={financeData.growthRate > 0 ? "success" : "error"}
          text={`${financeData.growthRate > 0 ? '+' : ''}${financeData.growthRate.toFixed(1)}%`}
          style={{ marginLeft: 16 }}
        />
      </Title>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large">
          <RangePicker 
            value={dateRange}
            onChange={setDateRange}
            presets={[
              { label: '最近7天', value: [dayjs().subtract(7, 'day'), dayjs()] },
              { label: '最近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
              { label: '最近90天', value: [dayjs().subtract(90, 'day'), dayjs()] },
            ]}
          />
          <Select value={viewType} onChange={setViewType} style={{ width: 120 }}>
            <Option value="daily">按日</Option>
            <Option value="weekly">按周</Option>
            <Option value="monthly">按月</Option>
          </Select>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出报表
          </Button>
        </Space>
      </Card>

      {/* 核心指标 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总收入"
              value={financeData.totalRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="确认收入"
              value={financeData.confirmedRevenue}
              prefix={<BankOutlined />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待付佣金"
              value={financeData.pendingCommission}
              prefix={<WalletOutlined />}
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="净利润"
              value={financeData.netProfit}
              prefix={financeData.netProfit > 0 ? <RiseOutlined /> : <FallOutlined />}
              precision={2}
              valueStyle={{ 
                color: financeData.netProfit > 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表和详细数据 */}
      <Tabs defaultActiveKey="1">
        <TabPane tab="收入趋势" key="1">
          <Card>
            <Table
              dataSource={dailyStats}
              rowKey="stat_date"
              columns={[
                { title: '日期', dataIndex: 'stat_date', key: 'stat_date' },
                { title: '总收入', dataIndex: 'total_revenue', key: 'total_revenue', render: v => `$${v || 0}` },
                { title: '确认收入', dataIndex: 'confirmed_revenue', key: 'confirmed_revenue', render: v => `$${v || 0}` }
              ]}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="佣金分布" key="2">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="佣金类型分布">
                <Table
                  dataSource={commissionBreakdown}
                  rowKey="type"
                  pagination={false}
                  columns={[
                    {
                      title: '类型',
                      dataIndex: 'type',
                      render: (type) => {
                        const typeMap = {
                          'primary': '一级销售',
                          'secondary': '二级销售',
                          'independent': '独立销售'
                        };
                        return typeMap[type] || type;
                      }
                    },
                    {
                      title: '笔数',
                      dataIndex: 'count',
                      align: 'right'
                    },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      align: 'right',
                      render: (amount) => `$${amount ? amount.toFixed(2) : 0}`
                    }
                  ]}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="佣金明细">
                <p>佣金明细数据</p>
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="日报表" key="3">
          <Card>
            <Table
              dataSource={dailyStats}
              rowKey="stat_date"
              scroll={{ x: 1200 }}
              columns={[
                {
                  title: '日期',
                  dataIndex: 'stat_date',
                  fixed: 'left',
                  width: 120,
                  render: (date) => dayjs(date).format('MM-DD')
                },
                {
                  title: '订单数',
                  dataIndex: 'total_orders',
                  align: 'right',
                  width: 100
                },
                {
                  title: '有效订单',
                  dataIndex: 'valid_orders',
                  align: 'right',
                  width: 100
                },
                {
                  title: '总收入',
                  dataIndex: 'total_revenue',
                  align: 'right',
                  width: 120,
                  render: (v) => `$${v?.toFixed(2) || 0}`
                },
                {
                  title: '确认收入',
                  dataIndex: 'confirmed_revenue',
                  align: 'right',
                  width: 120,
                  render: (v) => `$${v?.toFixed(2) || 0}`
                },
                {
                  title: '转化率',
                  key: 'conversion',
                  align: 'right',
                  width: 100,
                  render: (_, record) => {
                    const rate = record.total_orders 
                      ? (record.valid_orders / record.total_orders * 100).toFixed(1)
                      : 0;
                    return <Progress percent={parseFloat(rate)} size="small" />;
                  }
                }
              ]}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="月报表" key="4">
          <Card>
            <Table
              dataSource={monthlyStats}
              rowKey="stat_month"
              columns={[
                {
                  title: '月份',
                  dataIndex: 'stat_month',
                  render: (month) => dayjs(month).format('YYYY年MM月')
                },
                {
                  title: '总订单',
                  dataIndex: 'total_orders',
                  align: 'right'
                },
                {
                  title: '总收入',
                  dataIndex: 'total_revenue',
                  align: 'right',
                  render: (v) => (
                    <Statistic 
                      value={v || 0} 
                      prefix="$" 
                      valueStyle={{ fontSize: 14 }}
                    />
                  )
                },
                {
                  title: '净利润',
                  dataIndex: 'net_profit',
                  align: 'right',
                  render: (v) => (
                    <Statistic 
                      value={v || 0} 
                      prefix="$" 
                      valueStyle={{ 
                        fontSize: 14,
                        color: v > 0 ? '#52c41a' : '#ff4d4f'
                      }}
                    />
                  )
                },
                {
                  title: '同比增长',
                  dataIndex: 'growth_rate',
                  align: 'right',
                  render: (rate) => (
                    <Tag color={rate > 0 ? 'green' : 'red'}>
                      {rate > 0 ? '+' : ''}{rate?.toFixed(1) || 0}%
                    </Tag>
                  )
                }
              ]}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminFinanceOptimized;