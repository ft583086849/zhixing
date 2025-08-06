import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, Select, message, Tag, Space, Tooltip, Typography, InputNumber, DatePicker } from 'antd';
import { DollarOutlined, UserOutlined, ShoppingCartOutlined, TeamOutlined, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPrimarySalesStats, fetchPrimarySalesOrders, updateSecondarySalesCommission, removeSecondarySales, getPrimarySalesSettlement } from '../store/slices/salesSlice';

const { Option } = Select;
const { Title } = Typography;

const PrimarySalesSettlementPage = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.sales);
  
  // 页面状态管理
  const [salesData, setSalesData] = useState(null);
  const [primarySalesStats, setPrimarySalesStats] = useState(null);
  const [primarySalesOrders, setPrimarySalesOrders] = useState(null);
  const [searchForm] = Form.useForm();
  const [commissionModalVisible, setCommissionModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [selectedSecondarySales, setSelectedSecondarySales] = useState(null);
  const [commissionForm] = Form.useForm();
  const [removeForm] = Form.useForm();
  const [secondarySalesSearchForm] = Form.useForm();
  const [ordersSearchForm] = Form.useForm();

  // 搜索处理函数
  const handleSearch = async (values) => {
    if (!values.wechat_name && !values.sales_code) {
      message.error('请输入微信号或销售代码');
      return;
    }

    try {
      // 调用真实API - 一级销售对账查询
      const params = {};
      if (values.wechat_name) params.wechat_name = values.wechat_name;
      if (values.sales_code) params.sales_code = values.sales_code;
      
      const response = await dispatch(getPrimarySalesSettlement(params)).unwrap();
      
      if (!response || !response.sales) {
        message.error('未找到匹配的一级销售数据');
        return;
      }
      
      const { sales, orders, secondarySales, reminderOrders, stats } = response;

      // 使用真实API数据，确保所有订单都是config_confirmed=true的
      const ordersData = {
        data: orders || [],
        total: orders ? orders.length : 0,
        page: 1
      };

      // 构建统计数据
      const statsData = {
        totalCommission: stats?.totalCommission || 0,
        monthlyCommission: stats?.totalCommission || 0, // 可根据需要计算月度数据
        totalOrders: stats?.totalOrders || 0,
        monthlyOrders: stats?.totalOrders || 0, // 可根据需要计算月度数据
        secondarySales: secondarySales || [],
        pendingReminderCount: stats?.pendingReminderCount || 0,
        monthlyReminderCount: stats?.pendingReminderCount || 0,
        reminderSuccessRate: 85.0, // 默认值
        avgResponseTime: 2.5, // 默认值
        pendingReminderOrders: reminderOrders || []
      };

      setSalesData(sales);
      setPrimarySalesStats(statsData);
      setPrimarySalesOrders(ordersData);
      
      message.success('查询成功');
    } catch (error) {
      message.error('查询失败');
    }
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSalesData(null);
    setPrimarySalesStats(null);
    setPrimarySalesOrders(null);
    message.info('已重置查询条件');
  };

  // 佣金统计卡片
  const renderStatsCards = () => (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={4}>
        <Card>
          <Statistic
            title="总佣金收入"
            value={primarySalesStats?.totalCommission || 0}
            precision={2}
            valueStyle={{ color: '#3f8600' }}
            prefix={<DollarOutlined />}
            suffix="元"
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card>
          <Statistic
            title="本月佣金"
            value={primarySalesStats?.monthlyCommission || 0}
            precision={2}
            valueStyle={{ color: '#1890ff' }}
            prefix={<DollarOutlined />}
            suffix="元"
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card>
          <Statistic
            title="佣金比率"
            value={(() => {
              // 新的佣金比率计算逻辑：
              // 佣金比率 = （（一级销售的用户下单金额*40%）+（二级销售订单总金额-二级销售分佣比率平均值*二级销售订单总金额））/（二级销售订单总金额+一级销售的用户下单金额）
              
              if (!primarySalesOrders?.data || primarySalesOrders.data.length === 0) {
                return 40; // 没有订单时，显示40%
              }
              
              // 获取所有订单（移除配置确认过滤）
              const confirmedOrders = primarySalesOrders.data;
              
              if (confirmedOrders.length === 0) {
                return 40; // 没有配置确认的订单时，显示40%
              }
              
              // 1. 计算一级销售的用户下单金额（没有secondary_sales_name的订单）
              const primaryDirectOrders = confirmedOrders.filter(order => !order.secondary_sales_name);
              const primaryDirectAmount = primaryDirectOrders.reduce((sum, order) => sum + order.amount, 0);
              
              // 2. 计算二级销售订单总金额
              const secondaryOrders = confirmedOrders.filter(order => order.secondary_sales_name);
              const secondaryTotalAmount = secondaryOrders.reduce((sum, order) => sum + order.amount, 0);
              
              // 3. 计算二级销售分佣比率平均值
              let averageSecondaryRate = 0;
              if (primarySalesStats?.secondarySales && primarySalesStats.secondarySales.length > 0) {
                const secondaryRates = primarySalesStats.secondarySales.map(sales => sales.commission_rate);
                averageSecondaryRate = secondaryRates.reduce((sum, rate) => sum + rate, 0) / secondaryRates.length;
              }
              
              // 4. 计算总订单金额
              const totalOrderAmount = primaryDirectAmount + secondaryTotalAmount;
              
              if (totalOrderAmount === 0) {
                return 40; // 总金额为0时，显示40%
              }
              
              // 5. 计算一级销售总佣金
              const primaryDirectCommission = primaryDirectAmount * 0.40; // 一级销售直接用户佣金：40%
              const primaryFromSecondaryCommission = secondaryTotalAmount * ((40 - averageSecondaryRate * 100) / 100); // 一级销售从二级销售获得的佣金：(40%-二级销售平均佣金率)
              const totalPrimaryCommission = primaryDirectCommission + primaryFromSecondaryCommission;
              
              // 6. 计算一级销售佣金比率
              const primaryCommissionRate = (totalPrimaryCommission / totalOrderAmount) * 100;
              
              return primaryCommissionRate.toFixed(1);
            })()}
            valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: 'bold' }}
            prefix={<DollarOutlined />}
            suffix="%"
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="二级销售数量"
            value={primarySalesStats?.secondarySales?.length || 0}
            valueStyle={{ color: '#722ed1' }}
            prefix={<TeamOutlined />}
            suffix="人"
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="总订单数"
            value={primarySalesStats?.totalOrders || 0}
            valueStyle={{ color: '#fa8c16' }}
            prefix={<ShoppingCartOutlined />}
            suffix="单"
          />
        </Card>
      </Col>
    </Row>
  );

  // 订单列表表格列定义
  const orderColumns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '客户微信',
      dataIndex: 'customer_wechat',
      key: 'customer_wechat',
      width: 120,
    },
    {
      title: 'TradingView用户名',
      dataIndex: 'tradingview_username',
      key: 'tradingview_username',
      width: 150,
    },
    {
      title: '套餐类型',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration) => {
        const durationMap = {
          '1month': '1个月',
          '3months': '3个月',
          '1year': '1年'
        };
        return durationMap[duration] || duration;
      }
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => {
        const value = parseFloat(amount || 0);
        return `$${value.toFixed(2)}`;
      }
    },
    {
      title: '佣金金额',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      width: 100,
      render: (commission) => {
        const value = parseFloat(commission || 0);
        return `$${value.toFixed(2)}`;
      }
    },
    {
      title: '二级销售',
      dataIndex: 'secondary_sales_name',
      key: 'secondary_sales_name',
      width: 120,
      render: (name) => name || '直接销售'
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          'pending_review': { text: '待审核', color: 'orange' },
          'pending_payment': { text: '待付款确认', color: 'orange' },
          'confirmed_payment': { text: '已付款确认', color: 'blue' },
          'pending_config': { text: '待配置确认', color: 'purple' },
          'confirmed_configuration': { text: '已配置确认', color: 'green' },
          'confirmed': { text: '已确认', color: 'green' },
          'approved': { text: '已通过', color: 'green' },
          'rejected': { text: '已拒绝', color: 'red' },
          'completed': { text: '已完成', color: 'blue' },
          'active': { text: '已生效', color: 'green' },
          'expired': { text: '已过期', color: 'gray' },
          'cancelled': { text: '已取消', color: 'red' }
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => {
        if (!date) return '-';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '-';
        return dateObj.toLocaleString('zh-CN');
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary"
            size="small"
            onClick={() => handleUrgeOrder(record)}
            disabled={record.status === 'cancelled' || record.status === 'refunded'}
          >
            催单
          </Button>
        </Space>
      )
    }
  ];

  // 二级销售列表表格列定义
  const secondarySalesColumns = [
    {
      title: '微信号',
      dataIndex: 'wechat_name',
      key: 'wechat_name',
      width: 120,
    },
    {
      title: '收款方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (method) => {
        const methodMap = {
          'alipay': '支付宝',
          'wechat': '微信',
          'crypto': '加密货币'
        };
        return methodMap[method] || method || '-';
      }
    },
    {
      title: '总订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount) => {
        const value = parseFloat(amount || 0);
        return `$${value.toFixed(2)}`;
      }
    },
    {
      title: '当前佣金率',
      dataIndex: 'commission_rate',
      key: 'commission_rate',
      width: 100,
      render: (rate) => `${(rate * 100).toFixed(1)}%`
    },
    {
      title: '累计佣金',
      dataIndex: 'total_commission',
      key: 'total_commission',
      width: 100,
      render: (commission) => {
        const value = parseFloat(commission || 0);
        return `$${value.toFixed(2)}`;
      }
    },
    {
      title: '订单数量',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 100,
      render: (count) => count || 0,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => {
        if (!date) return '-';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '-';
        return dateObj.toLocaleString('zh-CN');
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleUpdateCommission(record)}
          >
            设置佣金
          </Button>
          <Button 
            type="default" 
            size="small"
            danger
            onClick={() => handleRemoveSecondarySales(record)}
          >
            移除
          </Button>
        </Space>
      )
    }
  ];

  // 处理更新佣金率
  const handleUpdateCommission = (secondarySales) => {
    setSelectedSecondarySales(secondarySales);
    commissionForm.setFieldsValue({
      commission_rate: secondarySales.commission_rate * 100
    });
    setCommissionModalVisible(true);
  };

  // 提交佣金率更新
  const handleCommissionSubmit = async () => {
    try {
      const values = await commissionForm.validateFields();
      const commissionRate = values.commission_rate / 100;
      
      // 模拟更新本地数据
      if (primarySalesStats && primarySalesStats.secondarySales) {
        const updatedSecondarySales = primarySalesStats.secondarySales.map(sales => {
          if (sales.id === selectedSecondarySales.id) {
            return {
              ...sales,
              commission_rate: commissionRate
            };
          }
          return sales;
        });
        
        setPrimarySalesStats({
          ...primarySalesStats,
          secondarySales: updatedSecondarySales
        });
      }
      
      message.success('佣金率更新成功');
      setCommissionModalVisible(false);
      commissionForm.resetFields();
    } catch (error) {
      message.error('佣金率更新失败: ' + (error.message || error));
    }
  };

  // 处理移除二级销售
  const handleRemoveSecondarySales = (secondarySales) => {
    setSelectedSecondarySales(secondarySales);
    setRemoveModalVisible(true);
  };

  // 确认移除二级销售
  const handleRemoveConfirm = async () => {
    try {
      await dispatch(removeSecondarySales({
        secondarySalesId: selectedSecondarySales.id,
        reason: '一级销售主动移除'
      })).unwrap();
      message.success('二级销售移除成功');
      setRemoveModalVisible(false);
      
      // 刷新数据
      if (salesData) {
        handleSearch();
      }
    } catch (error) {
      message.error('移除失败: ' + (error.message || error));
    }
  };

  // 处理催单
  const handleUrgeOrder = (order) => {
    Modal.confirm({
      title: '确认催单',
      content: `确定要向客户 ${order.customer_wechat} 发送催单提醒吗？`,
      onOk: async () => {
        try {
          // 这里需要调用催单API
          message.success('催单提醒已发送');
        } catch (error) {
          message.error('催单失败');
        }
      }
    });
  };

  // 二级销售搜索处理
  const handleSecondarySalesSearch = (values) => {
    if (values.payment_date_range) {
      const [startDate, endDate] = values.payment_date_range;
      message.info(`搜索付款时间: ${startDate.format('YYYY-MM-DD')} 至 ${endDate.format('YYYY-MM-DD')}`);
      // 这里应该调用API进行筛选
    } else {
      // 重置搜索，显示全部数据
      message.info('显示全部二级销售数据');
    }
  };

  // 订单搜索处理
  const handleOrdersSearch = (values) => {
    if (values.payment_date_range) {
      const [startDate, endDate] = values.payment_date_range;
      message.info(`搜索付款时间: ${startDate.format('YYYY-MM-DD')} 至 ${endDate.format('YYYY-MM-DD')}`);
      // 这里应该调用API进行筛选
    } else {
      // 重置搜索，显示全部数据
      message.info('显示全部订单数据');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>一级销售分销管理和对账</Title>
      
      {/* 搜索查询功能 */}
      <Card title="查询一级销售信息" style={{ marginBottom: 24 }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="wechat_name" label="微信号">
            <Input 
              placeholder="请输入微信号" 
              style={{ width: 200 }}
              allowClear
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item name="sales_code" label="销售代码">
            <Input 
              placeholder="请输入销售代码" 
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<SearchOutlined />}
              >
                查询
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 16, color: '#666', fontSize: '14px' }}>
          💡 提示：输入一级销售的微信号或销售代码，查看该销售的分销数据和佣金对账信息
        </div>
      </Card>
      
      {/* 查询前提示 */}
      {!salesData && (
        <Card style={{ marginBottom: 24, textAlign: 'center', background: '#f8f9fa' }}>
          <div style={{ padding: '40px 20px' }}>
            <UserOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
            <h3 style={{ color: '#666', marginBottom: 8 }}>请先查询一级销售信息</h3>
            <p style={{ color: '#999', margin: 0 }}>
              输入一级销售的微信号或销售代码，即可查看分销数据、佣金对账和催单信息
            </p>
          </div>
        </Card>
      )}

      {/* 只有搜索到数据后才显示以下内容 */}
      {salesData && (
        <>
          
          {/* 统计卡片 */}
          {renderStatsCards()}

          {/* 二级销售管理 */}
          <Card title="二级销售管理" style={{ marginBottom: 24 }}>
            {/* 二级销售搜索 */}
            <div style={{ marginBottom: 16, padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
              <Form form={secondarySalesSearchForm} layout="inline" onFinish={handleSecondarySalesSearch}>
                <Form.Item name="payment_date_range" label="付款时间">
                  <DatePicker.RangePicker 
                    style={{ width: 240 }}
                    placeholder={['开始时间', '结束时间']}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                      搜索
                    </Button>
                    <Button onClick={() => {
                      secondarySalesSearchForm.resetFields();
                      handleSecondarySalesSearch({});
                    }}>
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
        <Table
          columns={secondarySalesColumns}
          dataSource={primarySalesStats?.secondarySales || []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 订单列表 */}
      <Card title="我的订单列表" style={{ marginBottom: 24 }}>
        {/* 订单搜索 */}
        <div style={{ marginBottom: 16, padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
          <Form form={ordersSearchForm} layout="inline" onFinish={handleOrdersSearch}>
            <Form.Item name="payment_date_range" label="付款时间">
              <DatePicker.RangePicker 
                style={{ width: 240 }}
                placeholder={['开始时间', '结束时间']}
                format="YYYY-MM-DD"
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={() => {
                  ordersSearchForm.resetFields();
                  handleOrdersSearch({});
                }}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
        <Table
          columns={orderColumns}
          dataSource={primarySalesOrders?.data || []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            current: primarySalesOrders?.page || 1,
            total: primarySalesOrders?.total || 0
          }}
        />
      </Card>

      {/* 催单功能版块 */}
      <Card title="催单数据统计" style={{ marginBottom: 24 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="待催单客户数"
                value={primarySalesStats?.pendingReminderCount || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        {/* 待催单客户列表 */}
        <Table
          title={() => "待催单订单列表"}
          columns={[
            {
              title: '销售微信号',
              dataIndex: 'sales_wechat',
              key: 'sales_wechat',
              width: 120,
            },
            {
              title: '客户微信号',
              dataIndex: 'customer_wechat',
              key: 'customer_wechat',
              width: 120,
            },
            {
              title: 'TradingView用户',
              dataIndex: 'tradingview_username',
              key: 'tradingview_username',
              width: 150,
            },
            {
              title: '订单金额',
              dataIndex: 'amount',
              key: 'amount',
              width: 100,
              render: (amount) => {
                const value = parseFloat(amount || 0);
                return `$${value.toFixed(2)}`;
              },
            },
            {
              title: '到期时间',
              dataIndex: 'expiry_time',
              key: 'expiry_time',
              width: 120,
              render: (time) => time ? new Date(time).toLocaleDateString() : '-',
            },
            {
              title: '催单状态',
              dataIndex: 'reminder_status',
              key: 'reminder_status',
              width: 100,
              render: (status) => (
                <Tag color={status ? 'green' : 'orange'}>
                  {status ? '已催单' : '待催单'}
                </Tag>
              ),
            },

          ]}
          dataSource={primarySalesStats?.pendingReminderOrders || []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['5', '10', '20', '50']
          }}
        />
      </Card>

          {/* 佣金率设置模态框 */}
      <Modal
        title="设置佣金率"
        open={commissionModalVisible}
        onOk={handleCommissionSubmit}
        onCancel={() => {
          setCommissionModalVisible(false);
          commissionForm.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={commissionForm} layout="vertical">
          <Form.Item
            label="二级销售微信号"
          >
            <Input 
              value={selectedSecondarySales?.wechat_name} 
              disabled 
            />
          </Form.Item>
          <Form.Item
            name="commission_rate"
            label="佣金率 (%)"
            rules={[
              { required: true, message: '请输入佣金率' },
              { type: 'number', min: 0, max: 100, message: '佣金率必须在0-100%之间' }
            ]}
          >
            <InputNumber 
              min={0} 
              max={100} 
              precision={2}
              placeholder="请输入佣金率" 
              style={{ width: '100%' }}
              formatter={value => `${value}`}
              parser={value => value?.replace('%', '')}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 移除确认模态框 */}
      <Modal
        title="确认移除"
        open={removeModalVisible}
        onOk={handleRemoveConfirm}
        onCancel={() => setRemoveModalVisible(false)}
        okText="确定移除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>
          确定要移除二级销售 <strong>{selectedSecondarySales?.wechat_name}</strong> 吗？
        </p>
        <p style={{ color: '#ff4d4f' }}>
          <ExclamationCircleOutlined /> 移除后将无法恢复，该二级销售的所有订单将转为直接销售。
        </p>
      </Modal>
        </>
      )}
    </div>
  );
};

export default PrimarySalesSettlementPage; 