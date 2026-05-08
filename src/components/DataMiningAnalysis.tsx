import { useState, useMemo } from 'react'
import { Card, Row, Col, Statistic, Tag, Progress, Tabs, Table } from 'antd'
import ReactECharts from 'echarts-for-react'
import { provinces, trendData, performDataMining, calculateFairnessIndex, getEducationFunnel, getRegionColor, getRegionText, difficultyLabels, dataSources } from '../data/gaokaoData'
import { useStore } from '../store/useStore'

const { TabPane } = Tabs

function DataMiningAnalysis() {
  const { selectedProvinces, filterState } = useStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [activeInsight, setActiveInsight] = useState(0)

  const filteredProvinces = useMemo(() => {
    return provinces.filter(p => {
      if (filterState.difficultyLevel && p.difficultyLevel !== filterState.difficultyLevel) return false
      if (filterState.region && p.region !== filterState.region) return false
      if (filterState.minUndergraduateRate && p.undergraduateRate < filterState.minUndergraduateRate) return false
      return selectedProvinces.length === 0 || selectedProvinces.includes(p.id)
    })
  }, [selectedProvinces, filterState])

  const fairnessIndex = calculateFairnessIndex()
  const insights = performDataMining()
  const educationFunnel = getEducationFunnel()

  const overviewChartOption = {
    title: { text: '各省份本科录取率分布', left: 'center', textStyle: { color: '#f0f6fc', fontSize: 18 } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(22, 27, 34, 0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#f0f6fc' } },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: filteredProvinces.map(p => p.name), axisLabel: { color: '#8b949e', rotate: 45 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
    yAxis: { type: 'value', name: '录取率(%)', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    series: [{
      type: 'bar',
      data: filteredProvinces.map(p => ({
        value: p.undergraduateRate,
        itemStyle: { color: p.undergraduateRate >= 50 ? '#3fb950' : p.undergraduateRate >= 35 ? '#58a6ff' : p.undergraduateRate >= 25 ? '#d29922' : '#f85149' }
      })),
      barWidth: '60%',
      label: { show: true, position: 'top', color: '#f0f6fc', fontSize: 11, formatter: '{c}%' },
    }],
  }

  const scatterChartOption = {
    title: { text: '教育投入 vs 录取率', left: 'center', textStyle: { color: '#f0f6fc', fontSize: 18 } },
    tooltip: { trigger: 'item', backgroundColor: 'rgba(22, 27, 34, 0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#f0f6fc' }, formatter: (params: any) => `${params.data.name}<br/>投入: ${params.data.value[0]}元<br/>录取率: ${params.data.value[1]}%` },
    grid: { left: '3%', right: '8%', bottom: '10%', containLabel: true },
    xAxis: { type: 'value', name: '生均教育经费(元)', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    yAxis: { type: 'value', name: '本科录取率(%)', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    series: [{
      type: 'scatter',
      data: filteredProvinces.map(p => ({ name: p.name, value: [p.educationInvestment.perStudentFunding, p.undergraduateRate], symbolSize: p.candidates / 20000 })),
      itemStyle: { color: '#58a6ff', opacity: 0.8 },
      emphasis: { scale: 1.5 },
    }],
  }

  const radarChartOption = {
    title: { text: '河南 vs 北京 多维度对比', left: 'center', textStyle: { color: '#f0f6fc', fontSize: 18 } },
    tooltip: {},
    legend: { data: ['北京', '河南'], textStyle: { color: '#f0f6fc' }, top: 30 },
    radar: {
      indicator: [
        { name: '教育投入', max: 100 }, { name: '本地高校', max: 100 }, { name: '社会流动', max: 100 },
        { name: '城市占比', max: 100 }, { name: '录取率', max: 100 }, { name: '生源质量', max: 100 }
      ],
      axisName: { color: '#8b949e' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      splitArea: { areaStyle: { color: ['rgba(88,166,255,0.05)', 'transparent'] } }
    },
    series: [{
      type: 'radar',
      data: [
        { value: [95, 90, 85, 88, 85, 92], name: '北京', lineStyle: { color: '#3fb950' }, areaStyle: { color: 'rgba(63,185,80,0.2)' } },
        { value: [25, 15, 30, 42, 26, 58], name: '河南', lineStyle: { color: '#f85149' }, areaStyle: { color: 'rgba(248,81,73,0.2)' } }
      ]
    }]
  }

  const trendChartOption = {
    title: { text: '高考录取率历年变化趋势', left: 'center', textStyle: { color: '#f0f6fc', fontSize: 18 } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(22, 27, 34, 0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#f0f6fc' } },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', data: trendData.map(t => `${t.year}`), axisLabel: { color: '#8b949e' }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
    yAxis: { type: 'value', name: '录取率(%)', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    series: [
      {
        type: 'line',
        data: trendData.map(t => t.avgUndergraduateRate),
        smooth: true,
        lineStyle: { color: '#58a6ff', width: 3 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(88,166,255,0.3)' }, { offset: 1, color: 'rgba(88,166,255,0)' }] } },
        label: { show: true, position: 'top', color: '#f0f6fc', formatter: '{c}%' },
        markPoint: {
          data: [{ type: 'max', name: '最高' }, { type: 'min', name: '最低' }],
          label: { color: '#f0f6fc' }
        }
      },
      {
        type: 'line',
        data: trendData.map(t => t.totalCandidates / 30),
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { color: '#d29922', width: 2, type: 'dashed' },
        label: { show: true, position: 'right', color: '#d29922', formatter: '{c}%' }
      }
    ]
  }

  const equityChartOption = {
    title: { text: '城乡与区域教育资源差距', left: 'center', textStyle: { color: '#f0f6fc', fontSize: 18 } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(22, 27, 34, 0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#f0f6fc' } },
    legend: { data: ['城市学生985率', '农村学生985率', '北京211数', '河南211数'], textStyle: { color: '#8b949e' }, top: 30 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: ['城乡差距', '区域差距(211)'], axisLabel: { color: '#8b949e' }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
    yAxis: { type: 'value', name: '比例/数量', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    series: [
      { name: '城市学生985率', type: 'bar', data: [65, 0], barWidth: '30%', itemStyle: { color: '#3fb950' }, label: { show: true, position: 'top', color: '#f0f6fc' } },
      { name: '农村学生985率', type: 'bar', data: [12, 0], barWidth: '30%', itemStyle: { color: '#f85149' }, label: { show: true, position: 'top', color: '#f0f6fc' } },
      { name: '北京211数', type: 'bar', data: [0, 26], barWidth: '30%', itemStyle: { color: '#58a6ff' }, label: { show: true, position: 'top', color: '#f0f6fc' } },
      { name: '河南211数', type: 'bar', data: [0, 1], barWidth: '30%', itemStyle: { color: '#d29922' }, label: { show: true, position: 'top', color: '#f0f6fc' } }
    ]
  }

  const funnelChartOption = {
    title: { text: '教育漏斗模型', left: 'center', textStyle: { color: '#f0f6fc', fontSize: 18 } },
    tooltip: { trigger: 'item', backgroundColor: 'rgba(22, 27, 34, 0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#f0f6fc' }, formatter: '{b}: {c}%' },
    series: [{
      type: 'funnel',
      left: '10%',
      top: 60,
      bottom: 60,
      width: '80%',
      min: 0,
      max: 100,
      minSize: '0%',
      maxSize: '100%',
      sort: 'descending',
      gap: 2,
      label: { show: true, position: 'inside', color: '#f0f6fc', formatter: '{b}\n{c}%' },
      labelLine: { length: 10, lineStyle: { width: 1, type: 'solid' } },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
      data: educationFunnel.map((f, i) => ({
        value: f.rate,
        name: f.stage,
        itemStyle: { color: ['#58a6ff', '#3fb950', '#d29922', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'][i] }
      }))
    }]
  }

  const insightChartOption = useMemo(() => {
    const insight = insights[activeInsight]
    if (!insight) return {}
    return {
      title: { text: insight.title, left: 'center', textStyle: { color: '#f0f6fc', fontSize: 18 } },
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(22, 27, 34, 0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#f0f6fc' } },
      grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
      xAxis: { type: 'category', data: insight.data.map(d => d.label), axisLabel: { color: '#8b949e', rotate: 45 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
      yAxis: { type: 'value', name: insight.data[0]?.unit || '', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
      series: [{ type: 'bar', data: insight.data.map((d, i) => ({ value: d.value, itemStyle: { color: ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#9b59b6', '#1abc9c', '#f39c12', '#e74c3c'][i % 8] } })), barWidth: '50%', label: { show: true, position: 'top', color: '#f0f6fc', fontSize: 10, formatter: '{c}' } }]
    }
  }, [activeInsight])

  const columns = [
    { title: '省份', dataIndex: 'name', key: 'name', render: (text: string, record: any) => <span style={{ color: getRegionColor(record.region), fontWeight: 600 }}>{text}</span> },
    { title: '区域', dataIndex: 'region', key: 'region', render: (r: string) => <Tag color={getRegionColor(r)}>{getRegionText(r)}</Tag> },
    { title: '难度', dataIndex: 'difficultyLevel', key: 'difficultyLevel', render: (level: number) => <Tag color={difficultyLabels[level].color}>{difficultyLabels[level].label}</Tag> },
    { title: '考生(万)', dataIndex: 'candidates', key: 'candidates', render: (v: number) => (v / 10000).toFixed(1) },
    { title: '本科率', dataIndex: 'undergraduateRate', key: 'undergraduateRate', render: (v: number) => <span style={{ color: v >= 50 ? '#3fb950' : v >= 35 ? '#58a6ff' : '#f85149' }}>{v}%</span> },
    { title: '985率', dataIndex: 'top985Rate', key: 'top985Rate', render: (v: number) => <span style={{ color: '#58a6ff' }}>{v}%</span> },
    { title: '211率', dataIndex: 'top211Rate', key: 'top211Rate', render: (v: number) => <span style={{ color: '#9b59b6' }}>{v}%</span> },
  ]

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-glass" size="small">
            <Statistic title={<span style={{ color: '#8b949e' }}>全国考生</span>} value={1342} suffix="万" valueStyle={{ color: '#f0f6fc', fontSize: 28 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-glass" size="small">
            <Statistic title={<span style={{ color: '#8b949e' }}>全国本科率</span>} value={44.84} suffix="%" valueStyle={{ color: '#3fb950', fontSize: 28 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-glass" size="small">
            <Statistic title={<span style={{ color: '#8b949e' }}>公平性指数</span>} value={fairnessIndex.overall} suffix="/100" valueStyle={{ color: fairnessIndex.overall >= 60 ? '#3fb950' : '#f85149', fontSize: 28 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-glass" size="small">
            <Statistic title={<span style={{ color: '#8b949e' }}>最高/最低录取率差距</span>} value={59.51} suffix="pp" valueStyle={{ color: '#f85149', fontSize: 28 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card className="card-glass" title={<span style={{ color: '#f0f6fc' }}>公平性指数详情</span>} size="small">
            <Row gutter={8}>
              <Col span={12}><Progress percent={fairnessIndex.overall} strokeColor="#3fb950" trailColor="rgba(255,255,255,0.1)" size="small" /><span style={{ color: '#8b949e', fontSize: 12 }}>整体公平</span></Col>
              <Col span={12}><Progress percent={fairnessIndex.regional} strokeColor="#58a6ff" trailColor="rgba(255,255,255,0.1)" size="small" /><span style={{ color: '#8b949e', fontSize: 12 }}>区域公平</span></Col>
              <Col span={12}><Progress percent={fairnessIndex.resource} strokeColor="#d29922" trailColor="rgba(255,255,255,0.1)" size="small" /><span style={{ color: '#8b949e', fontSize: 12 }}>资源公平</span></Col>
              <Col span={12}><Progress percent={fairnessIndex.social} strokeColor="#f85149" trailColor="rgba(255,255,255,0.1)" size="small" /><span style={{ color: '#8b949e', fontSize: 12 }}>社会公平</span></Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className="card-glass" title={<span style={{ color: '#f0f6fc' }}>隐藏因素分流</span>} size="small">
            <Row gutter={8}>
              <Col span={8}>
                <Statistic title={<span style={{ color: '#8b949e', fontSize: 11 }}>复读生</span>} value={28} suffix="%" valueStyle={{ color: '#f85149', fontSize: 20 }} />
              </Col>
              <Col span={8}>
                <Statistic title={<span style={{ color: '#8b949e', fontSize: 11 }}>高考移民</span>} value={8} suffix="%" valueStyle={{ color: '#d29922', fontSize: 20 }} />
              </Col>
              <Col span={8}>
                <Statistic title={<span style={{ color: '#8b949e', fontSize: 11 }}>国际学校</span>} value={3.4} suffix="%" valueStyle={{ color: '#58a6ff', fontSize: 20 }} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 16 }} className="custom-tabs">
        <TabPane tab="数据总览" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}><div className="chart-scroll-wrapper"><ReactECharts option={overviewChartOption} style={{ height: 400 }} /></div></Col>
            <Col xs={24} lg={12}><div className="chart-scroll-wrapper"><ReactECharts option={scatterChartOption} style={{ height: 400 }} /></div></Col>
          </Row>
        </TabPane>
        <TabPane tab="区域对比" key="region">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}><div className="chart-scroll-wrapper"><ReactECharts option={radarChartOption} style={{ height: 400 }} /></div></Col>
            <Col xs={24} lg={12}><div className="chart-scroll-wrapper"><ReactECharts option={equityChartOption} style={{ height: 400 }} /></div></Col>
          </Row>
        </TabPane>
        <TabPane tab="历年趋势" key="trend">
          <Row gutter={[16, 16]}>
            <Col xs={24}><div className="chart-scroll-wrapper"><ReactECharts option={trendChartOption} style={{ height: 400 }} /></div></Col>
          </Row>
        </TabPane>
        <TabPane tab="教育漏斗" key="funnel">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}><div className="chart-scroll-wrapper"><ReactECharts option={funnelChartOption} style={{ height: 500 }} /></div></Col>
            <Col xs={24} lg={12}>
              <Card className="card-glass" title={<span style={{ color: '#f0f6fc' }}>漏斗各阶段详情</span>} size="small" style={{ height: 500, overflow: 'auto' }}>
                {educationFunnel.map((f, i) => (
                  <div key={i} style={{ marginBottom: 16, padding: 12, background: 'var(--bg-glass)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#f0f6fc', fontWeight: 600 }}>{f.stage}</span>
                      <span style={{ color: '#58a6ff' }}>{f.rate}%</span>
                    </div>
                    <Progress percent={f.rate} strokeColor={['#58a6ff', '#3fb950', '#d29922', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'][i]} trailColor="rgba(255,255,255,0.1)" size="small" />
                    <div style={{ color: '#8b949e', fontSize: 11, marginTop: 4 }}>{f.filter} | {f.passed.toLocaleString()}人</div>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="9维度分析" key="mining">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card className="card-glass" size="small">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {insights.map((insight, i) => (
                    <Tag key={i} color={activeInsight === i ? '#58a6ff' : 'default'} style={{ cursor: 'pointer', padding: '4px 12px' }} onClick={() => setActiveInsight(i)}>{insight.category}</Tag>
                  ))}
                </div>
                {insights[activeInsight] && (
                  <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg-glass)', borderRadius: 8 }}>
                    <h4 style={{ color: '#f0f6fc', marginBottom: 8 }}>{insights[activeInsight].title}</h4>
                    <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 8 }}>{insights[activeInsight].description}</p>
                    <p style={{ color: '#f0f6fc', fontSize: 14, fontWeight: 500 }}>{insights[activeInsight].conclusion}</p>
                  </div>
                )}
              </Card>
            </Col>
            <Col xs={24}><div className="chart-scroll-wrapper"><ReactECharts option={insightChartOption} style={{ height: 400 }} /></div></Col>
          </Row>
        </TabPane>
        <TabPane tab="省份数据" key="table">
          <Card className="card-glass" size="small">
            <Table columns={columns} dataSource={filteredProvinces} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: false }} size="small" />
          </Card>
        </TabPane>
        <TabPane tab="数据来源" key="sources">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card className="card-glass" title={<span style={{ color: '#f0f6fc' }}>数据来源与引用</span>} size="small">
                <Row gutter={[16, 16]}>
                  {dataSources.map((source, i) => (
                    <Col xs={24} md={12} key={i}>
                      <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 8 }}>
                        <h4 style={{ color: '#58a6ff', marginBottom: 8 }}>{source.name}</h4>
                        <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 8 }}>{source.description}</p>
                        <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#58a6ff', fontSize: 12 }}>{source.url}</a>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default DataMiningAnalysis
