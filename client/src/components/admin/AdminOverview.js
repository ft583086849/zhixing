import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Row, Col, Statistic, Spin, Progress, Radio, DatePicker, Space, Typography } from 'antd';
import { 
  ShoppingCartOutlined, 
  DollarOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
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
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="已确认付款"
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
                  title="已确认配置"
                  value={stats?.confirmed_config_orders || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="总收入"
                  value={stats?.total_amount || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card role="region">
                <Statistic
                  title="总佣金"
                  value={stats?.total_commission || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                  precision={2}
                />
              </Card>
            </Col>

          </Row>

          {/* 订单类型分布 */}
          <Card title="订单类型分布" style={{ marginTop: 24 }} role="region">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div>
                  <p>一个月订单</p>
                  <Progress 
                    percent={stats?.one_month_percentage || 0} 
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <p>数量: {stats?.one_month_orders || 0}</p>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <p>三个月订单</p>
                  <Progress 
                    percent={stats?.three_month_percentage || 0} 
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <p>数量: {stats?.three_month_orders || 0}</p>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <p>六个月订单</p>
                  <Progress 
                    percent={stats?.six_month_percentage || 0} 
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <p>数量: {stats?.six_month_orders || 0}</p>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <p>终身订单</p>
                  <Progress 
                    percent={stats?.lifetime_percentage || 0} 
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <p>数量: {stats?.lifetime_orders || 0}</p>
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