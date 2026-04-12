import { Table, Card, Tabs, Tag, Button, Empty, Modal, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import useStore from '../store/useStore'
import { Order, Trade } from '../types'
import { formatMoney, formatVolume } from '../utils/format'

const { confirm } = Modal

function HistoryPage() {
  const { orders, trades, cancelOrder } = useStore()

  const handleCancel = (orderId: string, orderName: string) => {
    confirm({
      title: '确认撤单',
      content: `确定要撤销 ${orderName} 的委托吗？`,
      okText: '确认撤单',
      cancelText: '取消',
      okButtonProps: { danger: true },
      centered: true,
      onOk() {
        if (cancelOrder(orderId)) {
          message.success('撤单成功')
        }
      }
    })
  }

  const orderColumns: ColumnsType<Order> = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
      width: 180,
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong style={{ fontSize: 14 }}>{text}</strong>,
    },
    {
      title: '方向',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (v) => (
        <Tag color={v === 'buy' ? 'red' : 'green'} style={{ fontWeight: 600, borderRadius: 6, padding: '2px 8px' }}>
          {v === 'buy' ? '买入' : '卖出'}
        </Tag>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (v) => <span style={{ fontWeight: 600 }}>{formatMoney(v)}</span>,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (v, record) => {
        if (record.filledQuantity > 0 && record.filledQuantity < record.quantity) {
          return <span style={{ color: 'var(--orange-primary)', fontWeight: 700 }}>{formatVolume(record.filledQuantity)}/{formatVolume(v)}</span>
        }
        return <span style={{ fontWeight: 500 }}>{formatVolume(v)}</span>
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v) => v ? <span style={{ fontWeight: 500 }}>¥ {formatMoney(v)}</span> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'blue', text: '已报' },
          partial: { color: 'orange', text: '部成' },
          filled: { color: 'green', text: '已成' },
          cancelled: { color: 'default', text: '已撤' },
          rejected: { color: 'red', text: '废单' },
        }
        const { color, text } = statusMap[v]
        return <Tag color={color} style={{ fontWeight: 600, borderRadius: 6, padding: '2px 8px' }}>{text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        record.status === 'pending' || record.status === 'partial' ? (
          <Button 
            type="link" 
            danger 
            size="small" 
            icon={<DeleteOutlined />}
            onClick={() => handleCancel(record.id, record.name)}
          >
            撤单
          </Button>
        ) : null
      ),
    },
  ]

  const tradeColumns: ColumnsType<Trade> = [
    {
      title: '成交时间',
      dataIndex: 'time',
      key: 'time',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
      width: 180,
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong style={{ fontSize: 14 }}>{text}</strong>,
    },
    {
      title: '方向',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (v) => (
        <Tag color={v === 'buy' ? 'red' : 'green'} style={{ fontWeight: 600, borderRadius: 6, padding: '2px 8px' }}>
          {v === 'buy' ? '买入' : '卖出'}
        </Tag>
      ),
    },
    {
      title: '成交价格',
      dataIndex: 'price',
      key: 'price',
      render: (v) => <span style={{ fontWeight: 600 }}>{formatMoney(v)}</span>,
    },
    {
      title: '成交数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (v) => <span style={{ fontWeight: 500 }}>{formatVolume(v)}</span>,
    },
    {
      title: '成交金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v) => <span style={{ fontWeight: 500 }}>¥ {formatMoney(v)}</span>,
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      key: 'fee',
      render: (v) => v?.total ? <span style={{ color: 'var(--text-secondary)' }}>¥ {formatMoney(v.total)}</span> : '-',
    },
  ]

  const tabItems = [
    {
      key: 'trades',
      label: '📊 成交记录',
      children: (
        <Table
          columns={tradeColumns}
          dataSource={trades.sort((a, b) => b.time - a.time)}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          size="middle"
          locale={{
            emptyText: <Empty description="暂无成交记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
        />
      ),
    },
    {
      key: 'orders',
      label: '📋 委托记录',
      children: (
        <Table
          columns={orderColumns}
          dataSource={orders.sort((a, b) => b.time - a.time)}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          size="middle"
          locale={{
            emptyText: <Empty description="暂无委托记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
        />
      ),
    },
  ]

  return (
    <Card className="card-glass animate-slide-up" styles={{ body: { padding: 0 } }}>
      <Tabs 
        items={tabItems} 
        defaultActiveKey="trades" 
        size="large"
        style={{ padding: '0 20px' }}
      />
    </Card>
  )
}

export default HistoryPage
