'use client';

import React from 'react';

interface RememberCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const RememberCheckbox: React.FC<RememberCheckboxProps> = ({ checked, onChange }) => {
  return (
    <div className="flex items-center mb-4">
      <input
        id="remember"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer auth-checkbox"
      />
      <label 
        htmlFor="remember" 
        className="ml-2 text-sm cursor-pointer auth-text"
      >
        Keep me logged in
      </label>
    </div>
  );
};

export default RememberCheckbox;
