import React from 'react';

const AdminLoginHeader: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">Admin Portal</h2>
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
