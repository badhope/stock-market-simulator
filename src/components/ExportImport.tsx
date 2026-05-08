import { Button, Tooltip, message } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { provinces, trendData, equityAnalysis } from '../data/gaokaoData';
import { useStore } from '../store/useStore';

export default function ExportImport() {
  const { selectedProvinces } = useStore();

  const handleExport = () => {
    const data = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      selectedProvinces,
      summary: {
        totalCandidates: 1342,
        nationalUndergraduateRate: 44.84,
        analyzedProvinces: selectedProvinces.length,
      },
      data: {
        provinces,
        trendData,
        equityAnalysis,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gaokao-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('数据导出成功');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.version && data.data) {
              message.success('数据导入成功');
            } else {
              message.error('文件格式不正确');
            }
          } catch {
            message.error('解析文件失败');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <>
      <Tooltip title="导出数据">
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出
        </Button>
      </Tooltip>
      <Tooltip title="导入数据">
        <Button icon={<UploadOutlined />} onClick={handleImport}>
          导入
        </Button>
      </Tooltip>
    </>
  );
}
