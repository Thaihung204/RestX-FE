'use client';

import React from 'react';
import { Dropdown, Space } from 'antd';
import { GlobalOutlined, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './I18nProvider';

const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const items = [
    {
      key: 'vi',
      label: (
        <Space>
          🇻🇳 VI
        </Space>
      ),
    },
    {
      key: 'en',
      label: (
        <Space>
          🇺🇸 EN
        </Space>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{
        items,
        selectedKeys: [language],
        onClick: ({ key }) => changeLanguage(key),
      }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Space
        style={{
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: 6,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <GlobalOutlined style={{ color: '#FF380B' }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
          {language.toUpperCase()}
        </span>
        <DownOutlined style={{ fontSize: 12, color: 'var(--text-muted)' }} />
      </Space>
    </Dropdown>
  );
};

export default LanguageSwitcher;
