import { useState, useEffect, useRef } from 'react'
import { Card, Row, Col, Select, InputNumber, Button, Space, Table, Tag, message, Radio, Modal } from 'antd'
import ReactECharts from 'echarts-for-react'
import useStore from '../store/useStore'
import { formatMoney, formatVolume, formatPercent } from '../utils/format'
import dayjs from 'dayjs'

const { confirm } = Modal

function TradePage() {
  const { stocks, selectedStock, setSelectedStock, submitOrder, orders, cancelOrder, positions, updateMarketPrices, dailySettlement, trades, processOrders } = useStore()
  const [quantity, setQuantity] = useState<number>(100)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit')
  const [activeTab, setActiveTab] = useState<'orders' | 'trades'>('orders')
  const [quickRatio, setQuickRatio] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const prevOrdersRef = useRef<string[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      updateMarketPrices()
    }, 300)
    return () => clearInterval(interval)
  }, [updateMarketPrices])

  useEffect(() => {
    const interval = setInterval(() => {
      processOrders()
    }, 2000)
    return () => clearInterval(interval)
  }, [processOrders])

  useEffect(() => {
    if (!selectedStock && stocks.length > 0) {
      setSelectedStock(stocks[0])
    }
    dailySettlement()
  }, [selectedStock, stocks, setSelectedStock, dailySettlement])

  useEffect(() => {
    const currentOrderIds = orders.filter(o => o.status === 'filled' || o.status === 'partial').map(o => o.id)
    const newFills = currentOrderIds.filter(id => !prevOrdersRef.current.includes(id))
    if (newFills.length > 0) {
      message.success({ content: '🎉 有新成交！', duration: 2, style: { marginTop: '50px' } })
    }
    prevOrdersRef.current = currentOrderIds
  }, [orders])

  useEffect(() => {
    setQuantity(0)
    setQuickRatio(0)
  }, [tradeType])

  const currentStock = selectedStock || stocks[0]
  const position = positions.find(p => p.code === currentStock?.code)
  const todayOrders = orders.filter(o => dayjs(o.time).isSame(dayjs(), 'day')).sort((a, b) => b.time - a.time)
  const todayTrades = trades.filter(t => dayjs(t.time).isSame(dayjs(), 'day')).sort((a, b) => b.time - a.time)
  const account = useStore.getState().account

  if (!currentStock) return null

  const maxVol = Math.max(
    currentStock.ask1Vol, currentStock.ask2Vol, currentStock.ask3Vol, currentStock.ask4Vol, currentStock.ask5Vol,
    currentStock.bid1Vol, currentStock.bid2Vol, currentStock.bid3Vol, currentStock.bid4Vol, currentStock.bid5Vol
  )

  const askOrders = [
    { level: '卖5', price: currentStock.ask5, vol: currentStock.ask5Vol },
    { level: '卖4', price: currentStock.ask4, vol: currentStock.ask4Vol },
    { level: '卖3', price: currentStock.ask3, vol: currentStock.ask3Vol },
    { level: '卖2', price: currentStock.ask2, vol: currentStock.ask2Vol },
    { level: '卖1', price: currentStock.ask1, vol: currentStock.ask1Vol },
  ]

  const bidOrders = [
    { level: '买1', price: currentStock.bid1, vol: currentStock.bid1Vol },
    { level: '买2', price: currentStock.bid2, vol: currentStock.bid2Vol },
    { level: '买3', price: currentStock.bid3, vol: currentStock.bid3Vol },
    { level: '买4', price: currentStock.bid4, vol: currentStock.bid4Vol },
    { level: '买5', price: currentStock.bid5, vol: currentStock.bid5Vol },
  ]

  const priceData: [number, number][] = currentStock.priceHistory?.map((p: number, i: number): [number, number] => [i, p]) || []
  for (let i = priceData.length; i < 120; i++) {
    priceData.push([i, currentStock.price * (0.998 + Math.random() * 0.004)])
  }

  const handleTrade = () => {
    setLoading(true)
    setTimeout(() => {
      const result = submitOrder(currentStock.code, tradeType, orderType, currentStock.price, quantity)
      setLoading(false)
      if (result.success) {
        message.success(result.message)
        setQuantity(0)
        setQuickRatio(0)
      } else {
        message.error(result.message)
      }
    }, 300)
  }

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

  const setQuickQuantity = (ratio: number) => {
    setQuickRatio(ratio)
    if (tradeType === 'buy') {
      const maxBuy = Math.floor(account.availableBalance / currentStock.price / 100) * 100
      setQuantity(Math.floor(maxBuy * ratio))
    } else {
      const maxSell = position ? Math.floor(position.availableQuantity / 100) * 100 : 0
      setQuantity(Math.floor(maxSell * ratio))
    }
  }

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', textStyle: { color: 'var(--text-primary)' } },
    grid: { left: 50, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category', boundaryGap: false, axisLabel: { interval: 20, fontSize: 10, color: 'var(--text-tertiary)' }, axisLine: { lineStyle: { color: 'var(--border-color)' } }, splitLine: { show: false } },
    yAxis: {
      type: 'value',
      position: 'right',
      min: Math.min(...priceData.map((d: [number, number]) => d[1])) * 0.995,
      max: Math.max(...priceData.map((d: [number, number]) => d[1])) * 1.005,
      splitLine: { lineStyle: { type: 'dashed', color: 'var(--border-color)' } },
      axisLabel: { fontSize: 11, color: 'var(--text-secondary)' },
      axisLine: { show: false }
    },
    series: [{
      data: priceData.map((d: [number, number]) => d[1]),
      type: 'line',
      smooth: true,
      lineStyle: { color: currentStock.isUp ? 'var(--red-primary)' : 'var(--green-primary)', width: 2 },
      itemStyle: { color: currentStock.isUp ? 'var(--red-primary)' : 'var(--green-primary)' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: currentStock.isUp ? 'rgba(248, 81, 73, 0.2)' : 'rgba(63, 185, 80, 0.2)' }, { offset: 1, color: 'rgba(0, 0, 0, 0.01)' }] } }
    }]
  }

  const orderColumns = [
    { title: '时间', dataIndex: 'time', render: (v: number) => dayjs(v).format('HH:mm:ss'), width: 85 },
    { title: '名称', dataIndex: 'name', width: 70 },
    { title: '方向', dataIndex: 'type', render: (v: string) => <Tag color={v === 'buy' ? 'red' : 'green'}>{v === 'buy' ? '买入' : '卖出'}</Tag>, width: 60 },
    { title: '价格', dataIndex: 'price', render: (v: number) => formatMoney(v), width: 75 },
    { title: '数量', dataIndex: 'quantity', 
      render: (_: number, record: any) => record.filledQuantity > 0 && record.filledQuantity < record.quantity
        ? <span style={{ color: 'var(--orange-primary)', fontWeight: 700 }}>{record.filledQuantity}/{record.quantity}</span>
        : <span style={{ fontWeight: 500 }}>{record.quantity}</span>, 
      width: 80 
    },
    { title: '状态', dataIndex: 'status', render: (v: string) => {
      const map: Record<string, { color: string; text: string }> = {
        pending: { color: 'blue', text: '已报' },
        partial: { color: 'orange', text: '部成' },
        filled: { color: 'green', text: '已成' },
        cancelled: { color: 'default', text: '已撤' },
        rejected: { color: 'red', text: '废单' },
      }
      return <Tag color={map[v].color} style={{ fontWeight: 500 }}>{map[v].text}</Tag>
    }, width: 65 },
    {
      title: '操作',
      render: (_: any, record: any) => (record.status === 'pending' || record.status === 'partial') ? (
        <Button size="small" onClick={() => handleCancel(record.id, record.name)} style={{ height: 24, padding: '0 8px', fontSize: 12, fontWeight: 600, background: 'var(--red-light)', border: '1px solid var(--red-primary)', color: 'var(--red-primary)', borderRadius: 6 }}>撤单</Button>
      ) : null,
      width: 60
    },
  ]

  const tradeColumns = [
    { title: '成交时间', dataIndex: 'time', render: (v: number) => dayjs(v).format('HH:mm:ss'), width: 85 },
    { title: '名称', dataIndex: 'name', width: 70 },
    { title: '方向', dataIndex: 'type', render: (v: string) => <Tag color={v === 'buy' ? 'red' : 'green'}>{v === 'buy' ? '买入' : '卖出'}</Tag>, width: 60 },
    { title: '成交价', dataIndex: 'price', render: (v: number) => formatMoney(v), width: 75 },
    { title: '成交数量', dataIndex: 'quantity', width: 75 },
    { title: '成交金额', dataIndex: 'amount', render: (v: number) => formatMoney(v), width: 90 },
    { title: '手续费', dataIndex: 'fee', render: (v: any) => v?.total ? formatMoney(v.total) : '-', width: 70 },
  ]

  const quickButtons = [
    { ratio: 0.25, label: '1/4' },
    { ratio: 1/3, label: '1/3' },
    { ratio: 0.5, label: '半仓' },
    { ratio: 1, label: '全仓' },
  ]

  return (
    <Row gutter={[12, 12]}>
      <Col span={7}>
        <Card size="small" className="card-glass animate-slide-up" styles={{ body: { padding: 12 } }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Select
              style={{ width: '100%' }}
              value={currentStock.code}
              onChange={(code) => {
                const stock = stocks.find(s => s.code === code)
                if (stock) setSelectedStock(stock)
              }}
              options={stocks.map(s => ({ value: s.code, label: `${s.name} ${s.code}` }))}
              size="middle"
            />

            <div style={{ textAlign: 'center', padding: '16px 0', borderRadius: 12, marginBottom: 8, background: currentStock.isUp ? 'linear-gradient(135deg, rgba(248, 81, 73, 0.08), transparent)' : 'linear-gradient(135deg, rgba(63, 185, 80, 0.08), transparent)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 1, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }} className={currentStock.isUp ? 'text-up' : 'text-down'}>
                {formatMoney(currentStock.price)}
              </div>
              <div style={{ fontSize: 17, marginTop: 6, fontWeight: 600 }} className={currentStock.isUp ? 'text-up' : 'text-down'}>
                {currentStock.change >= 0 ? '+' : ''}{formatMoney(currentStock.change)}
                {' '}({formatPercent(currentStock.changePercent)})
              </div>
            </div>

            <Row gutter={16} style={{ fontSize: 13, padding: '0 8px', marginBottom: 8 }}>
              <Col span={8} style={{ color: 'var(--text-secondary)' }}>今开: <span className={currentStock.open >= currentStock.price ? 'text-up' : 'text-down'} style={{ fontWeight: 500 }}>{formatMoney(currentStock.open)}</span></Col>
              <Col span={8} style={{ color: 'var(--text-secondary)' }}>最高: <span className="text-up" style={{ fontWeight: 500 }}>{formatMoney(currentStock.high)}</span></Col>
              <Col span={8} style={{ color: 'var(--text-secondary)' }}>最低: <span className="text-down" style={{ fontWeight: 500 }}>{formatMoney(currentStock.low)}</span></Col>
            </Row>

            <div style={{ fontSize: 13 }} className="order-book-container">
              {askOrders.map((item, idx) => (
                <Row key={item.level} align="middle" className="order-book-row" style={{ height: 30, position: 'relative' }}>
                  <div className="order-book-fill" style={{
                    width: `${(item.vol / maxVol) * 100}%`,
                    background: `linear-gradient(90deg, rgba(248, 81, 73, ${0.08 + (4 - idx) * 0.04}), transparent)`,
                  }} />
                  <Col span={5} style={{ color: 'var(--text-tertiary)', position: 'relative', zIndex: 1, fontWeight: 500 }}>{item.level}</Col>
                  <Col span={10} className="text-up" style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, position: 'relative', zIndex: 1 }}>
                    {formatMoney(item.price)}
                  </Col>
                  <Col span={9} style={{ textAlign: 'right', color: 'var(--text-secondary)', position: 'relative', zIndex: 1, fontWeight: 500 }}>
                    {formatVolume(item.vol)}
                  </Col>
                </Row>
              ))}
              
              <Row align="middle" style={{ padding: '8px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', margin: '6px 0', height: 40, borderRadius: 8, background: 'var(--bg-glass)' }}>
                <Col span={5} style={{ color: 'var(--text-tertiary)' }}>⚡</Col>
                <Col span={10} style={{ textAlign: 'right', fontWeight: 800, fontSize: 16 }} className={currentStock.isUp ? 'text-up' : 'text-down'}>
                  {formatMoney(currentStock.price)}
                </Col>
                <Col span={9} style={{ textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {currentStock.name}
                </Col>
              </Row>

              {bidOrders.map((item, idx) => (
                <Row key={item.level} align="middle" className="order-book-row" style={{ height: 30, position: 'relative' }}>
                  <div className="order-book-fill" style={{
                    width: `${(item.vol / maxVol) * 100}%`,
                    background: `linear-gradient(90deg, rgba(63, 185, 80, ${0.08 + idx * 0.04}), transparent)`,
                  }} />
                  <Col span={5} style={{ color: 'var(--text-tertiary)', position: 'relative', zIndex: 1, fontWeight: 500 }}>{item.level}</Col>
                  <Col span={10} className="text-down" style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, position: 'relative', zIndex: 1 }}>
                    {formatMoney(item.price)}
                  </Col>
                  <Col span={9} style={{ textAlign: 'right', color: 'var(--text-secondary)', position: 'relative', zIndex: 1, fontWeight: 500 }}>
                    {formatVolume(item.vol)}
                  </Col>
                </Row>
              ))}
            </div>
          </Space>
        </Card>

        <Card size="small" className="card-glass animate-slide-up" style={{ marginTop: 12 }} styles={{ body: { padding: 14 } }}>
          <Radio.Group value={tradeType} onChange={(e) => setTradeType(e.target.value)} style={{ width: '100%', marginBottom: 16 }} buttonStyle="solid" size="large">
            <Radio.Button value="buy" style={{ width: '50%', textAlign: 'center', fontWeight: 700 }}>
              <span className="text-up">买入</span>
            </Radio.Button>
            <Radio.Button value="sell" style={{ width: '50%', textAlign: 'center', fontWeight: 700 }}>
              <span className="text-down">卖出</span>
            </Radio.Button>
          </Radio.Group>

          <Radio.Group value={orderType} onChange={(e) => setOrderType(e.target.value)} style={{ marginBottom: 16 }}>
            <Radio.Button value="limit">限价委托</Radio.Button>
            <Radio.Button value="market">市价委托</Radio.Button>
          </Radio.Group>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={12} align="middle">
              <Col span={5} style={{ color: 'var(--text-secondary)' }}>委托价格</Col>
              <Col span={19}>
                <InputNumber
                  style={{ width: '100%' }}
                  value={currentStock.price}
                  disabled={orderType === 'market'}
                  precision={2}
                  min={0}
                  size="large"
                />
              </Col>
            </Row>

            <Row gutter={12} align="middle">
              <Col span={5} style={{ color: 'var(--text-secondary)' }}>委托数量</Col>
              <Col span={19}>
                <InputNumber
                  style={{ width: '100%' }}
                  value={quantity}
                  onChange={(v) => { setQuantity(v || 0); setQuickRatio(0) }}
                  min={0}
                  step={100}
                  size="large"
                  addonAfter="股"
                />
              </Col>
            </Row>

            <Row>
              <Col span={24}>
                <Space size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
                  {quickButtons.map(({ ratio, label }) => (
                    <Button 
                      key={label}
                      size="small" 
                      onClick={() => setQuickQuantity(ratio)} 
                      style={{ 
                        flex: 1, 
                        height: 34, 
                        borderRadius: 10, 
                        fontWeight: ratio === quickRatio ? 700 : 600,
                        background: ratio === quickRatio ? 'var(--blue-light)' : 'var(--bg-glass)', 
                        border: ratio === quickRatio ? '1px solid var(--blue-primary)' : '1px solid var(--border-color)', 
                        color: ratio === quickRatio ? 'var(--blue-primary)' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                        transform: ratio === quickRatio ? 'scale(0.97)' : 'scale(1)'
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </Space>
              </Col>
            </Row>

            <Row style={{ padding: '12px 0' }}>
              <Col span={24}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>预计金额</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                  ¥ {formatMoney(currentStock.price * quantity)}
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 16, fontWeight: 'normal' }}>
                    (手续费约 {formatMoney(Math.max(currentStock.price * quantity * 0.00025, 5) + (tradeType === 'sell' ? currentStock.price * quantity * 0.001 : 0))}元)
                  </span>
                </div>
              </Col>
            </Row>

            {position && (
              <Row style={{ fontSize: 13, padding: '14px', borderRadius: 12, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }} gutter={[0, 8]}>
                <Col span={12} style={{ color: 'var(--text-secondary)' }}>持仓: <strong style={{ color: 'var(--text-primary)' }}>{position.totalQuantity}</strong> 股</Col>
                <Col span={12} style={{ color: 'var(--text-secondary)' }}>可用: <strong style={{ color: 'var(--blue-primary)' }}>{position.availableQuantity}</strong> 股</Col>
                <Col span={12} style={{ color: 'var(--text-secondary)' }}>成本: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(position.costAmount / position.totalQuantity)}</strong></Col>
                <Col span={12} style={{ color: 'var(--text-secondary)' }}>市值: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(currentStock.price * position.totalQuantity)}</strong></Col>
                <Col span={24}>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>盈亏:</span> <span style={{ 
                      color: (currentStock.price * position.totalQuantity - position.costAmount) >= 0 ? 'var(--red-primary)' : 'var(--green-primary)',
                      fontWeight: 700,
                      fontSize: 15
                    }}>
                      {formatMoney(currentStock.price * position.totalQuantity - position.costAmount)}
                      ({formatPercent(((currentStock.price - position.costAmount / position.totalQuantity) / (position.costAmount / position.totalQuantity)) * 100)})
                    </span>
                  </div>
                </Col>
              </Row>
            )}

            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              className={tradeType === 'buy' ? 'trade-btn-buy' : 'trade-btn-sell'}
              style={{ 
                height: 56, 
                fontSize: 18, 
                fontWeight: 700,
              }}
              onClick={handleTrade}
            >
              {loading ? '委托中...' : `确认${tradeType === 'buy' ? '买入' : '卖出'}`}
            </Button>
          </Space>
        </Card>
      </Col>

      <Col span={10}>
        <Card size="small" className="card-glass animate-slide-up" styles={{ body: { padding: 4 } }}>
          <ReactECharts option={chartOption} style={{ height: 320 }} opts={{ renderer: 'canvas' }} />
        </Card>

        <Card size="small" className="card-glass animate-slide-up" style={{ marginTop: 12 }} styles={{ body: { padding: 16 } }}>
          <Row gutter={[16, 12]}>
            <Col span={12}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>可用资金</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>¥ {formatMoney(account.availableBalance)}</div>
            </Col>
            <Col span={12}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>可取资金</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>¥ {formatMoney(account.withdrawableBalance)}</div>
            </Col>
            <Col span={12}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>冻结资金</div>
              <div style={{ fontSize: 15, color: 'var(--orange-primary)', fontWeight: 600 }}>¥ {formatMoney(account.frozenBalance)}</div>
            </Col>
            <Col span={12}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>持仓市值</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>¥ {formatMoney(account.marketValue)}</div>
            </Col>
          </Row>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
            💡 温馨提示：A股实行T+1交易规则，当日买入的股票，下一交易日才可卖出
          </div>
        </Card>

        <Card 
          size="small" 
          className="card-glass animate-slide-up" 
          style={{ marginTop: 12 }} 
          styles={{ body: { padding: 0 } }}
          tabList={[
            { key: 'orders', tab: '当日委托' },
            { key: 'trades', tab: '当日成交' },
          ]}

          activeTabKey={activeTab}
          onTabChange={(key) => setActiveTab(key as 'orders' | 'trades')}
        >
          <Table
            columns={activeTab === 'orders' ? orderColumns : tradeColumns}
            dataSource={activeTab === 'orders' ? todayOrders : todayTrades}
            rowKey="id"
            pagination={false}
            size="middle"
            scroll={{ y: 140 }}
          />
        </Card>
      </Col>

      <Col span={7}>
        <Card size="small" title="我的持仓" className="card-glass animate-slide-up" styles={{ body: { padding: 0 } }}>
          <Table
            columns={[
              { title: '名称', dataIndex: 'name', width: 80, render: (v) => <strong style={{ fontSize: 12 }}>{v}</strong> },
              { title: '持仓', dataIndex: 'totalQuantity', width: 65, render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
              { title: '可用', dataIndex: 'availableQuantity', width: 65, render: (v: number) => <span style={{ color: 'var(--blue-primary)', fontWeight: 600 }}>{v}</span> },
              { title: '现价', dataIndex: 'currentPrice', render: (v: number) => <span style={{ fontWeight: 600 }}>{formatMoney(v)}</span>, width: 75 },
              { title: '盈亏', render: (_: any, record: any) => {
                const stock = stocks.find(s => s.code === record.code)
                const pnl = (stock?.price || record.currentPrice) * record.totalQuantity - record.costAmount
                return <span className={pnl >= 0 ? 'text-up' : 'text-down'} style={{ fontWeight: 700 }}>{formatMoney(pnl)}</span>
              }, width: 90 },
            ]}
            dataSource={positions}
            rowKey="code"
            pagination={false}
            size="middle"
            scroll={{ y: 320 }}
            onRow={(record) => ({
              onClick: () => {
                const stock = stocks.find(s => s.code === record.code)
                if (stock) setSelectedStock(stock)
              },
              style: { cursor: 'pointer', transition: 'all 0.2s' }
            })}
          />
        </Card>
      </Col>
    </Row>
  )
}

export default TradePage
