'use client';

export type ThemeMode = 'light' | 'dark';

const common = {
  token: {
    colorPrimary: '#FF7A00',
    colorPrimaryHover: '#E06000',
    colorPrimaryActive: '#E06000',
    colorLink: '#FF7A00',
    colorLinkHover: '#E06000',
    borderRadius: 14,
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 16,
  },
  components: {
    Button: {
      borderRadius: 50,
      controlHeight: 44,
      paddingInline: 24,
      fontWeight: 600,
    },
  },
};

export const lightTheme = {
  tokens: {
    ...common,
    token: {
      ...common.token,
      colorText: '#111111',
      colorTextSecondary: '#4F4F4F',
      colorBgBase: '#F7F8FA',
      colorBgContainer: '#FFFFFF',
      colorBorder: '#E5E7EB',
      colorBorderSecondary: '#F3F4F6',
    },
  },
  customColors: {
    'bg-base': '#F7F8FA',
    'surface': '#FFFFFF',
    'card': '#FFFFFF',
    'text': '#111111',
    'text-muted': '#4F4F4F',
    'border': '#E5E7EB',
    'sidebar-bg': 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    'sidebar-text': '#FFFFFF',
    'sidebar-muted': 'rgba(255,255,255,0.6)',
  },
};

export const darkTheme = {
  tokens: {
    ...common,
    token: {
      ...common.token,
      colorText: '#ECECEC',
      colorTextSecondary: '#C5C5C5',
      colorBgBase: '#0E121A',
      colorBgContainer: '#141927',
      colorBorder: '#1F2433',
      colorBorderSecondary: '#222837',
    },
    components: {
      ...common.components,
      Modal: {
        contentBg: '#0A0E14',
        headerBg: '#0A0E14',
        titleColor: '#ECECEC',
      },
      Card: {
        actionsBg: '#0A0E14',
      },
    },
  },
  customColors: {
    'bg-base': '#0E121A',
    'surface': '#141927',
    'card': '#141927',
    'text': '#ECECEC',
    'text-muted': '#C5C5C5',
    'border': '#1F2433',
    'sidebar-bg': 'linear-gradient(180deg, #0f172a 0%, #0b1222 100%)',
    'sidebar-text': '#FFFFFF',
    'sidebar-muted': 'rgba(255,255,255,0.6)',
  },
};


