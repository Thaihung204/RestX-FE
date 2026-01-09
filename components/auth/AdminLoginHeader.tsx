import React from 'react';

const AdminLoginHeader: React.FC = () => {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rest<span style={{ color: '#FF7A00' }}>X</span> Admin</h1>
          <p className="text-sm text-gray-600 mt-1">Restaurant Management System</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <a
          href="/forgot-password"
          className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors w-fit"
        >
          Forgot your password?
        </a>
      </div>
    </div>
  );
};

export default AdminLoginHeader;
