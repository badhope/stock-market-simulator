import { useEffect, useState } from 'react'
import { Table, Card, Input, Button, Row, Col, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined, SwapOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { Stock } from '../types'
import { formatMoney, formatPercent, formatVolume } from '../utils/format'

function MarketPage() {
  const navigate = useNavigate()
  const { stocks, updateMarketPrices, setSelectedStock } = useStore()
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      updateMarketPrices()
    }, 3000)
    return () => clearInterval(interval)
  }, [updateMarketPrices])

  const filteredStocks = stocks.filter(
    s => s.name.includes(searchText) || s.code.includes(searchText)
  )

  const goToTrade = (stock: Stock) => {
    setSelectedStock(stock)
    navigate('/trade')
  }

  const columns: ColumnsType<Stock> = [
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
      width: 140,
      render: (text, record) => (
        <div style={{ cursor: 'pointer' }} onClick={() => goToTrade(record)}>
          <strong style={{ fontSize: 15 }}>{text}</strong>
        </div>
      ),
    },
    {
      title: '现价',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right' as const,
      render: (value, record) => (
        <span className={record.change >= 0 ? 'text-up' : 'text-down'} style={{ fontWeight: 700, fontSize: 16 }}>
          {formatMoney(value)}
        </span>
      ),
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: '涨跌',
      dataIndex: 'change',
      key: 'change',
      width: 110,
      align: 'right' as const,
      render: (value) => (
        <span className={value >= 0 ? 'text-up' : 'text-down'} style={{ fontWeight: 600 }}>
          {value >= 0 ? '+' : ''}{formatMoney(value)}
        </span>
      ),
      sorter: (a, b) => a.change - b.change,
    },
    {
      title: '涨跌幅',
      dataIndex: 'changePercent',
      key: 'changePercent',
      width: 120,
      align: 'right' as const,
      render: (value) => (
        <span className={value >= 0 ? 'text-up' : 'text-down'} style={{ fontWeight: 700, fontSize: 15 }}>
          {formatPercent(value)}
        </span>
      ),
      sorter: (a, b) => a.changePercent - b.changePercent,
    },
    {
      title: '今开',
      dataIndex: 'open',
      key: 'open',
      width: 110,
      align: 'right' as const,
      render: (v) => formatMoney(v),
    },
    {
      title: '最高',
      dataIndex: 'high',
      key: 'high',
      width: 110,
      align: 'right' as const,
      render: (v) => <span className="text-up" style={{ fontWeight: 600 }}>{formatMoney(v)}</span>,
    },
    {
      title: '最低',
      dataIndex: 'low',
      key: 'low',
      width: 110,
      align: 'right' as const,
      render: (v) => <span className="text-down" style={{ fontWeight: 600 }}>{formatMoney(v)}</span>,
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      align: 'right' as const,
      render: (v) => <span style={{ fontWeight: 500 }}>{formatVolume(v)}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<SwapOutlined />}
          onClick={() => goToTrade(record)}
          style={{ borderRadius: 8 }}
        >
          交易
        </Button>
      ),
    },
  ]

  return (
    <Card className="card-glass animate-slide-up">
      <Row align="middle" style={{ marginBottom: 20 }}>
        <Col span={12}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            📊 行情中心
          </h2>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
            placeholder="搜索股票代码或名称..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ 
              width: 320, 
              borderRadius: 12,
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
            }}
            size="large"
          />
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={filteredStocks}
        rowKey="code"
        pagination={false}
        size="middle"
        scroll={{ x: 1200, y: 520 }}
        locale={{
          emptyText: <Empty description="未找到相关股票" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
        }}
      />
    </Card>
  )
}

export default MarketPage
