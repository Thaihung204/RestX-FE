'use client';

import React, { useState, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useThemeMode } from '../theme/AutoDarkThemeProvider';

export default function ThemeToggle() {
  const { mode, toggleTheme } = useThemeMode();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && mode === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Tooltip title={isDark ? 'Chuyển Light mode' : 'Chuyển Dark mode'}>
      <Button
        type="text"
        onClick={toggleTheme}
        icon={mounted ? (isDark ? <SunOutlined /> : <MoonOutlined />) : <MoonOutlined />}
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


