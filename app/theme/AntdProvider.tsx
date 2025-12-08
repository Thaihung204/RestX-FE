'use client';

import React from 'react';
import { ConfigProvider } from 'antd';

const theme = {
  token: {
    colorPrimary: '#FF7A00',
    colorPrimaryHover: '#E06000',
    colorPrimaryActive: '#E06000',
    colorLink: '#FF7A00',
    colorLinkHover: '#E06000',
    borderRadius: 14,
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 16,
    colorText: '#111111',
    colorTextSecondary: '#4F4F4F',
    colorBgContainer: '#FFFFFF',
    colorBorder: '#E5E7EB',
    colorBorderSecondary: '#F3F4F6',
  },
  components: {
    Button: {
      borderRadius: 50,
      controlHeight: 44,
      paddingInline: 24,
      fontWeight: 600,
    },
    Menu: {
      itemColor: '#111111',
      itemHoverColor: '#FF7A00',
      horizontalItemHoverColor: '#FF7A00',
    },
  },
};

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  );
}

