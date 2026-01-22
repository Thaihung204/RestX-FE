import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoginHeaderProps {
  title?: string;
}

const LoginHeader: React.FC<LoginHeaderProps> = ({ title }) => {
  const { t } = useTranslation('auth');
  const displayTitle = title || t('login_header.default_title');
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
          <img
            src="/images/logo/restx-removebg-preview.png"
            alt="RestX Logo"
            className="w-full h-full object-contain app-logo-img"
          />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">{displayTitle}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('login_header.subtitle')}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginHeader;
