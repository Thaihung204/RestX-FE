import React from 'react';

interface LoginHeaderProps {
  title?: string;
}

const LoginHeader: React.FC<LoginHeaderProps> = ({ title = 'Login' }) => {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rest<span style={{ color: '#FF7A00' }}>X</span> Login</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome to Restaurant</p>
        </div>
      </div>
    </div>
  );
};

export default LoginHeader;
