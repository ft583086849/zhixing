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
  TeamOutlined
} from '@ant-design/icons';
import { getStats } from '../../store/slices/adminSlice';


const { Title } = Typography;
const { RangePicker } = DatePicker;

const AdminOverview = () => {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.admin);
  const { admin } = useSelector((state) => state.auth);
  const [timeRange, setTimeRange] = useState('all'); // 默认显示所有数据
  const [customRange, setCustomRange] = useState([]);

  useEffect(() => {
    // 🔧 修复：组件挂载时自动清除缓存
    console.log('🧹 数据概览页面：自动清除缓存...');
    // 清除localStorage中的缓存
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.includes('cache-') || key.includes('stats-') || key.includes('admin-')
    );
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    // 清除sessionStorage中的缓存
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('cache-') || key.includes('stats-') || key.includes('admin-')
    );
    sessionKeys.forEach(key => sessionStorage.removeItem(key));
    
    console.log('✅ 缓存已清除，开始加载新数据...');
    
    // 只有在已登录的情况下才获取数据
    if (admin) {
      console.log('📊 AdminOverview: 开始获取统计数据...');
      if (timeRange === 'custom' && customRange.length > 0) {
        dispatch(getStats({ timeRange: 'custom', customRange }))
          .then((result) => {
            console.log('✅ 统计数据获取结果:', result);
            if (!result.payload) {
              console.error('❌ 统计数据为空，尝试重新获取...');
              // 如果没有数据，尝试不带参数调用
              dispatch(getStats());
            }
          })
          .catch((error) => {
            console.error('❌ 获取统计数据失败:', error);
          });
      } else {
        dispatch(getStats({ timeRange }))
          .then((result) => {
            console.log('✅ 统计数据获取结果:', result);
            if (!result.payload) {
              console.error('❌ 统计数据为空，尝试重新获取...');
              // 如果没有数据，尝试不带参数调用
              dispatch(getStats());
            }
          })
          .catch((error) => {
            console.error('❌ 获取统计数据失败:', error);
          });
      }
    } else {
      console.log('⚠️ AdminOverview: 用户未登录，跳过数据加载');
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

          </Row>

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
        </>
      )}
    </div>
  );
};

export default AdminOverview; 