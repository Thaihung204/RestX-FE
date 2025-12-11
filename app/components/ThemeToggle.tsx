'use client';

import React from 'react';
import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useThemeMode } from '../theme/AutoDarkThemeProvider';

export default function ThemeToggle() {
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Chuyển Light mode' : 'Chuyển Dark mode'}>
      <Button
        type="text"
        onClick={toggleTheme}
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    </Tooltip>
  );
}


