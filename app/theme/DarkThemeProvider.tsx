import React, { PropsWithChildren } from "react";
import { ConfigProvider, theme } from "antd";

const { darkAlgorithm } = theme;

const DarkThemeProvider: React.FC<PropsWithChildren> = ({ children }) => (
  <ConfigProvider
    theme={{
      algorithm: darkAlgorithm,
    }}
  >
    {children}
  </ConfigProvider>
);

export default DarkThemeProvider;

