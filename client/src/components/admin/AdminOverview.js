import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Row, Col, Statistic, Spin, Progress, Radio, DatePicker, Space, Typography, Divider, Table, Tag } from 'antd';
import { 
  ShoppingCartOutlined, 
  DollarOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CrownOutlined,
  TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { getStats, getSales } from '../../store/slices/adminSlice';
import { parallelLoad } from '../../utils/performance';


const { Title } = Typography;
const { RangePicker } = DatePicker;

const AdminOverview = () => {
  const dispatch = useDispatch();
  const { stats, loading, sales } = useSelector((state) => state.admin);
  const { admin } = useSelector((state) => state.auth);
  const [timeRange, setTimeRange] = useState('all'); // 默认显示所有数据
  const [customRange, setCustomRange] = useState([]);
  const [top5Sales, setTop5Sales] = useState([]);

  // 加载数据的函数 - 使用并行加载优化
  const loadData = async () => {
    // 只有在已登录的情况下才获取数据
    if (!admin) {
      console.log('⚠️ AdminOverview: 用户未登录，跳过数据加载');
      return;
    }

    console.log('📊 AdminOverview: 开始并行获取数据...');
    
    // 并行加载统计数据和销售数据
    const loaders = [
      // 统计数据加载
      () => {
        const params = timeRange === 'custom' && customRange.length > 0
          ? { timeRange: 'custom', customRange, usePaymentTime: true }
          : { timeRange, usePaymentTime: true };
        
        return dispatch(getStats(params)).then(result => {
          if (!result.payload) {
            console.error('❌ 统计数据为空');
            return dispatch(getStats({ usePaymentTime: true }));
          }
          return result;
        });
      },
      // 销售数据加载
      () => {
        return dispatch(getSales()).then(result => {
          if (result.payload && Array.isArray(result.payload)) {
            // 计算Top5销售（按销售金额排序）
            const sortedSales = [...result.payload]
              .sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
              .slice(0, 5)
              .map((sale, index) => ({
                key: sale.id || index,
                rank: index + 1,
                sales_type: sale.sales_type === 'primary' ? '一级销售' : 
                           (sale.sales?.primary_sales_id ? '二级销售' : '独立销售'),
                sales_name: sale.sales?.wechat_name || sale.sales?.name || '-',
                total_amount: sale.total_amount || 0,
                commission_amount: sale.commission_amount || 0
              }));
            setTop5Sales(sortedSales);
          }
          return result;
        });
      }
    ];
    
    // 使用并行加载
    const results = await parallelLoad(loaders);
    console.log('✅ 数据并行加载完成:', results.filter(r => r).length, '个成功');
  };

  useEffect(() => {
    loadData();
  }, [dispatch, timeRange, customRange, admin]);

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    setCustomRange([]);
  };

  const handleCustomRangeChange = (dates) => {
    if (dates) {
      setCustomRange(dates);
      setTimeRange('custom');
    }
  };



  return (
    <div>
      <Title level={2}>数据概览</Title>

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '20px' }}>正在加载数据...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* 时间范围选择 */}
          <Card style={{ marginBottom: 24 }} role="region">
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

          {/* 统计卡片 - 核心指标 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="总订单数"
                  value={stats?.total_orders || 0}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="待付款确认订单"
                  value={stats?.pending_payment_orders || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="待配置确认订单"
                  value={stats?.pending_config_orders || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="已配置确认订单"
                  value={stats?.confirmed_config_orders || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="总收入"
                  value={stats?.total_amount || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                  suffix="美元"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="销售返佣金额"
                  value={stats?.commission_amount || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                  suffix="美元"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="待返佣金金额"
                  value={stats?.pending_commission_amount || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                  suffix="美元"
                />
              </Card>
            </Col>
          </Row>

          {/* 销售层级统计 - 优化版 */}
          <Divider orientation="left">销售层级统计</Divider>
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              {/* 一级销售 */}
              <Col xs={24} sm={8}>
                <Card style={{ background: '#e6f4ff', borderColor: '#1890ff' }}>
                  <Row align="middle">
                    <Col span={12}>
                      <Statistic
                        title="一级销售"
                        value={stats?.primary_sales_count || 0}
                        prefix={<CrownOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                        suffix="个"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="销售业绩"
                        value={stats?.primary_sales_amount || 0}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                        precision={2}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
              
              {/* 二级销售 */}
              <Col xs={24} sm={8}>
                <Card style={{ background: '#fff7e6', borderColor: '#fa8c16' }}>
                  <Row align="middle">
                    <Col span={12}>
                      <Statistic
                        title="二级销售"
                        value={stats?.linked_secondary_sales_count || 0}
                        prefix={<TeamOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                        suffix="个"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="销售业绩"
                        value={stats?.linked_secondary_sales_amount || 0}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#fa8c16', fontSize: '18px' }}
                        precision={2}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
              
              {/* 独立销售 */}
              <Col xs={24} sm={8}>
                <Card style={{ background: '#f6ffed', borderColor: '#52c41a' }}>
                  <Row align="middle">
                    <Col span={12}>
                      <Statistic
                        title="独立销售"
                        value={stats?.independent_sales_count || 0}
                        prefix={<UserOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                        suffix="个"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="销售业绩"
                        value={stats?.independent_sales_amount || 0}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                        precision={2}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* 订单分类统计 - 美化版 */}
          <Card 
            title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>📊 订单分类统计</span>} 
            style={{ marginTop: 24, background: '#fafafa' }} 
            role="region"
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} lg={4}>
                <Card bordered={false} style={{ textAlign: 'center', background: '#fff' }}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#52c41a' }}>
                      🎁 7天免费
                    </span>
                  </div>
                  <Progress 
                    type="circle"
                    percent={Number((stats?.free_trial_percentage || 0).toFixed(2))} 
                    status="active"
                    strokeColor="#52c41a"
                    format={percent => `${percent}%`}
                    width={80}
                  />
                  <div style={{ marginTop: 12, fontSize: '12px', color: '#666' }}>
                    <div>{stats?.free_trial_orders || 0} 笔</div>
                    <div style={{ marginTop: 4 }}>
                      占比 <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                        {(Number(stats?.free_trial_percentage) || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <Card bordered={false} style={{ textAlign: 'center', background: '#fff' }}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#108ee9' }}>
                      📅 1个月订单
                    </span>
                  </div>
                  <Progress 
                    type="circle"
                    percent={Number((stats?.one_month_percentage || 0).toFixed(2))} 
                    status="active"
                    strokeColor="#108ee9"
                    format={percent => `${percent}%`}
                    width={80}
                  />
                  <div style={{ marginTop: 12, fontSize: '12px', color: '#666' }}>
                    <div>{stats?.one_month_orders || 0} 笔</div>
                    <div style={{ marginTop: 4 }}>
                      占比 <span style={{ fontWeight: 'bold', color: '#108ee9' }}>
                        {(Number(stats?.one_month_percentage) || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <Card bordered={false} style={{ textAlign: 'center', background: '#fff' }}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#87d068' }}>
                      📆 3个月订单
                    </span>
                  </div>
                  <Progress 
                    type="circle"
                    percent={Number((stats?.three_month_percentage || 0).toFixed(2))} 
                    status="active"
                    strokeColor="#87d068"
                    format={percent => `${percent}%`}
                    width={80}
                  />
                  <div style={{ marginTop: 12, fontSize: '12px', color: '#666' }}>
                    <div>{stats?.three_month_orders || 0} 笔</div>
                    <div style={{ marginTop: 4 }}>
                      占比 <span style={{ fontWeight: 'bold', color: '#87d068' }}>
                        {(Number(stats?.three_month_percentage) || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <Card bordered={false} style={{ textAlign: 'center', background: '#fff' }}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#fa8c16' }}>
                      🗓️ 6个月订单
                    </span>
                  </div>
                  <Progress 
                    type="circle"
                    percent={Number((stats?.six_month_percentage || 0).toFixed(2))} 
                    status="active"
                    strokeColor="#fa8c16"
                    format={percent => `${percent}%`}
                    width={80}
                  />
                  <div style={{ marginTop: 12, fontSize: '12px', color: '#666' }}>
                    <div>{stats?.six_month_orders || 0} 笔</div>
                    <div style={{ marginTop: 4 }}>
                      占比 <span style={{ fontWeight: 'bold', color: '#fa8c16' }}>
                        {(Number(stats?.six_month_percentage) || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <Card bordered={false} style={{ textAlign: 'center', background: '#fff' }}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#722ed1' }}>
                      📍 年费订单
                    </span>
                  </div>
                  <Progress 
                    type="circle"
                    percent={Number((stats?.yearly_percentage || 0).toFixed(2))} 
                    status="active"
                    strokeColor="#722ed1"
                    format={percent => `${percent}%`}
                    width={80}
                  />
                  <div style={{ marginTop: 12, fontSize: '12px', color: '#666' }}>
                    <div>{stats?.yearly_orders || 0} 笔</div>
                    <div style={{ marginTop: 4 }}>
                      占比 <span style={{ fontWeight: 'bold', color: '#722ed1' }}>
                        {(Number(stats?.yearly_percentage) || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
          
          {/* Top5销售排行榜 */}
          <Divider orientation="left">
            <Space>
              <TrophyOutlined style={{ color: '#faad14' }} />
              Top5销售排行榜
            </Space>
          </Divider>
          <Card>
            <Table
              dataSource={top5Sales}
              pagination={false}
              size="middle"
              columns={[
                {
                  title: '排名',
                  dataIndex: 'rank',
                  key: 'rank',
                  width: 80,
                  render: (rank) => {
                    let color = '#666';
                    let icon = null;
                    if (rank === 1) {
                      color = '#faad14';
                      icon = '🥇';
                    } else if (rank === 2) {
                      color = '#c0c0c0';
                      icon = '🥈';
                    } else if (rank === 3) {
                      color = '#cd7f32';
                      icon = '🥉';
                    }
                    return (
                      <span style={{ color, fontWeight: 'bold', fontSize: '16px' }}>
                        {icon} {rank}
                      </span>
                    );
                  }
                },
                {
                  title: '销售类型',
                  dataIndex: 'sales_type',
                  key: 'sales_type',
                  width: 120,
                  render: (type) => {
                    let color = 'blue';
                    if (type === '二级销售') color = 'orange';
                    if (type === '独立销售') color = 'green';
                    return <Tag color={color}>{type}</Tag>;
                  }
                },
                {
                  title: '销售名称',
                  dataIndex: 'sales_name',
                  key: 'sales_name',
                  render: (name) => <span style={{ fontWeight: '500' }}>{name}</span>
                },
                {
                  title: '销售金额',
                  dataIndex: 'total_amount',
                  key: 'total_amount',
                  align: 'right',
                  render: (amount) => (
                    <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                      ${(amount || 0).toFixed(2)}
                    </span>
                  )
                },
                {
                  title: '返佣金额',
                  dataIndex: 'commission_amount',
                  key: 'commission_amount',
                  align: 'right',
                  render: (amount) => (
                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                      ${(amount || 0).toFixed(2)}
                    </span>
                  )
                }
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminOverview; 