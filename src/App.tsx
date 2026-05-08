import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Navbar from './components/Navbar'
import DataMiningAnalysis from './components/DataMiningAnalysis'
import AnalysisReport from './components/AnalysisReport'

const { Header, Content } = Layout

function App() {
  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Header style={{ padding: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', height: 'auto', lineHeight: 'normal' }}>
        <Navbar />
      </Header>
      <Content style={{ padding: '24px', background: 'var(--bg-primary)' }}>
        <Routes>
          <Route path="/" element={<DataMiningAnalysis />} />
          <Route path="/report" element={<AnalysisReport />} />
        </Routes>
      </Content>
    </Layout>
  )
}

export default App
