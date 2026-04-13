import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Navbar from './components/Navbar'
import MarketPage from './pages/MarketPage'
import TradePage from './pages/TradePage'
import PortfolioPage from './pages/PortfolioPage'
import HistoryPage from './pages/HistoryPage'

const { Header, Content } = Layout

function App() {
  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Header style={{ padding: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <Navbar />
      </Header>
      <Content style={{ padding: '24px', background: 'var(--bg-primary)' }}>
        <Routes>
          <Route path="/" element={<MarketPage />} />
          <Route path="/trade" element={<TradePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Content>
    </Layout>
  )
}

export default App
