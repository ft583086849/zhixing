import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Row, Col, Statistic, Spin, Progress, Radio, DatePicker, Space, Typography, Divider } from 'antd';
import { 
  ShoppingCartOutlined, 
  DollarOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CrownOutlined,
  TeamOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { getStats } from '../../store/slices/adminSlice';


const { Title } = Typography;
const { RangePicker } = DatePicker;

const AdminOverview = () => {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.admin);
  const { admin } = useSelector((state) => state.auth);
  const [timeRange, setTimeRange] = useState('today');
  const [customRange, setCustomRange] = useState([]);

  useEffect(() => {
    // 只有在已登录的情况下才获取数据
    if (admin) {
      if (timeRange === 'custom' && customRange.length > 0) {
        dispatch(getStats({ timeRange: 'custom', customRange }));
      } else {
        dispatch(getStats({ timeRange }));
      }
    }
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

          {/* 统计卡片 */}
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
                  title="待付款确认"
                  value={stats?.pending_payment_orders || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="待配置确认"
                  value={stats?.pending_config_orders || 0}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="已付款确认"
                  value={stats?.confirmed_payment_orders || 0}
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
                  title="已配置确认"
                  value={stats?.confirmed_config_orders || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="总销售额"
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
                  value={stats?.total_commission || 0}
                  prefix={<GiftOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                  suffix="美元"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="总客户数"
                  value={stats?.total_customers || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 销售层级统计 */}
          <Divider orientation="left">销售层级统计</Divider>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="一级销售总数"
                  value={stats?.primary_sales_count || 0}
                  prefix={<CrownOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="二级销售总数"
                  value={stats?.secondary_sales_count || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="一级销售业绩"
                  value={stats?.primary_sales_amount || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                  suffix="美元"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="二级销售业绩"
                  value={stats?.secondary_sales_amount || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#13c2c2' }}
                  suffix="美元"
                />
              </Card>
            </Col>
          </Row>

          {/* 层级关系统计 */}
          <Divider orientation="left">层级关系统计</Divider>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card role="region">
                <Statistic
                  title="平均二级销售数"
                  value={stats?.avg_secondary_per_primary || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#eb2f96' }}
                  precision={1}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card role="region">
                <Statistic
                  title="最高二级销售数"
                  value={stats?.max_secondary_per_primary || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card role="region">
                <Statistic
                  title="活跃层级关系"
                  value={stats?.active_hierarchies || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 订单金额分布 */}
          <Card title="订单金额分布" style={{ marginTop: 24 }} role="region">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div>
                  <p>188元订单</p>
                  <Progress 
                    percent={stats?.amount_188_percentage || 0} 
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <p>数量: {stats?.amount_188_orders || 0} | 占比: {stats?.amount_188_percentage || 0}%</p>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <p>488元订单</p>
                  <Progress 
                    percent={stats?.amount_488_percentage || 0} 
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <p>数量: {stats?.amount_488_orders || 0} | 占比: {stats?.amount_488_percentage || 0}%</p>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <p>688元订单</p>
                  <Progress 
                    percent={stats?.amount_688_percentage || 0} 
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <p>数量: {stats?.amount_688_orders || 0} | 占比: {stats?.amount_688_percentage || 0}%</p>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <p>1588元订单</p>
                  <Progress 
                    percent={stats?.amount_1588_percentage || 0} 
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <p>数量: {stats?.amount_1588_orders || 0} | 占比: {stats?.amount_1588_percentage || 0}%</p>
                </div>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminOverview; 