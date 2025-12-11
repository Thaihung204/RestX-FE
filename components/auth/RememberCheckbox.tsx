'use client';

import React, { useState, useEffect } from 'react';
import { useThemeMode } from '../../app/theme/AutoDarkThemeProvider';

interface RememberCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const RememberCheckbox: React.FC<RememberCheckboxProps> = ({ checked, onChange }) => {
  const { mode } = useThemeMode();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && mode === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center mb-4">
      <input
        id="remember"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
        style={{
          background: isDark ? '#141927' : '#f3f4f6',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#d1d5db',
        }}
      />
      <label 
        htmlFor="remember" 
        className="ml-2 text-sm cursor-pointer"
        style={{ color: isDark ? '#ECECEC' : '#111827' }}
      >
        Keep me logged in
      </label>
    </div>
  );
};

export default RememberCheckbox;
