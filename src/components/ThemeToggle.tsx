import { Button, Tooltip } from 'antd';
import { BulbOutlined } from '@ant-design/icons';

export default function ThemeToggle() {
  return (
    <Tooltip title="主题切换（开发中）">
      <Button icon={<BulbOutlined />} disabled>
        主题
      </Button>
    </Tooltip>
  );
}
