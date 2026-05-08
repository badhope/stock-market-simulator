import { Button, Dropdown, Space } from 'antd';
import { useStore } from '../store/useStore';
import { difficultyLabels } from '../data/gaokaoData';
import ExportImport from './ExportImport';
import ThemeToggle from './ThemeToggle';
import type { MenuProps } from 'antd';
import { DownOutlined, SortAscendingOutlined, FilterOutlined } from '@ant-design/icons';

export default function Navbar() {
  const { filterState, setFilterState } = useStore();

  const sortMenuItems: MenuProps['items'] = [
    { key: 'undergraduateRate', label: '本科录取率' },
    { key: 'candidates', label: '考生人数' },
    { key: 'difficulty', label: '难度等级' },
  ];

  const difficultyMenuItems: MenuProps['items'] = Object.entries(difficultyLabels).map(([key, val]) => ({
    key,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: val.color }} />
        {val.label}
      </div>
    ),
  }));

  return (
    <nav style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'linear-gradient(135deg, var(--secondary), var(--accent-green))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📊</div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>高考公平性数据平台</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Dropdown menu={{ items: sortMenuItems, selectedKeys: [filterState.sortBy], onClick: ({ key }) => setFilterState({ sortBy: key as any }) }} trigger={['click']} placement="bottomLeft">
            <Button><Space size={4}><SortAscendingOutlined />排序<DownOutlined style={{ fontSize: 10 }} /></Space></Button>
          </Dropdown>
          <Dropdown menu={{ items: difficultyMenuItems, selectedKeys: filterState.difficultyFilter.map(String), multiple: true, onClick: ({ key }) => {
            const numKey = Number(key);
            const current = filterState.difficultyFilter;
            if (current.includes(numKey)) setFilterState({ difficultyFilter: current.filter(v => v !== numKey) });
            else setFilterState({ difficultyFilter: [...current, numKey] });
          }}} trigger={['click']} placement="bottomLeft">
            <Button>
              <Space size={4}>
                <FilterOutlined />难度筛选
                {filterState.difficultyFilter.length > 0 && (
                  <span style={{ background: 'var(--secondary)', color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{filterState.difficultyFilter.length}</span>
                )}
                <DownOutlined style={{ fontSize: 10 }} />
              </Space>
            </Button>
          </Dropdown>
          <ThemeToggle />
          <ExportImport />
        </div>
      </div>
    </nav>
  );
}
