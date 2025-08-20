/**
 * 销售统计排除配置组件
 * 用于管理不计入统计的销售账号
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Alert,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  UserDeleteOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ExcludedSalesService from '../../services/excludedSalesService';

const { Option } = Select;
const { TextArea } = Input;

const ExcludedSalesConfig = () => {
  const [loading, setLoading] = useState(false);
  const [excludedList, setExcludedList] = useState([]);
  const [excludedStats, setExcludedStats] = useState({
    excluded_count: 0,
    excluded_orders: 0,
    excluded_amount: 0,
    excluded_commission: 0
  });
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 加载排除名单
  const loadExcludedSales = async () => {
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([
        ExcludedSalesService.getExcludedSales(),
        ExcludedSalesService.getExclusionStats()
      ]);
      
      setExcludedList(list);
      setExcludedStats(stats);
    } catch (error) {
      message.error('加载排除名单失败');
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExcludedSales();
  }, []);

  // 添加到排除名单
  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const result = await ExcludedSalesService.addExcludedSales({
        ...values,
        excluded_by: localStorage.getItem('adminName') || 'admin'
      });

      if (result.success) {
        message.success(result.message);
        setAddModalVisible(false);
        form.resetFields();
        loadExcludedSales(); // 重新加载列表
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('添加失败');
      console.error('添加失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 从排除名单中恢复
  const handleRestore = async (wechat_name) => {
    setLoading(true);
    try {
      const result = await ExcludedSalesService.restoreExcludedSales(
        wechat_name,
        localStorage.getItem('adminName') || 'admin'
      );

      if (result.success) {
        message.success(result.message);
        loadExcludedSales(); // 重新加载列表
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('恢复失败');
      console.error('恢复失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '销售微信号',
      dataIndex: 'wechat_name',
      key: 'wechat_name',
      render: (text) => (
        <Space>
          <UserDeleteOutlined style={{ color: '#ff4d4f' }} />
          <strong>{text}</strong>
        </Space>
      )
    },
    {
      title: '销售代码',
      dataIndex: 'sales_code',
      key: 'sales_code',
      render: (text) => text || '-'
    },
    {
      title: '销售类型',
      dataIndex: 'sales_type',
      key: 'sales_type',
      render: (type) => {
        const typeMap = {
          primary: { text: '一级销售', color: 'blue' },
          secondary: { text: '二级销售', color: 'green' }
        };
        const info = typeMap[type] || { text: type || '未知', color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      }
    },
    {
      title: '排除原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          {text || '未说明'}
        </Tooltip>
      )
    },
    {
      title: '排除时间',
      dataIndex: 'excluded_at',
      key: 'excluded_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作人',
      dataIndex: 'excluded_by',
      key: 'excluded_by'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="恢复统计"
          description={`确定要恢复 ${record.wechat_name} 的统计吗？`}
          onConfirm={() => handleRestore(record.wechat_name)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger>
            恢复统计
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div>
      {/* 统计信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Alert
          message="统计排除说明"
          description="被排除的销售账号产生的所有订单、收益、分佣等数据将不计入管理后台的统计数据中，但原始数据仍然保留，销售自己的对账页面不受影响。"
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
        
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="排除销售数"
              value={excludedStats.excluded_count}
              prefix={<UserDeleteOutlined />}
              suffix="个"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="影响订单数"
              value={excludedStats.excluded_orders}
              suffix="单"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="影响金额"
              value={excludedStats.excluded_amount}
              prefix="$"
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="影响佣金"
              value={excludedStats.excluded_commission}
              prefix="$"
              precision={2}
            />
          </Col>
        </Row>
      </Card>

      {/* 操作栏 */}
      <Card
        title="统计排除名单"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
          >
            添加排除
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={excludedList}
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

      {/* 添加模态框 */}
      <Modal
        title="添加排除销售"
        open={addModalVisible}
        onOk={handleAdd}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            sales_type: 'primary'
          }}
        >
          <Form.Item
            name="wechat_name"
            label="销售微信号"
            rules={[
              { required: true, message: '请输入销售微信号' }
            ]}
          >
            <Input
              placeholder="请输入要排除的销售微信号"
              prefix={<UserDeleteOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="sales_code"
            label="销售代码"
            tooltip="可选，如果知道销售代码可以填写"
          >
            <Input placeholder="销售代码（可选）" />
          </Form.Item>

          <Form.Item
            name="sales_type"
            label="销售类型"
          >
            <Select>
              <Option value="primary">一级销售</Option>
              <Option value="secondary">二级销售</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="排除原因"
            rules={[
              { required: true, message: '请说明排除原因' }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="请说明排除原因，如：测试账号、内部账号、特殊渠道等"
            />
          </Form.Item>
        </Form>

        <Alert
          message="注意"
          description="添加后，该销售的所有历史和未来数据都将从统计中排除，但不会删除原始数据。"
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Modal>
    </div>
  );
};

export default ExcludedSalesConfig;