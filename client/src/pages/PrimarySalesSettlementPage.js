import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, Select, message, Tag, Space, Tooltip } from 'antd';
import { DollarOutlined, UserOutlined, ShoppingCartOutlined, TeamOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPrimarySalesStats, fetchPrimarySalesOrders, updateSecondarySalesCommission, removeSecondarySales } from '../store/slices/salesSlice';

const { Option } = Select;

const PrimarySalesSettlementPage = () => {
  const dispatch = useDispatch();
  const { primarySalesStats, primarySalesOrders, loading } = useSelector(state => state.sales);
  const [commissionModalVisible, setCommissionModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [selectedSecondarySales, setSelectedSecondarySales] = useState(null);
  const [commissionForm] = Form.useForm();
  const [removeForm] = Form.useForm();

  useEffect(() => {
    // 获取一级销售统计数据
    dispatch(fetchPrimarySalesStats());
    // 获取一级销售订单列表
    dispatch(fetchPrimarySalesOrders());
  }, [dispatch]);

  // 佣金统计卡片
  const renderStatsCards = () => (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
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
      <Col span={6}>
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
      <Col span={6}>
        <Card>
          <Statistic
            title="二级销售数量"
            value={primarySalesStats?.secondarySalesCount || 0}
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
      render: (amount) => `¥${amount}`
    },
    {
      title: '佣金金额',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      width: 100,
      render: (commission) => `¥${commission}`
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
          'approved': { text: '已通过', color: 'green' },
          'rejected': { text: '已拒绝', color: 'red' },
          'completed': { text: '已完成', color: 'blue' }
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
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            onClick={() => handleUrgeOrder(record)}
            disabled={record.status !== 'pending_review'}
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
      title: '微信名',
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
        return methodMap[method] || method;
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
      render: (commission) => `¥${commission || 0}`
    },
    {
      title: '订单数量',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 100,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => new Date(date).toLocaleString('zh-CN')
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
      
      await dispatch(updateSecondarySalesCommission({
        secondarySalesId: selectedSecondarySales.id,
        commissionRate
      })).unwrap();
      
      message.success('佣金率更新成功');
      setCommissionModalVisible(false);
      commissionForm.resetFields();
      
      // 刷新数据
      dispatch(fetchPrimarySalesStats());
      dispatch(fetchPrimarySalesOrders());
    } catch (error) {
      message.error('佣金率更新失败');
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
      await dispatch(removeSecondarySales(selectedSecondarySales.id)).unwrap();
      message.success('二级销售移除成功');
      setRemoveModalVisible(false);
      
      // 刷新数据
      dispatch(fetchPrimarySalesStats());
      dispatch(fetchPrimarySalesOrders());
    } catch (error) {
      message.error('移除失败');
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

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>一级销售订单结算</h1>
      
      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 二级销售管理 */}
      <Card title="二级销售管理" style={{ marginBottom: 24 }}>
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
      <Card title="我的订单列表">
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
            label="二级销售微信名"
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
            <Input type="number" placeholder="请输入佣金率" />
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
    </div>
  );
};

export default PrimarySalesSettlementPage; 