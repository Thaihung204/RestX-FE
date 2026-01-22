import { useTranslation } from 'react-i18next';

const AdminLoginHeader: React.FC = () => {
  const { t } = useTranslation('auth');
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 flex items-center justify-center overflow-hidden">
          <img
            src="/images/logo/restx-removebg-preview.png"
            alt="RestX Logo"
            className="w-full h-full object-contain app-logo-img"
          />
        </div>
        <div>
          <h2 className="text-3xl font-bold" style={{ background: `linear-gradient(to right, #FF380B, #FF380B)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties}>{t('admin_login_header.title')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('admin_login_header.subtitle')}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <a
          href="/forgot-password"
          className="text-sm font-semibold transition-colors w-fit"
          style={{ color: '#FF380B' }}
        >
          {t('admin_login_header.forgot_password')}
        </a>
      </div>
    </div>
  );
};

export default AdminLoginHeader;
