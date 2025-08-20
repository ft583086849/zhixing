import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  DatePicker,
  Button,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Modal,
  Form,
  Input,
  message,
  Divider,
  Alert,
  Badge
} from 'antd';
import { 
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExportOutlined,
  PrinterOutlined,
  WalletOutlined,
  BankOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { SupabaseService } from '../../services/supabase';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const SalesReconciliation = ({ salesType = 'primary' }) => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [reconciliationData, setReconciliationData] = useState([]);
  const [selectedSales, setSelectedSales] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [statistics, setStatistics] = useState({
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    salesCount: 0
  });

  // 获取对账数据
  const fetchReconciliationData = async () => {
    setLoading(true);
    try {
      // 获取销售人员列表
      const salesTable = salesType === 'primary' ? 'primary_sales' : 'secondary_sales';
      const { data: salesData } = await SupabaseService.supabase
        .from(salesTable)
        .select('*')
        .order('sales_code');

      // 获取佣金记录
      const { data: commissionData } = await SupabaseService.supabase
        .from('commission_records')
        .select('*')
        .eq('sales_type', salesType)
        .gte('created_at', dateRange[0].format('YYYY-MM-DD'))
        .lte('created_at', dateRange[1].format('YYYY-MM-DD'));

      // 整合数据
      const reconciliation = salesData?.map(sales => {
        const commissions = commissionData?.filter(c => c.sales_id === sales.id) || [];
        const totalCommission = commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        const paidCommission = commissions
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        const pendingCommission = totalCommission - paidCommission;
        
        return {
          ...sales,
          order_count: commissions.length,
          total_commission: totalCommission,
          paid_commission: paidCommission,
          pending_commission: pendingCommission,
          commissions: commissions,
          last_payment_date: commissions
            .filter(c => c.payment_date)
            .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0]?.payment_date
        };
      }).filter(s => s.order_count > 0); // 只显示有订单的销售

      setReconciliationData(reconciliation || []);
      
      // 计算统计
      const stats = {
        totalCommission: reconciliation?.reduce((sum, r) => sum + r.total_commission, 0) || 0,
        paidCommission: reconciliation?.reduce((sum, r) => sum + r.paid_commission, 0) || 0,
        pendingCommission: reconciliation?.reduce((sum, r) => sum + r.pending_commission, 0) || 0,
        salesCount: reconciliation?.length || 0
      };
      setStatistics(stats);
    } catch (error) {
      console.error('获取对账数据失败:', error);
      message.error('获取对账数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliationData();
  }, [dateRange, salesType]);

  // 标记为已支付
  const handleMarkAsPaid = async (record) => {
    try {
      // 更新所有待支付的佣金记录
      const pendingCommissions = record.commissions.filter(c => c.status === 'pending');
      
      for (const commission of pendingCommissions) {
        await SupabaseService.supabase
          .from('commission_records')
          .update({
            status: 'paid',
            payment_date: new Date().toISOString(),
            payment_method: 'manual',
            payment_note: `批量支付 - ${dayjs().format('YYYY-MM-DD')}`
          })
          .eq('id', commission.id);
      }
      
      message.success('已标记为已支付');
      fetchReconciliationData();
    } catch (error) {
      console.error('更新支付状态失败:', error);
      message.error('更新支付状态失败');
    }
  };

  // 导出对账单
  const handleExport = () => {
    const csvContent = [
      [
        '销售代码', '销售姓名', '微信号', '订单数', 
        '总佣金', '已付佣金', '待付佣金', '最后支付日期'
      ],
      ...reconciliationData.map(r => [
        r.sales_code,
        r.name || '-',
        r.wechat_name,
        r.order_count,
        r.total_commission.toFixed(2),
        r.paid_commission.toFixed(2),
        r.pending_commission.toFixed(2),
        r.last_payment_date ? dayjs(r.last_payment_date).format('YYYY-MM-DD') : '-'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `对账单_${salesType}_${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
    
    message.success('导出成功');
  };

  // 查看详情
  const handleViewDetails = (record) => {
    setSelectedSales(record);
    setPaymentModal(true);
  };

  const columns = [
    {
      title: '销售信息',
      key: 'sales_info',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div>
            <strong>{record.sales_code}</strong>
            {record.is_independent && (
              <Tag color="green" style={{ marginLeft: 8 }}>独立</Tag>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.wechat_name}
          </div>
        </div>
      )
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 100,
      align: 'center',
      render: (count) => <Badge count={count} showZero />
    },
    {
      title: '总佣金',
      dataIndex: 'total_commission',
      key: 'total_commission',
      width: 120,
      align: 'right',
      render: (amount) => (
        <Statistic 
          value={amount} 
          prefix="$" 
          precision={2}
          valueStyle={{ fontSize: 14 }}
        />
      )
    },
    {
      title: '已付佣金',
      dataIndex: 'paid_commission',
      key: 'paid_commission',
      width: 120,
      align: 'right',
      render: (amount) => (
        <Statistic 
          value={amount} 
          prefix="$" 
          precision={2}
          valueStyle={{ fontSize: 14, color: '#52c41a' }}
        />
      )
    },
    {
      title: '待付佣金',
      dataIndex: 'pending_commission',
      key: 'pending_commission',
      width: 120,
      align: 'right',
      render: (amount) => (
        <Statistic 
          value={amount} 
          prefix="$" 
          precision={2}
          valueStyle={{ fontSize: 14, color: '#faad14' }}
        />
      )
    },
    {
      title: '支付信息',
      key: 'payment_info',
      width: 200,
      render: (_, record) => (
        <div>
          {record.payment_method === 'alipay' && (
            <div>
              <Tag color="blue">支付宝</Tag>
              <Text style={{ fontSize: 12 }}>{record.alipay_account}</Text>
            </div>
          )}
          {record.payment_method === 'crypto' && (
            <div>
              <Tag color="orange">USDT</Tag>
              <Text style={{ fontSize: 12 }} copyable>{record.crypto_address}</Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: '最后支付',
      dataIndex: 'last_payment_date',
      key: 'last_payment_date',
      width: 120,
      render: (date) => date ? dayjs(date).format('MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            查看明细
          </Button>
          {record.pending_commission > 0 && (
            <Button 
              type="primary" 
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkAsPaid(record)}
            >
              标记已付
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '0 24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        {salesType === 'primary' ? '一级销售对账' : '二级/独立销售对账'}
      </Title>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="销售人数"
              value={statistics.salesCount}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总佣金"
              value={statistics.totalCommission}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已付佣金"
              value={statistics.paidCommission}
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
              value={statistics.pendingCommission}
              prefix={<WalletOutlined />}
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large">
          <RangePicker 
            value={dateRange}
            onChange={setDateRange}
            presets={[
              { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
              { label: '上月', value: [
                dayjs().subtract(1, 'month').startOf('month'), 
                dayjs().subtract(1, 'month').endOf('month')
              ]},
              { label: '本季度', value: [dayjs().startOf('quarter'), dayjs().endOf('quarter')] },
            ]}
          />
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出对账单
          </Button>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            打印对账单
          </Button>
        </Space>
      </Card>

      {/* 提示信息 */}
      <Alert
        message="对账说明"
        description={
          <div>
            <div>1. 佣金计算规则：{salesType === 'primary' ? '一级销售40%' : '二级销售25%，独立销售10%'}</div>
            <div>2. 结算周期：每月1日结算上月佣金</div>
            <div>3. 最低结算金额：$100</div>
            <div>4. 支付方式：支付宝或USDT</div>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 对账表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={reconciliationData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          summary={(pageData) => {
            const totalPending = pageData.reduce((sum, r) => sum + r.pending_commission, 0);
            const totalPaid = pageData.reduce((sum, r) => sum + r.paid_commission, 0);
            
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <strong>合计</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    {pageData.reduce((sum, r) => sum + r.order_count, 0)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <strong>${(totalPending + totalPaid).toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <strong style={{ color: '#52c41a' }}>${totalPaid.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <strong style={{ color: '#faad14' }}>${totalPending.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} colSpan={3}>-</Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title={`佣金明细 - ${selectedSales?.sales_code}`}
        open={paymentModal}
        onCancel={() => setPaymentModal(false)}
        width={800}
        footer={null}
      >
        {selectedSales && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Statistic 
                  title="总佣金" 
                  value={selectedSales.total_commission} 
                  prefix="$"
                  precision={2}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="已付" 
                  value={selectedSales.paid_commission} 
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="待付" 
                  value={selectedSales.pending_commission} 
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Table
              dataSource={selectedSales.commissions}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: '订单号',
                  dataIndex: 'order_number',
                  width: 120
                },
                {
                  title: '订单金额',
                  dataIndex: 'order_amount',
                  align: 'right',
                  render: (v) => `$${v}`
                },
                {
                  title: '佣金率',
                  dataIndex: 'commission_rate',
                  align: 'center',
                  render: (v) => `${v}%`
                },
                {
                  title: '佣金',
                  dataIndex: 'commission_amount',
                  align: 'right',
                  render: (v) => `$${v.toFixed(2)}`
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  align: 'center',
                  render: (status) => (
                    <Tag color={status === 'paid' ? 'green' : 'orange'}>
                      {status === 'paid' ? '已付' : '待付'}
                    </Tag>
                  )
                },
                {
                  title: '创建时间',
                  dataIndex: 'created_at',
                  render: (date) => dayjs(date).format('MM-DD HH:mm')
                }
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesReconciliation;