import { Table, Card, Row, Col, Statistic, Tag, Button, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SwapOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { formatMoney, formatPercent, formatVolume } from '../utils/format'

function PortfolioPage() {
  const navigate = useNavigate()
  const { positions, account, stocks, setSelectedStock } = useStore()

  const portfolioData = positions.map(p => {
    const stock = stocks.find(s => s.code === p.code)
    const currentPrice = stock?.price || p.currentPrice
    const marketValue = currentPrice * p.totalQuantity
    const avgCost = p.costAmount / p.totalQuantity
    const profitLoss = marketValue - p.costAmount
    const profitLossPercent = ((currentPrice - avgCost) / avgCost) * 100
    return {
      ...p,
      currentPrice,
      marketValue,
      avgCost,
      profitLoss,
      profitLossPercent,
      stock,
    }
  })

  const totalMarketValue = portfolioData.reduce((sum, p) => sum + p.marketValue, 0)

  const goToTrade = (stock: any) => {
    setSelectedStock(stock)
    navigate('/trade')
  }

  const columns: ColumnsType<(typeof portfolioData)[0]> = [
    {
      title: '证券名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left' as const,
      width: 160,
      render: (text, record) => (
        <div style={{ cursor: 'pointer' }} onClick={() => record.stock && setSelectedStock(record.stock)}>
          <strong style={{ fontSize: 14 }}>{text}</strong>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{record.code}</div>
        </div>
      ),
    },
    {
      title: '持仓数量',
      children: [
        { title: '总持仓', dataIndex: 'totalQuantity', width: 90, align: 'right' as const, render: v => formatVolume(v) },
        { title: '可用', dataIndex: 'availableQuantity', width: 90, align: 'right' as const, render: v => <Tag color="blue" style={{ fontWeight: 500, borderRadius: 6, padding: '2px 8px' }}>{formatVolume(v)}</Tag> },
        { title: '冻结', dataIndex: 'frozenQuantity', width: 90, align: 'right' as const, render: v => v > 0 ? <Tag color="orange" style={{ borderRadius: 6, padding: '2px 8px' }}>{formatVolume(v)}</Tag> : <span style={{ color: 'var(--text-tertiary)' }}>0</span> },
      ]
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      width: 100,
      align: 'right' as const,
      render: (v, record) => (
        <span className={record.profitLoss >= 0 ? 'text-up' : 'text-down'} style={{ fontWeight: 600 }}>
          {formatMoney(v)}
        </span>
      ),
    },
    {
      title: '成本',
      dataIndex: 'avgCost',
      width: 100,
      align: 'right' as const,
      render: v => formatMoney(v),
    },
    {
      title: '市值',
      dataIndex: 'marketValue',
      width: 120,
      align: 'right' as const,
      render: v => formatMoney(v),
    },
    {
      title: '盈亏金额',
      width: 120,
      align: 'right' as const,
      dataIndex: 'profitLoss',
      render: v => (
        <span className={v >= 0 ? 'text-up' : 'text-down'} style={{ fontWeight: 700, fontSize: 15 }}>
          {v >= 0 ? '+' : ''}{formatMoney(v)}
        </span>
      ),
    },
    {
      title: '盈亏比例',
      width: 110,
      align: 'right' as const,
      dataIndex: 'profitLossPercent',
      render: v => (
        <span className={v >= 0 ? 'text-up' : 'text-down'} style={{ fontWeight: 700, fontSize: 14 }}>
          {formatPercent(v)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_, record) => (
        record.stock && (
          <Button 
            type="primary" 
            size="small" 
            icon={<SwapOutlined />}
            onClick={() => goToTrade(record.stock)}
            style={{ borderRadius: 8 }}
          >
            交易
          </Button>
        )
      ),
    },
  ]

  const pieOption = {
    backgroundColor: 'transparent',
    title: { 
      text: '持仓分布', 
      left: 'center', 
      top: 15,
      textStyle: { fontSize: 15, color: 'var(--text-primary)', fontWeight: 700 } 
    },
    tooltip: { 
      trigger: 'item', 
      formatter: '{b}: ¥{c}',
      backgroundColor: 'var(--bg-secondary)',
      borderColor: 'var(--border-color)',
      textStyle: { color: 'var(--text-primary)' }
    },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['50%', '58%'],
      itemStyle: { borderRadius: 8, borderColor: 'var(--bg-primary)', borderWidth: 4 },
      label: { show: true, fontSize: 12, color: 'var(--text-secondary)', formatter: '{b}\n{d}%', fontWeight: 600 },
      labelLine: { lineStyle: { color: 'var(--border-color)', width: 2 } },
      data: portfolioData.length > 0 
        ? portfolioData.map((p, i) => ({ 
            value: p.marketValue, 
            name: p.name,
            itemStyle: { color: p.profitLoss >= 0 ? `rgba(248, 81, 73, ${0.5 + i * 0.1})` : `rgba(63, 185, 80, ${0.5 + i * 0.1})` }
          }))
        : [{ value: 1, name: '暂无持仓', itemStyle: { color: 'var(--border-color)' } }]
    }]
  }

  return (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card className="card-glass animate-slide-up">
          <Statistic
            title="总市值"
            value={totalMarketValue}
            formatter={(v) => '¥ ' + formatMoney(v as number)}
            valueStyle={{ fontSize: 20, fontWeight: 700 }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card className="card-glass animate-slide-up">
          <Statistic
            title="可用资金"
            value={account.availableBalance}
            formatter={(v) => '¥ ' + formatMoney(v as number)}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: 'var(--blue-primary)' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card className="card-glass animate-slide-up">
          <Statistic
            title="总盈亏"
            value={account.totalProfitLoss}
            formatter={(v) => `${(v as number) >= 0 ? '+' : ''}¥ ` + formatMoney(v as number)}
            valueStyle={{ 
              fontSize: 20, 
              fontWeight: 700,
              color: (account.totalProfitLoss || 0) >= 0 ? 'var(--red-primary)' : 'var(--green-primary)'
            }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card className="card-glass animate-slide-up">
          <Statistic
            title="总收益率"
            value={account.profitLossPercent}
            formatter={(v) => formatPercent(v as number)}
            valueStyle={{ 
              fontSize: 20, 
              fontWeight: 700,
              color: (account.profitLossPercent || 0) >= 0 ? 'var(--red-primary)' : 'var(--green-primary)'
            }}
          />
        </Card>
      </Col>
      <Col span={7}>
        <Card className="card-glass animate-slide-up" style={{ height: 380 }}>
          <ReactECharts option={pieOption} style={{ height: 330 }} />
        </Card>
      </Col>
      <Col span={17}>
        <Card className="card-glass animate-slide-up">
          <Table
            columns={columns}
            dataSource={portfolioData}
            rowKey="code"
            pagination={false}
            size="middle"
            scroll={{ x: 1000, y: 320 }}
            locale={{
              emptyText: <Empty description="暂无持仓，快去交易吧！" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
          />
        </Card>
      </Col>
    </Row>
  )
}

export default PortfolioPage
