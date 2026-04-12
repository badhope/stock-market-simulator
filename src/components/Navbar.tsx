import { Row, Col, Space, Badge } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import useStore from '../store/useStore'
import { formatMoney, formatPercent } from '../utils/format'

function Navbar() {
  const location = useLocation()
  const { account } = useStore()

  const menuItems = [
    { key: '/', label: '行情中心', icon: '📊' },
    { key: '/trade', label: '交易', icon: '💹' },
    { key: '/portfolio', label: '我的持仓', icon: '💼' },
    { key: '/history', label: '成交记录', icon: '📜' },
  ]

  const dayPnl = account.totalAssets - account.initialBalance
  const dayPnlPercent = (dayPnl / account.initialBalance) * 100

  return (
    <Row align="middle" style={{ padding: '0 24px', height: '100%' }}>
      <Col span={5}>
        <h2 style={{ 
          margin: 0, 
          color: 'var(--text-primary)', 
          fontSize: 20, 
          fontWeight: 800,
          letterSpacing: 1
        }}>
          <span style={{ color: 'var(--blue-primary)' }}>⚡</span> STOCK MARKET
        </h2>
      </Col>
      <Col span={11}>
        <Space size={4}>
          {menuItems.map(item => (
            <Link to={item.key} key={item.key}>
              <div style={{
                padding: '10px 18px',
                borderRadius: 10,
                fontWeight: location.pathname === item.key ? 700 : 500,
                fontSize: 14,
                transition: 'all 0.2s',
                background: location.pathname === item.key ? 'var(--blue-light)' : 'transparent',
                color: location.pathname === item.key ? 'var(--blue-primary)' : 'var(--text-secondary)',
                border: location.pathname === item.key ? '1px solid var(--blue-primary)' : '1px solid transparent',
              }}>
                {item.icon} {item.label}
              </div>
            </Link>
          ))}
        </Space>
      </Col>
      <Col span={8} style={{ textAlign: 'right' }}>
        <Space size="large" style={{ alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>总资产</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
              ¥ {formatMoney(account.totalAssets)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>可用资金</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              ¥ {formatMoney(account.availableBalance)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>
              累计盈亏
            </div>
            <Badge 
              count={dayPnl >= 0 ? `+${formatPercent(dayPnlPercent)}` : formatPercent(dayPnlPercent)}
              color={dayPnl >= 0 ? 'var(--red-primary)' : 'var(--green-primary)'}
              style={{ fontFamily: 'inherit', fontWeight: 700 }}
              offset={[8, -4]}
            >
              <div 
                className={dayPnl >= 0 ? 'text-up' : 'text-down'} 
                style={{ fontSize: 16, fontWeight: 700 }}
              >
                {dayPnl >= 0 ? '+' : ''}¥ {formatMoney(dayPnl)}
              </div>
            </Badge>
          </div>
        </Space>
      </Col>
    </Row>
  )
}

export default Navbar
